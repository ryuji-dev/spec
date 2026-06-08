// 자료공유 첨부 정책. 검증 로직은 lib/upload-policy 코어를 사용.
import {
  type UploadPolicy,
  extOf as coreExtOf,
  preCheck as corePreCheck,
  resolveMime as coreResolveMime,
} from "./upload-policy.ts";

export const RES_MAX_FILE_BYTES = 300 * 1024 * 1024; // 300MB
export const RES_MAX_FILES = 20;
export const RES_MAX_TOTAL_BYTES = 500 * 1024 * 1024; // 500MB

export const RESOURCE_UPLOAD: UploadPolicy = {
  allowedExt: {
    png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
    pdf: "pdf",
    docx: "office-zip", pptx: "office-zip", xlsx: "office-zip", hwpx: "office-zip",
    hwp: "hwp-cfb",
    mp4: "video", mov: "video", webm: "video",
    mp3: "audio", wav: "audio",
    zip: "archive",
    psd: "psd",
    ai: "ai",
  },
  maxFileBytes: RES_MAX_FILE_BYTES,
  maxFiles: RES_MAX_FILES,
  maxTotalBytes: RES_MAX_TOTAL_BYTES,
  maxFileLabel: "300MB",
};

export const extOf = coreExtOf;
export function preCheck(filename: string, sizeBytes: number): string | null {
  return corePreCheck(RESOURCE_UPLOAD, filename, sizeBytes);
}
export function resolveMime(
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  return coreResolveMime(RESOURCE_UPLOAD, ext, detected);
}
