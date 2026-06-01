"use client";

import type { Palette } from "@/app/_components/shared/palette";
import {
  RESOURCES_SORTS,
  type ResourceCategory,
  type ResourcesSort,
  type ResourcesView,
} from "@/lib/resources-data";

type Props = {
  palette: Palette;
  categories: ResourceCategory[];
  activeCat: number;
  setActiveCat: (i: number) => void;
  sort: ResourcesSort;
  setSort: (s: ResourcesSort) => void;
  view: ResourcesView;
  setView: (v: ResourcesView) => void;
};

const VIEW_OPTIONS: ReadonlyArray<{ v: ResourcesView; label: string }> = [
  { v: "grid", label: "그리드" },
  { v: "list", label: "리스트" },
];

/**
 * sticky 필터 스트립 — 카테고리 칩 / 정렬 select / 그리드·리스트 토글.
 * 디자인 원본 library.jsx 의 sticky filter strip 그대로.
 */
export default function FilterStrip({
  palette,
  categories,
  activeCat,
  setActiveCat,
  sort,
  setSort,
  view,
  setView,
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as ResourcesSort)}
          style={{
            background: palette.surface,
            color: palette.ink,
            border: `1px solid ${palette.line}`,
            padding: "8px 12px",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: '"Noto Sans KR", system-ui',
            cursor: "pointer",
            outline: "none",
          }}
        >
          {RESOURCES_SORTS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
        <div
          style={{
            display: "inline-flex",
            border: `1px solid ${palette.line}`,
            borderRadius: 4,
            overflow: "hidden",
            background: palette.surface,
          }}
        >
          {VIEW_OPTIONS.map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setView(o.v)}
              style={{
                background: view === o.v ? palette.ink : "transparent",
                color: view === o.v ? "#fff" : palette.muted,
                border: "none",
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "-0.01em",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
