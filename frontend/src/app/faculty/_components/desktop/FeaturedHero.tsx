import type { Palette } from "@/app/_components/shared/palette";
import { FACULTY_COVER } from "@/lib/faculty-data";
import FacultyPortrait from "../shared/FacultyPortrait";

type Props = { palette: Palette };

const VOL_STATS = [
  { k: "1968", l: "신학원 설립" },
  { k: "6", l: "학과" },
  { k: "봄·가을", l: "학기 운영" },
];

const MAST_LABELS = ["커버 스토리", "학장 인터뷰", "2026 봄학기"];

export default function FeaturedHero({ palette }: Props) {
  return (
    <section
      style={{
        padding: "0 80px 56px",
        background: palette.surface,
        borderBottom: `1px solid ${palette.line}`,
      }}
    >
      <header style={{ padding: "60px 0 36px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 56,
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.32em",
                color: palette.secondary,
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
                marginBottom: 14,
              }}
            >
              FACULTY · 가르치는 자리에 선 사람들
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif',
                fontSize: 56,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.12,
                color: palette.ink,
              }}
            >
              신학원교수소개,
              <br />
              <em
                style={{
                  fontStyle: "italic",
                  fontWeight: 300,
                  color: palette.primary,
                  fontSize: 38,
                }}
              >
                책상의 깊이가 강단의 무게가 되도록
              </em>
            </h1>
            <p
              style={{
                marginTop: 22,
                marginBottom: 0,
                maxWidth: 560,
                fontSize: 15,
                lineHeight: 1.75,
                color: palette.muted,
                fontFamily: '"Noto Sans KR", system-ui',
                fontWeight: 400,
              }}
            >
              서경노회 신학원의 전임 14인 교수진을 소개합니다. 한 학기의 강의
              계획, 교수 한 분의 한 줄, 그리고 그 자리를 채우는 시간들.
            </p>
          </div>
          <div
            style={{
              background: palette.ink,
              color: "#F5F1E8",
              padding: "22px 24px",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: "0.28em",
                opacity: 0.55,
                fontFamily: "Inter, system-ui",
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              VOL.07 · SPRING 2026
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              {VOL_STATS.map((s, i) => (
                <div
                  key={s.l}
                  style={{
                    paddingLeft: i === 0 ? 0 : 14,
                    borderLeft:
                      i === 0
                        ? "none"
                        : `1px solid rgba(245,241,232,0.18)`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"Noto Serif KR", serif',
                      fontSize: 26,
                      fontWeight: 500,
                      color: palette.accent,
                      letterSpacing: "-0.025em",
                      lineHeight: 1,
                    }}
                  >
                    {s.k}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      opacity: 0.7,
                      marginTop: 6,
                      fontFamily: '"Noto Sans KR", system-ui',
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "0 0 22px",
          borderTop: `1px solid ${palette.line}`,
          borderBottom: `1px solid ${palette.line}`,
          paddingTop: 22,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: palette.ink,
          }}
        >
          이번 호의{" "}
          <em
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              color: palette.primary,
            }}
          >
            교수
          </em>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
          {MAST_LABELS.map((label) => (
            <span
              key={label}
              style={{
                fontSize: 10,
                letterSpacing: "0.32em",
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
                color: palette.muted,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: 64,
          alignItems: "stretch",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: -8,
              left: -8,
              right: 32,
              bottom: 32,
              background: palette.accent,
              opacity: 0.25,
              borderRadius: 2,
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              aspectRatio: "4/5",
              overflow: "hidden",
              borderRadius: 2,
            }}
          >
            <FacultyPortrait
              tone="forest"
              palette={palette}
              init={FACULTY_COVER.init}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              zIndex: 2,
              background: palette.ink,
              color: "#F5F1E8",
              padding: "8px 14px",
              fontSize: 9.5,
              letterSpacing: "0.32em",
              fontWeight: 700,
              fontFamily: "Inter, system-ui",
            }}
          >
            {FACULTY_COVER.tag}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.32em",
              fontWeight: 600,
              color: palette.secondary,
              fontFamily: "Inter, system-ui",
              marginBottom: 18,
            }}
          >
            {FACULTY_COVER.en}
          </div>

          <h2
            style={{
              margin: 0,
              marginBottom: 6,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 64,
              fontWeight: 500,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: palette.ink,
            }}
          >
            {FACULTY_COVER.name}
          </h2>
          <div
            style={{
              fontSize: 15,
              color: palette.muted,
              fontFamily: '"Noto Sans KR", system-ui',
              letterSpacing: "-0.01em",
              marginBottom: 32,
            }}
          >
            {FACULTY_COVER.title} · {FACULTY_COVER.yearsKo}
          </div>

          <blockquote
            style={{
              margin: 0,
              padding: 0,
              position: "relative",
              paddingLeft: 28,
              borderLeft: `3px solid ${palette.primary}`,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 22,
                fontWeight: 400,
                lineHeight: 1.55,
                letterSpacing: "-0.025em",
                color: palette.ink,
              }}
            >
              <em style={{ fontStyle: "italic" }}>“</em>
              {FACULTY_COVER.quote}
              <em style={{ fontStyle: "italic" }}>”</em>
            </div>
          </blockquote>

          <p
            style={{
              margin: 0,
              marginBottom: 28,
              fontSize: 14,
              lineHeight: 1.85,
              color: palette.muted,
              fontFamily: '"Noto Sans KR", system-ui',
              maxWidth: 480,
              letterSpacing: "-0.005em",
            }}
          >
            {FACULTY_COVER.about}
          </p>

          <div
            style={{
              marginTop: "auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              background: palette.bg,
              border: `1px solid ${palette.line}`,
              borderRadius: 2,
              padding: "20px 24px",
              marginBottom: 18,
            }}
          >
            {FACULTY_COVER.stats.map((s, i) => (
              <div
                key={s.l}
                style={{
                  paddingLeft: i === 0 ? 0 : 18,
                  borderLeft: i === 0 ? "none" : `1px solid ${palette.line}`,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Noto Serif KR", serif',
                    fontSize: 32,
                    fontWeight: 500,
                    color: palette.primary,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {s.k}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: palette.muted,
                    marginTop: 8,
                    fontFamily: '"Noto Sans KR", system-ui',
                    letterSpacing: "-0.01em",
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.24em",
              fontWeight: 600,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
              marginBottom: 10,
            }}
          >
            NOW TEACHING
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FACULTY_COVER.current.map((c) => (
              <span
                key={c}
                style={{
                  background: palette.surface,
                  border: `1px solid ${palette.line}`,
                  padding: "7px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: '"Noto Sans KR", system-ui',
                  color: palette.ink,
                  letterSpacing: "-0.01em",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
