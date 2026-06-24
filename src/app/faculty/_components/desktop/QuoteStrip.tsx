import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyQuote } from "@/lib/faculty-data";

type Props = { palette: Palette; quotes: FacultyQuote[] };

export default function QuoteStrip({ palette, quotes }: Props) {
  return (
    <section
      style={{
        background: palette.ink,
        color: "#F5F1E8",
        padding: "64px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.32em",
          fontWeight: 600,
          opacity: 0.55,
          fontFamily: "Inter, system-ui",
          marginBottom: 36,
        }}
      >
        VOICES · 한 학기의 한 줄
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 36,
        }}
      >
        {quotes.map((q) => (
          <div
            key={q.name}
            style={{
              borderLeft: `1px solid rgba(245,241,232,0.18)`,
              paddingLeft: 20,
            }}
          >
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 60,
                fontWeight: 500,
                lineHeight: 1,
                color: palette.accent,
                opacity: 0.5,
                marginBottom: 4,
              }}
            >
              “
            </div>
            <p
              style={{
                margin: 0,
                marginBottom: 18,
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 17,
                fontWeight: 400,
                lineHeight: 1.55,
                letterSpacing: "-0.02em",
                fontStyle: "italic",
              }}
            >
              {q.q}
            </p>
            <div
              style={{
                fontSize: 11,
                opacity: 0.6,
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "0.04em",
              }}
            >
              — {q.name} 교수
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
