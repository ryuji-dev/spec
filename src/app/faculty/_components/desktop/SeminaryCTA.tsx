import type { Palette } from "@/app/_components/shared/palette";

type Props = { palette: Palette };

const STATS = [
  { k: "1968", l: "신학원 설립" },
  { k: "봄·가을", l: "학기 운영" },
  { k: "6", l: "학과 영역" },
  { k: "서경", l: "본관·교육관" },
];

// 신학원 안내 CTA — 디자인 원본 FacultyDesktop 의 inline CTA 그대로.
export default function SeminaryCTA({ palette }: Props) {
  return (
    <section
      style={{
        background: palette.surface,
        borderTop: `1px solid ${palette.line}`,
        padding: "72px 80px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.32em",
              fontWeight: 600,
              color: palette.secondary,
              fontFamily: "Inter, system-ui",
              marginBottom: 14,
            }}
          >
            SEOGYEONG SEMINARY
          </div>
          <h2
            style={{
              margin: 0,
              marginBottom: 16,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: palette.ink,
            }}
          >
            교실은 좁지만,
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: palette.primary,
              }}
            >
              교회는 넓습니다
            </em>
          </h2>
          <p
            style={{
              margin: 0,
              marginBottom: 28,
              fontSize: 14.5,
              lineHeight: 1.85,
              color: palette.muted,
              fontFamily: '"Noto Sans KR", system-ui',
              letterSpacing: "-0.005em",
              maxWidth: 460,
            }}
          >
            서경노회 신학원은 1968년 작은 성서학당으로 시작해, 오늘에 이르기까지
            한 학기 한 학기의 강의로 교회의 자리를 채워 왔습니다. 우리는 책상의
            깊이가 강단의 무게가 되는 신학을 함께 만들어 갑니다.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                background: palette.primary,
                color: "#fff",
                border: "none",
                padding: "14px 24px",
                borderRadius: 2,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "-0.01em",
              }}
            >
              입학 안내
            </button>
            <button
              style={{
                background: "transparent",
                color: palette.ink,
                border: `1px solid ${palette.line}`,
                padding: "14px 24px",
                borderRadius: 2,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "-0.01em",
              }}
            >
              커리큘럼 다운로드
            </button>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.l}
              style={{
                background: palette.bg,
                border: `1px solid ${palette.line}`,
                padding: "28px 24px",
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 44,
                  fontWeight: 500,
                  color: palette.primary,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {s.k}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: palette.muted,
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.01em",
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
