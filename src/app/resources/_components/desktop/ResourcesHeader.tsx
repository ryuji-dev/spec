import type { Palette } from "@/app/_components/shared/palette";
import { PageHeroDesktop } from "@/app/_components/PageHero";

type Props = { palette: Palette };

const STATS = [
  { k: "286", l: "전체 자료" },
  { k: "24", l: "이번 주 신규" },
  { k: "12.4K", l: "누적 다운로드" },
];

export default function ResourcesHeader({ palette }: Props) {
  return (
    <>
      <PageHeroDesktop
        kicker="RESOURCE LIBRARY"
        title={
          <>
            자료를 함께,
            <br />
            <em style={{ fontSize: 44 }}>사역의 무게를 나누다</em>
          </>
        }
        lead="설교 PPT · 악보 · 교안 · 문서 · 디자인 시안까지. 매주 새로 올라오는 자료들을 찾고, 받고, 다시 나눕니다."
      />

      {/* 통계 + 검색 — hero 아래 별도 섹션 */}
      <section
        style={{
          padding: "32px 80px",
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 32,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 0,
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            padding: "20px 24px",
            borderRadius: 4,
          }}
        >
          {STATS.map((s, i) => (
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
                  fontSize: 30,
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
                  fontSize: 11,
                  color: palette.muted,
                  marginTop: 6,
                  fontFamily: '"Noto Sans KR", system-ui',
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            padding: "16px 20px",
            borderRadius: 4,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" style={{ color: palette.muted, flexShrink: 0 }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
            <path d="M9.5 9.5 L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            placeholder="설교 본문, 곡명, 학년, 절기 검색"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              fontFamily: '"Noto Sans KR", system-ui',
              color: palette.ink,
              flex: 1,
              letterSpacing: "-0.01em",
            }}
          />
          <kbd
            style={{
              fontSize: 10,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
              background: palette.surface,
              padding: "3px 8px",
              borderRadius: 3,
              border: `1px solid ${palette.line}`,
            }}
          >
            ⌘K
          </kbd>
        </div>
      </section>
    </>
  );
}
