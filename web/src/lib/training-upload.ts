// 교역자수련회 첨부 정책. 검증 로직은 lib/upload-policy 코어를 사용.
import {
  type UploadPolicy,
  extOf as coreExtOf,
  preCheck as corePreCheck,
  resolveMime as coreResolveMime,
} from "./upload-policy.ts";

export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_FILES_PER_POST = 50;
export const MAX_TOTAL_BYTES = 300 * 1024 * 1024; // 300MB

export const TRAINING_UPLOAD: UploadPolicy = {
  allowedExt: {
    png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
    pdf: "pdf",
    docx: "office-zip", pptx: "office-zip", xlsx: "office-zip", hwpx: "office-zip",
    hwp: "hwp-cfb",
  },
  maxFileBytes: MAX_FILE_BYTES,
  maxFiles: MAX_FILES_PER_POST,
  maxTotalBytes: MAX_TOTAL_BYTES,
  maxFileLabel: "20MB",
};

export const extOf = coreExtOf;
export function preCheck(filename: string, sizeBytes: number): string | null {
  return corePreCheck(TRAINING_UPLOAD, filename, sizeBytes);
}
export function resolveMime(
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  return coreResolveMime(TRAINING_UPLOAD, ext, detected);
}
