import type { Palette } from "@/app/_components/shared/palette";
import type { TrainingCategory } from "@/lib/training-data";

type Props = {
  palette: Palette;
  categories: ReadonlyArray<TrainingCategory>;
  active: number;
  setActive: (i: number) => void;
};

export default function FilterBar({ palette, categories, active, setActive }: Props) {
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
        marginTop: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {categories.map((c, i) => {
          const isActive = active === i;
          return (
            <button
              key={c.en}
              type="button"
              onClick={() => setActive(i)}
              style={{
                background: isActive ? palette.ink : "transparent",
                color: isActive ? "#fff" : palette.ink,
                border: `1px solid ${isActive ? palette.ink : palette.line}`,
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
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
                  opacity: isActive ? 0.8 : 0.55,
                }}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            padding: "8px 12px",
            borderRadius: 999,
            width: 240,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            style={{ color: palette.muted }}
          >
            <circle
              cx="6"
              cy="6"
              r="4.5"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
            />
            <path
              d="M9.5 9.5 L13 13"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <input
            placeholder="회차, 강사, 키워드 검색"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 12.5,
              fontFamily: '"Noto Sans KR", system-ui',
              color: palette.ink,
              flex: 1,
              letterSpacing: "-0.01em",
            }}
          />
          <kbd
            style={{
              fontSize: 9.5,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
              background: palette.bg,
              padding: "2px 6px",
              borderRadius: 3,
              border: `1px solid ${palette.line}`,
            }}
          >
            ⌘K
          </kbd>
        </div>
        <button
          type="button"
          style={{
            background: palette.ink,
            color: "#fff",
            border: "none",
            padding: "9px 18px",
            borderRadius: 2,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: '"Noto Sans KR", system-ui',
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12">
            <path
              d="M6 1 V11 M1 6 H11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          글쓰기
        </button>
      </div>
    </div>
  );
}
