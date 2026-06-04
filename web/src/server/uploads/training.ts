import "server-only";
import { join } from "node:path";
import { createAttachmentStore, UploadError, type StoredAttachment } from "./core";
import { TRAINING_UPLOAD } from "@/lib/training-upload";

const UPLOAD_DIR = join(process.cwd(), "uploads", "training");

const store = createAttachmentStore({
  uploadDir: UPLOAD_DIR,
  section: "training",
  policy: TRAINING_UPLOAD,
  notFoundMessage: "게시물을 찾을 수 없습니다.",
  tooManyMessage: `첨부는 게시물당 ${TRAINING_UPLOAD.maxFiles}개까지입니다.`,
  tooLargeMessage: "게시물 첨부 합계 용량(300MB)을 초과합니다.",
});

export { UploadError };
export type { StoredAttachment };
export const uploadPath = store.uploadPath;
export const storeAttachment = store.storeAttachment;
export const deleteAttachment = store.deleteAttachment;
export const deletePostFiles = store.deletePostFiles;
