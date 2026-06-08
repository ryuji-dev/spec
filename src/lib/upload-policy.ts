// 업로드 정책 엔진 — 클라이언트 안전 순수. 섹션별 정책을 주입해 검증.
export type UploadKind =
  | "image" | "pdf" | "office-zip" | "hwp-cfb"
  | "video" | "audio" | "archive" | "psd" | "ai";

export type UploadPolicy = {
  allowedExt: Record<string, UploadKind>;
  maxFileBytes: number;
  maxFiles: number;
  maxTotalBytes: number;
  maxFileLabel: string;
};

export function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i < 0 ? "" : filename.slice(i + 1).toLowerCase();
}

export function preCheck(policy: UploadPolicy, filename: string, sizeBytes: number): string | null {
  const ext = extOf(filename);
  if (!(ext in policy.allowedExt)) return "허용되지 않은 형식입니다.";
  if (sizeBytes > policy.maxFileBytes) return `파일이 ${policy.maxFileLabel}를 초과합니다.`;
  if (sizeBytes <= 0) return "빈 파일입니다.";
  return null;
}

export function resolveMime(
  policy: UploadPolicy,
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  const kind = policy.allowedExt[ext];
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
