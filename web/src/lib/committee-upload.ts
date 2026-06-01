// 교육위원회 첨부 정책 + 순수 검증. 클라이언트(사전 차단)·서버(최종 검증) 공용.
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_FILES_PER_POST = 50;
export const MAX_TOTAL_BYTES = 300 * 1024 * 1024; // 300MB

// 확장자 → 카테고리. office/hwpx는 zip 컨테이너, hwp는 CFB(OLE).
export type UploadKind = "image" | "pdf" | "office-zip" | "hwp-cfb";

export const ALLOWED_EXT: Record<string, UploadKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  pdf: "pdf",
  docx: "office-zip",
  pptx: "office-zip",
  xlsx: "office-zip",
  hwpx: "office-zip",
  hwp: "hwp-cfb",
};

export function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i < 0 ? "" : filename.slice(i + 1).toLowerCase();
}

// 클라이언트 사전 검증(확장자·용량). 통과해도 서버가 매직바이트로 재검증.
export function preCheck(filename: string, sizeBytes: number): string | null {
  const ext = extOf(filename);
  if (!(ext in ALLOWED_EXT)) return "허용되지 않은 형식입니다.";
  if (sizeBytes > MAX_FILE_BYTES) return "파일이 20MB를 초과합니다.";
  if (sizeBytes <= 0) return "빈 파일입니다.";
  return null;
}

// 서버 매직바이트 검증 결정. detected = file-type 결과(ext/mime) 또는 null.
// 반환: 통과 시 저장할 mime, 실패 시 null.
export function resolveMime(
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  const kind = ALLOWED_EXT[ext];
  if (!kind) return null;
  const dext = detected?.ext;
  const dmime = detected?.mime;
  switch (kind) {
    case "image": {
      if (!dmime || !dmime.startsWith("image/")) return null;
      const want = ext === "jpg" ? "jpeg" : ext;
      const got = dext === "jpg" ? "jpeg" : dext;
      return got === want ? dmime : null;
    }
    case "pdf":
      return dmime === "application/pdf" ? dmime : null;
    case "office-zip": {
      const okExts = new Set([ext, "zip"]);
      if (dext && okExts.has(dext)) {
        const map: Record<string, string> = {
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          hwpx: "application/hwp+zip",
        };
        return map[ext] ?? "application/zip";
      }
      return null;
    }
    case "hwp-cfb":
      return dext === "cfb" ? "application/x-hwp" : null;
  }
}
