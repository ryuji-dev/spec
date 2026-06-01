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
  MAX_FILES_PER_POST,
  MAX_TOTAL_BYTES,
} from "@/lib/committee-upload";

// 업로드 루트 — 컨테이너 볼륨 마운트 지점. 실행 권한 없음.
const UPLOAD_DIR = join(process.cwd(), "uploads", "committee");

export type StoredAttachment = {
  id: string;
  name: string;
  sizeBytes: number;
  mime: string;
};

export class UploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// 게시물당 개수·합계 용량 확인
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
  if (count + 1 > MAX_FILES_PER_POST)
    throw new UploadError("TOO_MANY", `첨부는 게시물당 ${MAX_FILES_PER_POST}개까지입니다.`);
  if (total + incomingBytes > MAX_TOTAL_BYTES)
    throw new UploadError("TOO_LARGE_TOTAL", "게시물 첨부 합계 용량(300MB)을 초과합니다.");
}

// 단일 파일 검증·저장·DB 기록
export async function storeAttachment(postId: string, file: File): Promise<StoredAttachment> {
  const ext = extOf(file.name);
  const pre = preCheck(file.name, file.size);
  if (pre) throw new UploadError("INVALID_FILE", pre);

  // 대상 게시물이 실제 존재하는 committee 글인지 확인 (비정상 postId의 FK 500·타섹션 첨부 방지)
  const [target] = await getDb()
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.section, "committee")))
    .limit(1);
  if (!target) throw new UploadError("POST_NOT_FOUND", "게시물을 찾을 수 없습니다.");

  await ensureCapacity(postId, file.size);

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = (await fileTypeFromBuffer(buf)) ?? null;
  const mime = resolveMime(ext, detected);
  if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const storedName = `${randomUUID()}.${ext}`;
  await writeFile(join(UPLOAD_DIR, storedName), buf);

  const [row] = await getDb()
    .insert(attachments)
    .values({
      postId,
      originalName: file.name,
      storedName,
      mime,
      sizeBytes: file.size,
    })
    .returning({ id: attachments.id });

  return { id: row.id, name: file.name, sizeBytes: file.size, mime };
}

export function uploadPath(storedName: string): string {
  return join(UPLOAD_DIR, storedName);
}

// 첨부 행 + 디스크 파일 삭제 (개별)
export async function deleteAttachment(id: string): Promise<void> {
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

// 글 삭제 전 디스크 파일 정리 (DB 행은 cascade로 삭제됨)
export async function deletePostFiles(postId: string): Promise<void> {
  const rows = await getDb()
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(eq(attachments.postId, postId));
  await Promise.all(rows.map((r) => unlink(uploadPath(r.storedName)).catch(() => {})));
}
