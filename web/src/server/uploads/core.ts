import "server-only";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { createSupabaseService } from "@/server/supabase/service";
import {
  type UploadPolicy,
  extOf,
  preCheck,
  resolveMime,
} from "@/lib/upload-policy";

const BUCKET = "attachments";

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
  storeAttachment: (postId: string, file: File) => Promise<StoredAttachment>;
  deleteAttachment: (id: string) => Promise<void>;
  deletePostFiles: (postId: string) => Promise<void>;
};

// 섹션별 설정으로 첨부 저장소를 만든다(section·정책 + 사용자 메시지).
// 저장은 Supabase Storage 버킷('attachments'), 경로는 `{section}/{postId}/{uuid.ext}`.
// admin 게이트는 라우트 핸들러가 수행하므로 여기선 service-role 클라이언트로 RLS 우회.
export function createAttachmentStore(config: {
  section: Section;
  policy: UploadPolicy;
  notFoundMessage: string;
  tooManyMessage: string;
  tooLargeMessage: string;
}): AttachmentStore {
  const { section, policy } = config;

  async function ensureCapacity(postId: string, incomingBytes: number) {
    const supabase = createSupabaseService();
    const { data } = await supabase
      .from("attachments")
      .select("size_bytes")
      .eq("post_id", postId);
    const rows = data ?? [];
    const count = rows.length;
    const total = rows.reduce((s, r) => s + Number(r.size_bytes), 0);
    if (count + 1 > policy.maxFiles) throw new UploadError("TOO_MANY", config.tooManyMessage);
    if (total + incomingBytes > policy.maxTotalBytes)
      throw new UploadError("TOO_LARGE_TOTAL", config.tooLargeMessage);
  }

  async function storeAttachment(postId: string, file: File): Promise<StoredAttachment> {
    const ext = extOf(file.name);
    const pre = preCheck(policy, file.name, file.size);
    if (pre) throw new UploadError("INVALID_FILE", pre);

    const supabase = createSupabaseService();
    const { data: target } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("section", section)
      .maybeSingle();
    if (!target) throw new UploadError("POST_NOT_FOUND", config.notFoundMessage);

    await ensureCapacity(postId, file.size);

    const buf = Buffer.from(await file.arrayBuffer());
    const detected = (await fileTypeFromBuffer(buf)) ?? null;
    const mime = resolveMime(policy, ext, detected);
    if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

    // 저장 파일명(경로)은 서버에서 재생성 — 원본 파일명 그대로 저장하지 않음(헌법 보안).
    const storedName = `${section}/${postId}/${randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storedName, buf, { contentType: mime, upsert: false });
    if (upErr) throw new UploadError("STORAGE_FAILED", "파일 저장에 실패했습니다.");

    const { data: row, error: dbErr } = await supabase
      .from("attachments")
      .insert({ post_id: postId, original_name: file.name, stored_name: storedName, mime, size_bytes: file.size })
      .select("id")
      .single();
    if (dbErr || !row) {
      // DB 기록 실패 시 업로드된 오브젝트 정리
      await supabase.storage.from(BUCKET).remove([storedName]);
      throw new UploadError("DB_FAILED", "첨부 정보 저장에 실패했습니다.");
    }

    return { id: row.id, name: file.name, sizeBytes: file.size, mime };
  }

  async function deleteAttachment(id: string): Promise<void> {
    const supabase = createSupabaseService();
    const { data: row } = await supabase
      .from("attachments")
      .select("stored_name")
      .eq("id", id)
      .maybeSingle();
    if (!row) return;
    await supabase.from("attachments").delete().eq("id", id);
    await supabase.storage.from(BUCKET).remove([row.stored_name]);
  }

  async function deletePostFiles(postId: string): Promise<void> {
    const supabase = createSupabaseService();
    const { data } = await supabase
      .from("attachments")
      .select("stored_name")
      .eq("post_id", postId);
    const paths = (data ?? []).map((r) => r.stored_name);
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
    // attachments 행은 posts 삭제 시 FK cascade로 정리된다.
  }

  return { storeAttachment, deleteAttachment, deletePostFiles };
}

// 다운로드용 — 첨부 Blob + 메타데이터를 Storage에서 가져온다(섹션 무관, stored_name이 풀 경로).
export async function readAttachment(
  id: string,
): Promise<{ blob: Blob; originalName: string; mime: string; postId: string } | null> {
  const supabase = createSupabaseService();
  const { data: row } = await supabase
    .from("attachments")
    .select("stored_name, original_name, mime, post_id, post:posts(is_published)")
    .eq("id", id)
    .maybeSingle();
  if (!row) return null;
  // service-role은 RLS를 우회하므로, 비공개(미게시) 글의 첨부가 노출되지 않도록 직접 확인.
  const post = Array.isArray(row.post) ? row.post[0] : row.post;
  if (!post?.is_published) return null;
  const { data: blob, error } = await supabase.storage.from(BUCKET).download(row.stored_name);
  if (error || !blob) return null;
  return { blob, originalName: row.original_name, mime: row.mime, postId: row.post_id };
}
