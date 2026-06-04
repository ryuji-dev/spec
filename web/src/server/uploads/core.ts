import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { attachments, posts } from "@/server/db/schema";
import {
  type UploadPolicy,
  extOf,
  preCheck,
  resolveMime,
} from "@/lib/upload-policy";

export type StoredAttachment = { id: string; name: string; sizeBytes: number; mime: string };

export class UploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type Section = "committee" | "resource" | "training";

export type AttachmentStore = {
  uploadPath: (storedName: string) => string;
  storeAttachment: (postId: string, file: File) => Promise<StoredAttachment>;
  deleteAttachment: (id: string) => Promise<void>;
  deletePostFiles: (postId: string) => Promise<void>;
};

// 섹션별 설정으로 첨부 저장소를 만든다(디렉터리·section·정책 + 사용자 메시지).
export function createAttachmentStore(config: {
  uploadDir: string;
  section: Section;
  policy: UploadPolicy;
  notFoundMessage: string;
  tooManyMessage: string;
  tooLargeMessage: string;
}): AttachmentStore {
  const { uploadDir, section, policy } = config;

  function uploadPath(storedName: string): string {
    return join(uploadDir, storedName);
  }

  async function ensureCapacity(postId: string, incomingBytes: number) {
    const [agg] = await getDb()
      .select({
        n: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${attachments.sizeBytes}),0)::bigint`,
      })
      .from(attachments)
      .where(eq(attachments.postId, postId));
    const count = Number(agg?.n ?? 0);
    const total = Number(agg?.total ?? 0);
    if (count + 1 > policy.maxFiles) throw new UploadError("TOO_MANY", config.tooManyMessage);
    if (total + incomingBytes > policy.maxTotalBytes)
      throw new UploadError("TOO_LARGE_TOTAL", config.tooLargeMessage);
  }

  async function storeAttachment(postId: string, file: File): Promise<StoredAttachment> {
    const ext = extOf(file.name);
    const pre = preCheck(policy, file.name, file.size);
    if (pre) throw new UploadError("INVALID_FILE", pre);

    const [target] = await getDb()
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.section, section)))
      .limit(1);
    if (!target) throw new UploadError("POST_NOT_FOUND", config.notFoundMessage);

    await ensureCapacity(postId, file.size);

    const buf = Buffer.from(await file.arrayBuffer());
    const detected = (await fileTypeFromBuffer(buf)) ?? null;
    const mime = resolveMime(policy, ext, detected);
    if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

    await mkdir(uploadDir, { recursive: true });
    const storedName = `${randomUUID()}.${ext}`;
    await writeFile(join(uploadDir, storedName), buf);

    const [row] = await getDb()
      .insert(attachments)
      .values({ postId, originalName: file.name, storedName, mime, sizeBytes: file.size })
      .returning({ id: attachments.id });

    return { id: row.id, name: file.name, sizeBytes: file.size, mime };
  }

  async function deleteAttachment(id: string): Promise<void> {
    const db = getDb();
    const [row] = await db
      .select({ storedName: attachments.storedName })
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);
    if (!row) return;
    await db.delete(attachments).where(eq(attachments.id, id));
    await unlink(uploadPath(row.storedName)).catch(() => {});
  }

  async function deletePostFiles(postId: string): Promise<void> {
    const rows = await getDb()
      .select({ storedName: attachments.storedName })
      .from(attachments)
      .where(eq(attachments.postId, postId));
    await Promise.all(rows.map((r) => unlink(uploadPath(r.storedName)).catch(() => {})));
  }

  return { uploadPath, storeAttachment, deleteAttachment, deletePostFiles };
}
