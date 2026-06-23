import type { Palette } from "@/app/_components/shared/palette";
import type { UpcomingTraining, TrainingSpeaker } from "@/lib/training-data";

type Props = { palette: Palette; featured: UpcomingTraining | null; speakers: TrainingSpeaker[] };

export default function UpcomingHero({ palette, featured, speakers }: Props) {
  if (!featured) return null;
  const u = featured;
  const pct = u.capacity > 0 ? Math.round((u.registered / u.capacity) * 100) : 0;
  const placeParts = u.place.split(" · ");
  return (
    <section style={{ padding: "40px 80px 0" }}>
      <article
        style={{
          background: palette.ink,
          color: "#F5F1E8",
          borderRadius: 18,
          overflow: "hidden",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          minHeight: 480,
        }}
      >
        <div style={{ padding: "44px 48px", position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: palette.accent,
                color: palette.ink,
                fontSize: 10,
                fontWeight: 700,
                padding: "5px 10px",
                borderRadius: 2,
                letterSpacing: "0.1em",
                fontFamily: "Inter, system-ui",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: palette.ink,
                  boxShadow: `0 0 0 3px ${palette.accent}`,
                }}
              />
              {u.badge.toUpperCase()} · {u.cat}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "Inter, system-ui",
                opacity: 0.55,
                letterSpacing: "0.16em",
              }}
            >
              NO. 47
            </span>
          </div>

          <h2
            style={{
              margin: 0,
              fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif',
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.18,
              marginBottom: 8,
            }}
          >
            {u.title}
          </h2>
          <div
            style={{
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 22,
              fontStyle: "italic",
              fontWeight: 300,
              color: palette.accent,
              letterSpacing: "-0.02em",
              marginBottom: 18,
            }}
          >
            “{u.subtitle}”
          </div>

          <div
            style={{
              fontSize: 12.5,
              fontFamily: '"Noto Sans KR", system-ui',
              opacity: 0.7,
              lineHeight: 1.6,
              fontWeight: 300,
              paddingLeft: 14,
              borderLeft: `2px solid ${palette.accent}`,
              marginBottom: 28,
              maxWidth: 480,
            }}
          >
            {u.theme}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {[
              { label: "DATES", value: u.dates, sub: `D-${u.daysLeft}` },
              {
                label: "PLACE",
                value: placeParts[1] ?? u.place,
                sub: placeParts[0] ?? "",
              },
              { label: "FEE", value: u.fee, sub: "숙박·식사 포함" },
              { label: "DEADLINE", value: u.deadline, sub: "신청 마감" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  padding: "14px 16px",
                  background: "rgba(245,241,232,0.06)",
                  border: "1px solid rgba(245,241,232,0.12)",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.2em",
                    fontFamily: "Inter, system-ui",
                    fontWeight: 600,
                    opacity: 0.5,
                    marginBottom: 6,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: '"Noto Sans KR", system-ui',
                    letterSpacing: "-0.02em",
                    marginBottom: 2,
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    opacity: 0.6,
                    fontFamily: "Inter, system-ui",
                    letterSpacing: "0.04em",
                  }}
                >
                  {m.sub}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  fontFamily: "Inter, system-ui",
                  fontWeight: 600,
                  opacity: 0.75,
                }}
              >
                REGISTRATION · 신청 현황
              </span>
              <span
                style={{
                  fontFamily: "Inter, system-ui",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span style={{ color: palette.accent, fontSize: 18 }}>
                  {u.registered}
                </span>
                <span style={{ opacity: 0.5 }}>
                  {" "}
                  / {u.capacity}명 · {pct}%
                </span>
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "rgba(245,241,232,0.12)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${palette.accent}, ${palette.secondary})`,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              style={{
                background: palette.accent,
                color: palette.ink,
                border: "none",
                padding: "14px 26px",
                borderRadius: 4,
                fontSize: 13.5,
                fontWeight: 700,
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "-0.01em",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              지금 신청하기
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
            </button>
            <button
              type="button"
              style={{
                background: "transparent",
                color: "#F5F1E8",
                border: "1px solid rgba(245,241,232,0.3)",
                padding: "12px 22px",
                borderRadius: 4,
                fontSize: 12.5,
                fontWeight: 500,
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "-0.01em",
                cursor: "pointer",
              }}
            >
              안내문 다운로드 (PDF)
            </button>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.ink} 100%)`,
            padding: "40px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
            borderLeft: "1px solid rgba(245,241,232,0.1)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 220,
              height: 220,
              borderRadius: 999,
              background: `radial-gradient(circle, ${palette.accent}33 0%, transparent 65%)`,
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: -80,
              left: -50,
              width: 240,
              height: 240,
              borderRadius: 999,
              background: `radial-gradient(circle, ${palette.secondary}44 0%, transparent 70%)`,
            }}
          />

          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: "0.24em",
                fontFamily: "Inter, system-ui",
                fontWeight: 600,
                opacity: 0.6,
                marginBottom: 10,
              }}
            >
              COUNTDOWN · 개회까지
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                fontFamily: '"Noto Serif KR", serif',
              }}
            >
              <span
                style={{
                  fontSize: 84,
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.95,
                  color: palette.accent,
                }}
              >
                {u.daysLeft}
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 300,
                  opacity: 0.7,
                  fontStyle: "italic",
                }}
              >
                days
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                marginTop: 6,
                opacity: 0.55,
                fontFamily: "Inter, system-ui",
                letterSpacing: "0.04em",
              }}
            >
              오늘 기준 · 2026.05.07
            </div>
          </div>

          <div
            aria-hidden
            style={{ height: 1, background: "rgba(245,241,232,0.12)" }}
          />

          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: "0.24em",
                fontFamily: "Inter, system-ui",
                fontWeight: 600,
                opacity: 0.6,
                marginBottom: 14,
              }}
            >
              SPEAKERS · 강사진
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {speakers.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      background:
                        i === 0 ? palette.accent : "rgba(245,241,232,0.12)",
                      color: i === 0 ? palette.ink : "#F5F1E8",
                      fontSize: 14,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: '"Noto Sans KR", system-ui',
                      flexShrink: 0,
                    }}
                  >
                    {s.init}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        fontFamily: '"Noto Sans KR", system-ui',
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.55,
                        marginTop: 1,
                        fontFamily: '"Noto Sans KR", system-ui',
                      }}
                    >
                      {s.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
