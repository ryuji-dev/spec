import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyTimetableItem } from "@/lib/faculty-data";

type Props = { palette: Palette; timetable: FacultyTimetableItem[] };

const COLS = "60px 80px 1fr 110px 80px";

// 시간표 미리보기 — 디자인 원본 TimetablePreview 그대로.
export default function ScheduleSection({ palette, timetable }: Props) {
  return (
    <section
      style={{
        background: palette.bg,
        padding: "64px 80px",
        borderTop: `1px solid ${palette.line}`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 64,
          alignItems: "flex-start",
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
            2026 SPRING · TIMETABLE
          </div>
          <h2
            style={{
              margin: 0,
              marginBottom: 22,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: palette.ink,
            }}
          >
            한 학기,
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: palette.primary,
              }}
            >
              일곱 강좌의 풍경
            </em>
          </h2>
          <p
            style={{
              margin: 0,
              marginBottom: 28,
              fontSize: 14,
              lineHeight: 1.85,
              color: palette.muted,
              fontFamily: '"Noto Sans KR", system-ui',
              letterSpacing: "-0.005em",
              maxWidth: 360,
            }}
          >
            이번 학기 핵심 강좌 일부를 발췌했습니다. 전체 시간표는 학사 안내
            페이지에서 확인하실 수 있습니다.
          </p>
          <button
            style={{
              background: palette.ink,
              color: "#F5F1E8",
              border: "none",
              padding: "14px 24px",
              borderRadius: 2,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: '"Noto Sans KR", system-ui',
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            전체 시간표 보기
            <svg width="11" height="11" viewBox="0 0 12 12">
              <path
                d="M3 1l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div
          style={{
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: COLS,
              padding: "14px 20px",
              background: palette.ink,
              color: "#F5F1E8",
              fontSize: 9.5,
              letterSpacing: "0.24em",
              fontWeight: 700,
              fontFamily: "Inter, system-ui",
            }}
          >
            <div>DAY</div>
            <div>TIME</div>
            <div>COURSE</div>
            <div>PROFESSOR</div>
            <div style={{ textAlign: "right" }}>ROOM</div>
          </div>
          {timetable.map((row, i) => (
            <div
              key={`${row.day}-${row.time}-${row.course}`}
              style={{
                display: "grid",
                gridTemplateColumns: COLS,
                padding: "16px 20px",
                alignItems: "center",
                borderTop: i === 0 ? "none" : `1px solid ${palette.line}`,
                background: row.host ? palette.accent + "22" : "transparent",
                fontFamily: '"Noto Sans KR", system-ui',
                fontSize: 13,
                letterSpacing: "-0.01em",
                color: palette.ink,
              }}
            >
              <div
                style={{
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 18,
                  fontWeight: 500,
                  color: palette.primary,
                }}
              >
                {row.day}
              </div>
              <div
                style={{
                  fontFamily: "Inter, system-ui",
                  fontSize: 12,
                  color: palette.muted,
                  fontWeight: 600,
                }}
              >
                {row.time}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: palette.ink,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {row.course}
                {row.host && (
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      fontWeight: 700,
                      fontFamily: "Inter, system-ui",
                      background: palette.ink,
                      color: "#F5F1E8",
                      padding: "2px 6px",
                      borderRadius: 2,
                    }}
                  >
                    학장
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: palette.muted }}>
                {row.prof}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: palette.muted,
                  fontFamily: "Inter, system-ui",
                  textAlign: "right",
                }}
              >
                {row.room}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
