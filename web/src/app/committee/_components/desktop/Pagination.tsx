import type { Palette } from "@/app/_components/shared/palette";

type Props = { palette: Palette };

export default function Pagination({ palette }: Props) {
  return (
    <div
      style={{
        marginTop: 36,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        fontFamily: "Inter, system-ui",
      }}
    >
      <button
        type="button"
        style={{
          background: "transparent",
          border: `1px solid ${palette.line}`,
          width: 36,
          height: 36,
          borderRadius: 2,
          cursor: "pointer",
          color: palette.muted,
        }}
      >
        ‹
      </button>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <button
          key={n}
          type="button"
          style={{
            background: n === 1 ? palette.ink : "transparent",
            color: n === 1 ? "#fff" : palette.ink,
            border: `1px solid ${n === 1 ? palette.ink : palette.line}`,
            width: 36,
            height: 36,
            borderRadius: 2,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {n}
        </button>
      ))}
      <span style={{ padding: "0 6px", color: palette.muted, fontSize: 12 }}>···</span>
      <button
        type="button"
        style={{
          background: "transparent",
          border: `1px solid ${palette.line}`,
          width: 36,
          height: 36,
          borderRadius: 2,
          fontSize: 12.5,
          color: palette.ink,
          cursor: "pointer",
        }}
      >
        15
      </button>
      <button
        type="button"
        style={{
          background: "transparent",
          border: `1px solid ${palette.line}`,
          width: 36,
          height: 36,
          borderRadius: 2,
          cursor: "pointer",
          color: palette.muted,
        }}
      >
        ›
      </button>
    </div>
  );
}
