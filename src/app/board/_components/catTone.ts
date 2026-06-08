import type { Palette } from "@/app/_components/shared/palette";
import type { BoardCategoryKo } from "@/lib/board-data";

/**
 * 자유게시판 카테고리별 색상·아이콘 매핑.
 * 디자인 원본 community.jsx 의 cmCatTone() 그대로.
 */
export type BoardCatTone = {
  bg: string;
  fg: string;
  ico: string;
};

export function catTone(
  cat: Exclude<BoardCategoryKo, "전체">,
  palette: Palette,
): BoardCatTone {
  const map: Record<Exclude<BoardCategoryKo, "전체">, BoardCatTone> = {
    나눔: { bg: palette.primary, fg: "#fff", ico: "✿" },
    "Q&A": { bg: "#9B3A2A", fg: "#fff", ico: "?" },
    기도: { bg: palette.accent, fg: palette.ink, ico: "✚" },
    토론: { bg: palette.secondary, fg: "#fff", ico: "※" },
    소식: { bg: "#3F2E22", fg: "#fff", ico: "◆" },
  };
  return map[cat] ?? map["나눔"];
}
