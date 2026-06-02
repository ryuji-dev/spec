// 자료공유 첨부 정책 + 순수 검증. 클라이언트(사전 차단)·서버(최종 검증) 공용.
export const RES_MAX_FILE_BYTES = 300 * 1024 * 1024; // 300MB
export const RES_MAX_FILES = 20;
export const RES_MAX_TOTAL_BYTES = 500 * 1024 * 1024; // 500MB

export type ResUploadKind =
  | "image" | "pdf" | "office-zip" | "hwp-cfb"
  | "video" | "audio" | "archive" | "psd" | "ai";

export const RES_ALLOWED_EXT: Record<string, ResUploadKind> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  pdf: "pdf",
  docx: "office-zip", pptx: "office-zip", xlsx: "office-zip", hwpx: "office-zip",
  hwp: "hwp-cfb",
  mp4: "video", mov: "video", webm: "video",
  mp3: "audio", wav: "audio",
  zip: "archive",
  psd: "psd",
  ai: "ai",
};

export function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i < 0 ? "" : filename.slice(i + 1).toLowerCase();
}

export function preCheck(filename: string, sizeBytes: number): string | null {
  const ext = extOf(filename);
  if (!(ext in RES_ALLOWED_EXT)) return "허용되지 않은 형식입니다.";
  if (sizeBytes > RES_MAX_FILE_BYTES) return "파일이 300MB를 초과합니다.";
  if (sizeBytes <= 0) return "빈 파일입니다.";
  return null;
}

export function resolveMime(
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  const kind = RES_ALLOWED_EXT[ext];
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
    case "video":
      return dext === ext && !!dmime && dmime.startsWith("video/") ? dmime : null;
    case "audio":
      return dext === ext && !!dmime && dmime.startsWith("audio/") ? dmime : null;
    case "archive":
      return dext === "zip" ? "application/zip" : null;
    case "psd":
      return dext === "psd" ? "image/vnd.adobe.photoshop" : null;
    case "ai":
      return dmime === "application/pdf" || dmime === "application/postscript"
        ? "application/illustrator"
        : null;
  }
}
