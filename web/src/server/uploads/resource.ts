import "server-only";
import { join } from "node:path";

// 자료 파일 저장 루트 — 컨테이너 볼륨. (Plan B가 storeAttachment 등 추가)
export const RESOURCE_UPLOAD_DIR = join(process.cwd(), "uploads", "resource");

export function resourceUploadPath(storedName: string): string {
  return join(RESOURCE_UPLOAD_DIR, storedName);
}
