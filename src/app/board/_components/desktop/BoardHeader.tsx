import type { Palette } from "@/app/_components/shared/palette";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import { CM_VERSE, type BoardStat, type BoardStats } from "@/lib/board-data";

type Props = { palette: Palette; stats: BoardStats };

export default function BoardHeader({ palette, stats }: Props) {
  const boardStats: BoardStat[] = [
    { k: String(stats.total), l: "전체 글" },
    { k: String(stats.today), l: "오늘 새 글" },
    { k: String(stats.activeMembers), l: "활동 멤버" },
  ];
  return (
    <>
      <PageHeroDesktop
        kicker="COMMUNITY · 함께 잇는 자리"
        title={
          <>
            자유게시판,
            <br />
            <em style={{ fontSize: 44 }}>오늘의 이야기를 주고받다</em>
          </>
        }
        lead="사역의 작은 이야기, 곁에 묻고 싶은 질문, 함께 모으는 기도제목까지. 서경노회 모든 교역자와 일꾼이 자유롭게 만나는 자리입니다."
      />

      {/* 말씀 카드 + 통계 — hero 아래 별도 섹션 */}
      <section
        style={{
          padding: "32px 80px",
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 32,
          alignItems: "stretch",
        }}
      >
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
            alignItems: "center",
          }}
        >
          {boardStats.map((s, i) => (
            <div
              key={s.l}
              style={{
                paddingLeft: i === 0 ? 0 : 14,
                borderLeft: i === 0 ? "none" : `1px solid ${palette.line}`,
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
      </section>
    </>
  );
}
