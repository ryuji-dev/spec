import "server-only";
import { createAttachmentStore, UploadError, type StoredAttachment } from "./core";
import { COMMITTEE_UPLOAD } from "@/lib/committee-upload";

const store = createAttachmentStore({
  section: "committee",
  policy: COMMITTEE_UPLOAD,
  notFoundMessage: "게시물을 찾을 수 없습니다.",
  tooManyMessage: `첨부는 게시물당 ${COMMITTEE_UPLOAD.maxFiles}개까지입니다.`,
  tooLargeMessage: "게시물 첨부 합계 용량(300MB)을 초과합니다.",
});

export { UploadError };
export type { StoredAttachment };
export const storeAttachment = store.storeAttachment;
export const deleteAttachment = store.deleteAttachment;
export const deletePostFiles = store.deletePostFiles;
