import type { Palette } from "@/app/_components/shared/palette";
import type { NextTraining } from "@/lib/training-data";
import SectionEyebrow from "../shared/SectionEyebrow";
import CoverArt from "../shared/CoverArt";

type Props = { palette: Palette; next: NextTraining[] };

export default function NextSection({ palette, next }: Props) {
  return (
    <section style={{ padding: "80px 80px 0" }}>
      <SectionEyebrow
        palette={palette}
        en="NEXT · 다음 일정"
        ko="앞으로의 만남"
        desc="이미 캘린더에 표시된 다음 수련회와 특별 모임. 사전 안내 후 정식 신청은 추후 공지됩니다."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginTop: 32,
        }}
      >
        {next.map((n) => (
          <article
            key={n.id}
            style={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 14,
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              minHeight: 200,
            }}
          >
            <div style={{ position: "relative" }}>
              <CoverArt kind={n.cover} palette={palette} />
              <span
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  background: "rgba(42,37,32,0.85)",
                  color: "#F5F1E8",
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: 2,
                  letterSpacing: "0.1em",
                  fontFamily: "Inter, system-ui",
                  backdropFilter: "blur(4px)",
                }}
              >
                {n.badge.toUpperCase()}
              </span>
            </div>
            <div
              style={{
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  color: palette.secondary,
                  fontWeight: 600,
                  fontFamily: "Inter, system-ui",
                  marginBottom: 8,
                }}
              >
                {n.cat.toUpperCase()}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.25,
                  marginBottom: 14,
                }}
              >
                {n.title}
              </h3>
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "baseline",
                    fontSize: 12,
                    fontFamily: '"Noto Sans KR", system-ui',
                    color: palette.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9.5,
                      letterSpacing: "0.16em",
                      color: palette.muted,
                      fontWeight: 600,
                      fontFamily: "Inter, system-ui",
                      minWidth: 38,
                    }}
                  >
                    WHEN
                  </span>
                  <span style={{ fontWeight: 500 }}>{n.dates}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "baseline",
                    fontSize: 12,
                    fontFamily: '"Noto Sans KR", system-ui',
                    color: palette.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9.5,
                      letterSpacing: "0.16em",
                      color: palette.muted,
                      fontWeight: 600,
                      fontFamily: "Inter, system-ui",
                      minWidth: 38,
                    }}
                  >
                    WHERE
                  </span>
                  <span style={{ fontWeight: 500 }}>{n.place}</span>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11.5,
                    color: palette.muted,
                    fontStyle: "italic",
                    fontFamily: '"Noto Sans KR", system-ui',
                  }}
                >
                  {n.note}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
