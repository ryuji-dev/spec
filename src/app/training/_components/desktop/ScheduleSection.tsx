import type { Palette } from "@/app/_components/shared/palette";
import { TR_SCHEDULE } from "@/lib/training-data";
import SectionEyebrow from "../shared/SectionEyebrow";

type Props = { palette: Palette };

export default function ScheduleSection({ palette }: Props) {
  return (
    <section style={{ padding: "80px 80px 0" }}>
      <SectionEyebrow
        palette={palette}
        en="SCHEDULE · 3일의 흐름"
        ko="개회에서 파송까지"
        desc="말씀, 기도, 쉼, 교제 — 한 자리에 머무르며 다시 호흡을 가다듬는 사흘."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
          marginTop: 32,
        }}
      >
        {TR_SCHEDULE.map((d, i) => (
          <article
            key={d.day}
            style={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 14,
              padding: "24px 24px 26px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                paddingBottom: 14,
                marginBottom: 16,
                borderBottom: `1px solid ${palette.line}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.24em",
                    color: palette.secondary,
                    fontWeight: 600,
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  {d.day}
                </div>
                <div
                  style={{
                    fontFamily: '"Noto Serif KR", serif',
                    fontSize: 22,
                    fontWeight: 500,
                    marginTop: 4,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {d.date}
                </div>
              </div>
              <div
                style={{
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 28,
                  fontWeight: 300,
                  opacity: 0.25,
                  letterSpacing: "-0.04em",
                  color: palette.ink,
                }}
              >
                0{i + 1}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {d.items.map((it, k) => (
                <div
                  key={k}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr",
                    gap: 12,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Inter, system-ui",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: it.highlight ? palette.primary : palette.muted,
                      paddingTop: 1,
                    }}
                  >
                    {it.time}
                  </div>
                  <div
                    style={{
                      paddingLeft: 14,
                      borderLeft: `2px solid ${it.highlight ? palette.accent : palette.line}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: it.highlight ? 700 : 500,
                        color: palette.ink,
                        fontFamily: '"Noto Sans KR", system-ui',
                        letterSpacing: "-0.02em",
                        marginBottom: 3,
                      }}
                    >
                      {it.what}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 11,
                        color: palette.muted,
                        fontFamily: '"Noto Sans KR", system-ui',
                      }}
                    >
                      <span
                        style={{
                          background: it.highlight ? palette.accent : palette.bg,
                          color: it.highlight ? palette.ink : palette.muted,
                          padding: "1px 6px",
                          borderRadius: 2,
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {it.tag}
                      </span>
                      <span>{it.place}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
