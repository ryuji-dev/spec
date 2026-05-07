import type { Palette } from "@/app/_components/shared/palette";

type Props = { palette: Palette };

export default function HeroSection({ palette }: Props) {
  return (
    <header
      style={{
        padding: "64px 80px 36px",
        borderBottom: `1px solid ${palette.line}`,
        background: palette.surface,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 40,
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
            EDUCATION COMMITTEE · TRAINING
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif',
              fontSize: 56,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.12,
            }}
          >
            교역자 수련회
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: palette.primary,
                fontSize: 38,
              }}
            >
              잠시 멈추어, 다시 듣다
            </em>
          </h1>
        </div>
        <div
          style={{
            textAlign: "right",
            fontFamily: '"Noto Sans KR", system-ui',
            fontSize: 13,
            color: palette.muted,
            lineHeight: 1.6,
            maxWidth: 360,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            서경노회는 매년 봄·가을 두 차례, 사역의 자리에서 잠시 떨어져 다시
            말씀 앞에 서는 시간을 마련합니다.
          </div>
          <div
            style={{
              fontFamily: "Inter, system-ui",
              fontSize: 11,
              letterSpacing: "0.06em",
              color: palette.primary,
              fontWeight: 600,
            }}
          >
            EST. 1998 · 47회째
          </div>
        </div>
      </div>
    </header>
  );
}
