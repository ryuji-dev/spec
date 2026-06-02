import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { attachments, posts } from "@/server/db/schema";
import {
  extOf,
  preCheck,
  resolveMime,
  RES_MAX_FILES,
  RES_MAX_TOTAL_BYTES,
} from "@/lib/resource-upload";

// 자료 파일 저장 루트 — 컨테이너 볼륨.
export const RESOURCE_UPLOAD_DIR = join(process.cwd(), "uploads", "resource");

export function resourceUploadPath(storedName: string): string {
  return join(RESOURCE_UPLOAD_DIR, storedName);
}

export type StoredAttachment = { id: string; name: string; sizeBytes: number; mime: string };

export class UploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
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
  if (count + 1 > RES_MAX_FILES)
    throw new UploadError("TOO_MANY", `첨부는 자료당 ${RES_MAX_FILES}개까지입니다.`);
  if (total + incomingBytes > RES_MAX_TOTAL_BYTES)
    throw new UploadError("TOO_LARGE_TOTAL", "자료 첨부 합계 용량(500MB)을 초과합니다.");
}

export async function storeResourceAttachment(postId: string, file: File): Promise<StoredAttachment> {
  const ext = extOf(file.name);
  const pre = preCheck(file.name, file.size);
  if (pre) throw new UploadError("INVALID_FILE", pre);

  // 대상이 실제 존재하는 resource 글인지 확인
  const [target] = await getDb()
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.section, "resource")))
    .limit(1);
  if (!target) throw new UploadError("POST_NOT_FOUND", "자료를 찾을 수 없습니다.");

  await ensureCapacity(postId, file.size);

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = (await fileTypeFromBuffer(buf)) ?? null;
  const mime = resolveMime(ext, detected);
  if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

  await mkdir(RESOURCE_UPLOAD_DIR, { recursive: true });
  const storedName = `${randomUUID()}.${ext}`;
  await writeFile(join(RESOURCE_UPLOAD_DIR, storedName), buf);

  const [row] = await getDb()
    .insert(attachments)
    .values({ postId, originalName: file.name, storedName, mime, sizeBytes: file.size })
    .returning({ id: attachments.id });

  return { id: row.id, name: file.name, sizeBytes: file.size, mime };
}

export async function deleteResourceAttachment(id: string): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  if (!row) return;
  await db.delete(attachments).where(eq(attachments.id, id));
  await unlink(resourceUploadPath(row.storedName)).catch(() => {});
}

export async function deleteResourcePostFiles(postId: string): Promise<void> {
  const rows = await getDb()
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(eq(attachments.postId, postId));
  await Promise.all(rows.map((r) => unlink(resourceUploadPath(r.storedName)).catch(() => {})));
}
