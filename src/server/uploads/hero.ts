import "server-only";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { createSupabaseService } from "@/server/supabase/service";
import { extOf, preCheck, resolveMime, type UploadPolicy } from "@/lib/upload-policy";
import { HERO_IMAGE_EXT } from "@/lib/hero";
import { UploadError } from "./core";

const BUCKET = "hero";

const HERO_POLICY: UploadPolicy = {
  allowedExt: HERO_IMAGE_EXT,
  maxFileBytes: 8 * 1024 * 1024, // 8MB
  maxFiles: 1,
  maxTotalBytes: 8 * 1024 * 1024,
  maxFileLabel: "8MB",
};

// 공개 hero 버킷에 이미지 1장 저장. 저장 경로(파일명)는 서버에서 재생성.
export async function storeHeroImage(file: File): Promise<{ imagePath: string }> {
  const ext = extOf(file.name);
  const pre = preCheck(HERO_POLICY, file.name, file.size);
  if (pre) throw new UploadError("INVALID_FILE", pre);

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = (await fileTypeFromBuffer(buf)) ?? null;
  const mime = resolveMime(HERO_POLICY, ext, detected);
  if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

  const imagePath = `${randomUUID()}.${ext}`;
  const supabase = createSupabaseService();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, buf, { contentType: mime, upsert: false });
  if (error) throw new UploadError("STORAGE_FAILED", "이미지 저장에 실패했습니다.");
  return { imagePath };
}

export async function deleteHeroImage(imagePath: string): Promise<void> {
  const supabase = createSupabaseService();
  await supabase.storage.from(BUCKET).remove([imagePath]);
}

// 공개 URL 변환.
export function heroPublicUrl(imagePath: string): string {
  const supabase = createSupabaseService();
  return supabase.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl;
}
