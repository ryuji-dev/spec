import type { CSSProperties } from "react";
import type { Palette } from "@/app/_components/shared/palette";
import type { PastTraining } from "@/lib/training-data";
import SectionEyebrow from "../shared/SectionEyebrow";
import CoverArt from "../shared/CoverArt";

type Props = { palette: Palette; past: PastTraining[] };

export default function PastBento({ palette, past }: Props) {
  if (past.length < 4) return null;
  return (
    <section style={{ padding: "80px 80px 0" }}>
      <SectionEyebrow
        palette={palette}
        en="ARCHIVE · 지난 수련회"
        ko="우리가 함께 머물렀던 자리"
        desc="2024년부터 함께 모였던 수련회의 사진과 후기. 사진을 클릭하면 해당 회차의 자료실로 이동합니다."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "220px 220px",
          gap: 14,
          marginTop: 32,
        }}
      >
        <PastCard
          palette={palette}
          item={past[0]}
          style={{ gridColumn: "span 2", gridRow: "span 2" }}
          hero
        />
        <PastCard
          palette={palette}
          item={past[1]}
          style={{ gridColumn: "span 1", gridRow: "span 2" }}
        />
        <PastCard
          palette={palette}
          item={past[2]}
          style={{ gridColumn: "span 1" }}
        />
        <PastCard
          palette={palette}
          item={past[3]}
          style={{ gridColumn: "span 1" }}
        />
      </div>
    </section>
  );
}

type CardProps = {
  palette: Palette;
  item: PastTraining;
  style?: CSSProperties;
  hero?: boolean;
};

function PastCard({ palette, item, style, hero }: CardProps) {
  return (
    <article
      style={{
        ...style,
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        background: palette.ink,
        border: `1px solid ${palette.line}`,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <CoverArt kind={item.cover} palette={palette} />
      </div>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: hero ? "28px 32px" : "20px 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#F5F1E8",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              background: "rgba(245,241,232,0.18)",
              color: "#F5F1E8",
              backdropFilter: "blur(8px)",
              fontSize: hero ? 10 : 9,
              fontWeight: 700,
              padding: "4px 9px",
              borderRadius: 2,
              letterSpacing: "0.12em",
              fontFamily: "Inter, system-ui",
              border: "1px solid rgba(245,241,232,0.25)",
            }}
          >
            {item.season}
          </span>
          {hero && (
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "Inter, system-ui",
                opacity: 0.7,
                letterSpacing: "0.16em",
              }}
            >
              {item.date}
            </span>
          )}
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: hero ? 32 : 18,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              marginBottom: hero ? 12 : 6,
              textShadow: "0 2px 14px rgba(0,0,0,0.35)",
            }}
          >
            {item.title}
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: hero ? 12 : 10.5,
              fontFamily: "Inter, system-ui",
              opacity: 0.85,
              letterSpacing: "0.02em",
            }}
          >
            <span>{item.participants} 참석</span>
            {!hero && <span>· {item.date}</span>}
            {hero && (
              <>
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: "#F5F1E8",
                    opacity: 0.6,
                  }}
                />
                <span
                  style={{
                    fontFamily: '"Noto Sans KR", system-ui',
                    fontSize: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  자료실로 이동
                  <svg width="11" height="11" viewBox="0 0 12 12">
                    <path
                      d="M3 6 H10 M7 3 L10 6 L7 9"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
