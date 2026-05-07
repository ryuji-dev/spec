import type { Palette } from "@/app/_components/shared/palette";
import { BOARD_STATS, CM_VERSE } from "@/lib/board-data";

type Props = { palette: Palette };

/**
 * 자유게시판 데스크톱 헤더 — 타이틀 + 오늘의 한 줄 + 통계.
 * 디자인 원본 community.jsx CommunityDesktop 의 header 영역.
 */
export default function BoardHeader({ palette }: Props) {
  return (
    <header
      style={{
        padding: "60px 80px 36px",
        background: palette.surface,
        borderBottom: `1px solid ${palette.line}`,
      }}
    >
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
            COMMUNITY · 함께 잇는 자리
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
            자유게시판,
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: palette.primary,
                fontSize: 38,
              }}
            >
              오늘의 이야기를 주고받다
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
            사역의 작은 이야기, 곁에 묻고 싶은 질문, 함께 모으는 기도제목까지.
            서경노회 모든 교역자와 일꾼이 자유롭게 만나는 자리입니다.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: palette.ink,
              color: "#F5F1E8",
              padding: "22px 24px",
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -8,
                right: 12,
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 80,
                opacity: 0.13,
                fontWeight: 500,
                color: palette.accent,
                lineHeight: 1,
              }}
            >
              “
            </div>
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: "0.28em",
                opacity: 0.55,
                fontFamily: "Inter, system-ui",
                fontWeight: 600,
                marginBottom: 10,
                position: "relative",
                zIndex: 1,
              }}
            >
              VERSE OF THE DAY
            </div>
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.55,
                letterSpacing: "-0.015em",
                position: "relative",
                zIndex: 1,
              }}
            >
              {CM_VERSE.text}
            </div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.6,
                marginTop: 10,
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "0.04em",
              }}
            >
              — {CM_VERSE.ref}
            </div>
          </div>

          <div
            style={{
              background: palette.bg,
              border: `1px solid ${palette.line}`,
              padding: "14px 18px",
              borderRadius: 4,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
            }}
          >
            {BOARD_STATS.map((s, i) => (
              <div
                key={s.l}
                style={{
                  paddingLeft: i === 0 ? 0 : 14,
                  borderLeft:
                    i === 0 ? "none" : `1px solid ${palette.line}`,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Noto Serif KR", serif',
                    fontSize: 22,
                    fontWeight: 500,
                    color: palette.primary,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                  }}
                >
                  {s.k}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: palette.muted,
                    marginTop: 5,
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
  );
}
