"use client";

import type { Palette } from "@/app/_components/shared/palette";
import type {
  FacultyDeptItem,
  FacultyDept,
  FacultyView,
} from "@/lib/faculty-data";

type Props = {
  palette: Palette;
  depts: ReadonlyArray<FacultyDeptItem>;
  activeDept: FacultyDept;
  setActiveDept: (d: FacultyDept) => void;
  view: FacultyView;
  setView: (v: FacultyView) => void;
  filteredCount: number;
};

const VIEW_OPTIONS: ReadonlyArray<{ v: FacultyView; label: string }> = [
  { v: "grid", label: "Grid" },
  { v: "list", label: "List" },
];

/**
 * sticky 필터 스트립 — 학과 칩 + Grid/List 뷰 토글.
 * 디자인 원본 faculty.jsx FacultyDesktop 의 inline sticky filter 그대로.
 */
export default function FilterStrip({
  palette,
  depts,
  activeDept,
  setActiveDept,
  view,
  setView,
  filteredCount,
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
        borderBottom: `1px solid ${palette.line}`,
        padding: "18px 80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.28em",
            fontWeight: 600,
            color: palette.muted,
            fontFamily: "Inter, system-ui",
            marginBottom: 4,
          }}
        >
          FACULTY DIRECTORY
        </div>
        <div
          style={{
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          <em
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              color: palette.primary,
            }}
          >
            {filteredCount}
          </em>
          분의 교수
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {depts.map((d) => {
            const active = activeDept === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDept(d.id)}
                style={{
                  background: active ? palette.ink : "transparent",
                  color: active ? "#fff" : palette.ink,
                  border: `1px solid ${active ? palette.ink : palette.line}`,
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "all 0.18s ease",
                }}
              >
                {d.ko}
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "Inter, system-ui",
                    fontWeight: 500,
                    opacity: active ? 0.8 : 0.5,
                  }}
                >
                  {d.count}
                </span>
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            borderRadius: 999,
            padding: 3,
            background: palette.bg,
            border: `1px solid ${palette.line}`,
          }}
        >
          {VIEW_OPTIONS.map((o) => (
            <button
              key={o.v}
              onClick={() => setView(o.v)}
              style={{
                background: view === o.v ? palette.surface : "transparent",
                color: view === o.v ? palette.ink : palette.muted,
                border: "none",
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, system-ui",
                letterSpacing: "0.02em",
                boxShadow: view === o.v ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
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
