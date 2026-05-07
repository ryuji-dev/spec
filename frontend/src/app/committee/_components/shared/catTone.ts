import type { Palette } from "./palette";
import type { PostCategoryKo } from "@/lib/committee-data";

export type CatTone = { bg: string; fg: string; soft: string };

/**
 * 카테고리별 색상 매핑 — 디자인 원본 board.jsx 의 catTone() 그대로.
 */
export function catTone(cat: PostCategoryKo, palette: Palette): CatTone {
  const map: Record<PostCategoryKo, CatTone> = {
    공지: { bg: palette.primary, fg: "#fff", soft: palette.primary + "14" },
    회의록: { bg: palette.secondary, fg: "#fff", soft: palette.secondary + "20" },
    수련회: { bg: palette.accent, fg: palette.ink, soft: palette.accent + "30" },
    자료실: { bg: "#3F2E22", fg: "#fff", soft: "#3F2E2218" },
    나눔: { bg: palette.muted, fg: "#fff", soft: palette.muted + "20" },
  };
  return map[cat] ?? map["공지"];
}
