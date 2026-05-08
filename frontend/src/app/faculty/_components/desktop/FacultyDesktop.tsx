import { FOREST_PALETTE } from "@/app/_components/shared/palette";

const palette = FOREST_PALETTE;

/**
 * 신학원교수소개 데스크톱 — 디자인 원본 faculty.jsx 의 FacultyDesktop 이식 골격.
 * 글로벌 DesktopNav(solid)는 page 단에서 노출. 여기선 본문만.
 *
 * Step A: 라우트 동작 확인용 골격(팔레트 배경 + 안내 텍스트).
 * Step B 에서 FeaturedHero / QuoteStrip / FilterStrip / FacultyGrid / FacultyList /
 * ScheduleSection / SeminaryCTA / FacultyFooter 섹션을 채워 넣는다.
 */
export default function FacultyDesktop() {
  return (
    <div
      style={{
        background: palette.bg,
        color: palette.ink,
        minHeight: "100%",
      }}
    >
      <section style={{ padding: "120px 80px" }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.32em",
            fontWeight: 600,
            color: palette.muted,
            fontFamily: "Inter, system-ui",
            marginBottom: 18,
          }}
        >
          FACULTY · 가르치는 자리에 선 사람들
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: palette.ink,
          }}
        >
          신학원교수소개
        </h1>
      </section>
    </div>
  );
}
