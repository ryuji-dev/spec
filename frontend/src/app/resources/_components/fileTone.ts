import type { Palette } from "@/app/_components/shared/palette";
import type { ResourceFileType } from "@/lib/resources-data";

export type FileTone = {
  label: string;
  color: string;
  soft: string;
  ext: string;
};

export type FileToneKey = ResourceFileType | "all";

/**
 * 파일타입(ppt/pdf/score/doc/video/image)별 표시 토큰.
 * 디자인 원본 library.jsx 의 fileType() 함수와 동일.
 */
export function fileTone(type: FileToneKey, palette: Palette): FileTone {
  switch (type) {
    case "ppt":
      return { label: "PPT", color: "#C75B3F", soft: "#C75B3F18", ext: ".pptx" };
    case "pdf":
      return { label: "PDF", color: "#9B3A2A", soft: "#9B3A2A18", ext: ".pdf" };
    case "score":
      return {
        label: "SCORE",
        color: palette.primary,
        soft: palette.primary + "18",
        ext: ".pdf",
      };
    case "doc":
      return { label: "DOC", color: "#3F2E22", soft: "#3F2E2218", ext: ".docx" };
    case "video":
      return {
        label: "MP4",
        color: palette.secondary,
        soft: palette.secondary + "20",
        ext: ".mp4",
      };
    case "image":
      return {
        label: "IMG",
        color: palette.accent,
        soft: palette.accent + "30",
        ext: ".zip",
      };
    case "all":
    default:
      return { label: "ALL", color: palette.ink, soft: palette.line, ext: "" };
  }
}
