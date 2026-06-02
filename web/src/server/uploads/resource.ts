import "server-only";
import { join } from "node:path";
import { createAttachmentStore, UploadError, type StoredAttachment } from "./core";
import { RESOURCE_UPLOAD } from "@/lib/resource-upload";

export const RESOURCE_UPLOAD_DIR = join(process.cwd(), "uploads", "resource");

const store = createAttachmentStore({
  uploadDir: RESOURCE_UPLOAD_DIR,
  section: "resource",
  policy: RESOURCE_UPLOAD,
  notFoundMessage: "자료를 찾을 수 없습니다.",
  tooManyMessage: `첨부는 자료당 ${RESOURCE_UPLOAD.maxFiles}개까지입니다.`,
  tooLargeMessage: "자료 첨부 합계 용량(500MB)을 초과합니다.",
});

export { UploadError };
export type { StoredAttachment };
export const resourceUploadPath = store.uploadPath;
export const storeResourceAttachment = store.storeAttachment;
export const deleteResourceAttachment = store.deleteAttachment;
export const deleteResourcePostFiles = store.deletePostFiles;
