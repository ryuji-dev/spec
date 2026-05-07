import type { Palette } from "@/app/_components/shared/palette";

type Props = { palette: Palette };

/**
 * 자유게시판 페이지네이션 — 시각 요소만, 클릭 동작은 v2.
 * 디자인 원본 community.jsx 페이지네이션 영역 그대로.
 */
export default function BoardPagination({ palette }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        marginTop: 48,
        paddingTop: 32,
        borderTop: `1px solid ${palette.line}`,
      }}
    >
      <button
        type="button"
        style={{
          background: "transparent",
          border: `1px solid ${palette.line}`,
          padding: "8px 12px",
          borderRadius: 4,
          cursor: "pointer",
          color: palette.muted,
          fontSize: 12,
          fontFamily: "Inter, system-ui",
        }}
      >
        ‹ 이전
      </button>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          style={{
            background: n === 1 ? palette.ink : "transparent",
            color: n === 1 ? "#fff" : palette.ink,
            border: `1px solid ${n === 1 ? palette.ink : palette.line}`,
            padding: "8px 13px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
            minWidth: 36,
          }}
        >
          {n}
        </button>
      ))}
      <span style={{ color: palette.muted, padding: "0 6px" }}>…</span>
      <button
        type="button"
        style={{
          background: "transparent",
          border: `1px solid ${palette.line}`,
          color: palette.ink,
          padding: "8px 13px",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: "Inter, system-ui",
        }}
      >
        32
      </button>
      <button
        type="button"
        style={{
          background: "transparent",
          border: `1px solid ${palette.line}`,
          padding: "8px 12px",
          borderRadius: 4,
          cursor: "pointer",
          color: palette.ink,
          fontSize: 12,
          fontFamily: "Inter, system-ui",
        }}
      >
        다음 ›
      </button>
    </div>
  );
}
