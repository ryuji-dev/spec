import type { Palette } from "@/app/_components/shared/palette";

type Props = { palette: Palette };

const STATS = [
  { k: "286", l: "전체 자료" },
  { k: "24", l: "이번 주 신규" },
  { k: "12.4K", l: "누적 다운로드" },
];

/**
 * 자료공유 데스크톱 헤더 — 라벨/큰 타이틀/설명/통계+검색 박스.
 * 디자인 원본 library.jsx LibraryDesktop 의 header 영역 그대로.
 */
export default function ResourcesHeader({ palette }: Props) {
  return (
    <header
      style={{
        padding: "64px 80px 40px",
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
            RESOURCE LIBRARY
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
            자료를 함께,
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: palette.primary,
                fontSize: 38,
              }}
            >
              사역의 무게를 나누다
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
            설교 PPT · 악보 · 교안 · 문서 · 디자인 시안까지. 매주 새로 올라오는
            자료들을 찾고, 받고, 다시 나눕니다.
          </p>
        </div>

        <div
          style={{
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            padding: 28,
            borderRadius: 4,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 0,
              marginBottom: 20,
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
              gap: 8,
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              padding: "12px 16px",
              borderRadius: 2,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              style={{ color: palette.muted }}
            >
              <circle
                cx="6"
                cy="6"
                r="4.5"
                stroke="currentColor"
                strokeWidth="1.4"
                fill="none"
              />
              <path
                d="M9.5 9.5 L13 13"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <input
              placeholder="설교 본문, 곡명, 학년, 절기 검색"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13,
                fontFamily: '"Noto Sans KR", system-ui',
                color: palette.ink,
                flex: 1,
                letterSpacing: "-0.01em",
              }}
            />
            <kbd
              style={{
                fontSize: 9.5,
                color: palette.muted,
                fontFamily: "Inter, system-ui",
                background: palette.bg,
                padding: "2px 6px",
                borderRadius: 3,
                border: `1px solid ${palette.line}`,
              }}
            >
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </header>
  );
}
