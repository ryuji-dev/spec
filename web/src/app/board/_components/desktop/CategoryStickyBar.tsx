"use client";

import type { Palette } from "@/app/_components/shared/palette";
import { BOARD_SORTS, type BoardCategory, type BoardSort } from "@/lib/board-data";

type Props = {
  palette: Palette;
  categories: BoardCategory[];
  activeCat: number;
  setActiveCat: (i: number) => void;
  sort: BoardSort;
  setSort: (v: BoardSort) => void;
};

/**
 * 카테고리 + 정렬 sticky 바.
 * 디자인 원본 community.jsx CommunityDesktop 의 sticky 영역.
 */
export default function CategoryStickyBar({
  palette,
  categories,
  activeCat,
  setActiveCat,
  sort,
  setSort,
}: Props) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(251,248,241,0.92)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderTop: `1px solid ${palette.line}`,
        borderBottom: `1px solid ${palette.line}`,
        padding: "14px 80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        marginTop: 48,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {categories.map((c, i) => {
          const active = activeCat === i;
          return (
            <button
              key={c.en}
              type="button"
              onClick={() => setActiveCat(i)}
              style={{
                background: active ? palette.ink : "transparent",
                color: active ? "#fff" : palette.ink,
                border: `1px solid ${active ? palette.ink : palette.line}`,
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: active ? 600 : 500,
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "-0.01em",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.18s ease",
              }}
            >
              {c.ko}
              <span
                style={{
                  fontSize: 10.5,
                  fontFamily: "Inter, system-ui",
                  fontWeight: 500,
                  opacity: active ? 0.8 : 0.55,
                }}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {BOARD_SORTS.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setSort(o.v)}
            style={{
              background: "transparent",
              color: sort === o.v ? palette.ink : palette.muted,
              border: "none",
              padding: "8px 4px",
              fontSize: 12.5,
              fontWeight: sort === o.v ? 700 : 500,
              cursor: "pointer",
              fontFamily: '"Noto Sans KR", system-ui',
              letterSpacing: "-0.01em",
              borderBottom:
                sort === o.v
                  ? `2px solid ${palette.ink}`
                  : "2px solid transparent",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
