import type { Palette } from "@/app/_components/shared/palette";
import type { BoardCategoryKo } from "@/lib/board-data";
import { catTone } from "../catTone";

type Props = {
  cat: Exclude<BoardCategoryKo, "전체">;
  palette: Palette;
};

/**
 * 카테고리 칩 — 색 도트 + 라벨.
 * 디자인 원본 community.jsx 의 CmCatChip 그대로.
 */
export default function CmCatChip({ cat, palette }: Props) {
  const t = catTone(cat, palette);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        color: t.bg,
        fontFamily: '"Noto Sans KR", system-ui',
        letterSpacing: "-0.01em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: t.bg,
        }}
      />
      {cat}
    </span>
  );
}
