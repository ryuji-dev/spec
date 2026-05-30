import type { Palette } from "@/app/_components/shared/palette";
import {
  FACULTY_DEPTS,
  type FacultyMember,
} from "@/lib/faculty-data";
import { deptColor } from "../deptTone";
import FacultyPortrait from "../shared/FacultyPortrait";

type Props = {
  prof: FacultyMember;
  palette: Palette;
  large?: boolean;
};

// 교수 카드 — 디자인 원본 FacCard 그대로.
export default function FacCard({ prof, palette, large = false }: Props) {
  const accent = deptColor(prof.dept, palette);
  const deptEn = FACULTY_DEPTS.find((d) => d.id === prof.dept)?.en ?? "";
  return (
    <article
      style={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          aspectRatio: large ? "5/4" : "4/5",
          position: "relative",
          overflow: "hidden",
          background: palette.bg,
        }}
      >
        <FacultyPortrait tone={prof.tone} palette={palette} init={prof.init} />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,255,255,0.92)",
            padding: "5px 10px",
            fontSize: 9.5,
            letterSpacing: "0.18em",
            fontWeight: 700,
            fontFamily: "Inter, system-ui",
            color: accent,
            borderRadius: 999,
          }}
        >
          {deptEn}
        </div>
      </div>

      <div
        style={{
          padding: "20px 22px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: "0.32em",
            fontWeight: 600,
            color: palette.muted,
            fontFamily: "Inter, system-ui",
          }}
        >
          {prof.en}
        </div>

        <div>
          <h3
            style={{
              margin: 0,
              marginBottom: 4,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: large ? 30 : 24,
              fontWeight: 500,
              color: palette.ink,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            {prof.name}
          </h3>
          <div
            style={{
              fontSize: 12.5,
              color: palette.muted,
              letterSpacing: "-0.01em",
              fontFamily: '"Noto Sans KR", system-ui',
            }}
          >
            {prof.title}
          </div>
        </div>

        <p
          style={{
            margin: 0,
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 13.5,
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1.6,
            color: palette.ink,
            letterSpacing: "-0.015em",
            paddingLeft: 12,
            borderLeft: `2px solid ${accent}`,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          “{prof.quote}”
        </p>

        <div
          style={{
            fontSize: 11.5,
            color: palette.muted,
            fontFamily: '"Noto Sans KR", system-ui',
            letterSpacing: "-0.01em",
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: "0.22em",
              fontWeight: 600,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
              marginRight: 8,
            }}
          >
            FIELD
          </span>
          {prof.field}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            borderTop: `1px solid ${palette.line}`,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.22em",
              fontWeight: 600,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
              marginBottom: 8,
            }}
          >
            2026 SPRING
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {prof.teaches.slice(0, large ? 3 : 2).map((t, i) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  fontSize: 12.5,
                  color: palette.ink,
                  letterSpacing: "-0.01em",
                  fontFamily: '"Noto Sans KR", system-ui',
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter, system-ui",
                    fontSize: 9.5,
                    color: palette.muted,
                    fontWeight: 600,
                    minWidth: 14,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 10,
            borderTop: `1px solid ${palette.line}`,
            marginTop: 4,
            fontSize: 10.5,
            color: palette.muted,
            fontFamily: "Inter, system-ui",
          }}
        >
          <span>
            {prof.years} YRS · {prof.papers} WORKS
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontWeight: 600,
              color: palette.primary,
            }}
          >
            프로필 보기
            <svg width="9" height="9" viewBox="0 0 10 10">
              <path
                d="M3 1l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}
