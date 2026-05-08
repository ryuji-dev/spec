import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyMember } from "@/lib/faculty-data";
import FacAvatar from "../shared/FacAvatar";

type Props = {
  profs: ReadonlyArray<FacultyMember>;
  palette: Palette;
};

const COLS = "60px 1.4fr 1.2fr 2fr 110px 110px";

// 리스트 뷰 — 디자인 원본 FacListView 그대로.
export default function FacultyList({ profs, palette }: Props) {
  return (
    <div
      style={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 2,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          padding: "14px 28px",
          borderBottom: `1px solid ${palette.line}`,
          fontSize: 9.5,
          letterSpacing: "0.24em",
          fontWeight: 700,
          fontFamily: "Inter, system-ui",
          color: palette.muted,
          background: palette.bg,
        }}
      >
        <div></div>
        <div>NAME</div>
        <div>FIELD</div>
        <div>NOW TEACHING</div>
        <div>OFFICE</div>
        <div style={{ textAlign: "right" }}>HOURS</div>
      </div>
      {profs.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            padding: "20px 28px",
            borderBottom:
              i < profs.length - 1 ? `1px solid ${palette.line}` : "none",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
          }}
        >
          <FacAvatar init={p.init} palette={palette} size={40} tone={p.tone} />
          <div>
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 19,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: "-0.025em",
              }}
            >
              {p.name}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: palette.muted,
                marginTop: 2,
                fontFamily: '"Noto Sans KR", system-ui',
              }}
            >
              {p.title}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                color: palette.ink,
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "-0.01em",
              }}
            >
              {p.field}
            </div>
            <div
              style={{
                fontSize: 10,
                color: palette.muted,
                marginTop: 2,
                fontFamily: "Inter, system-ui",
                letterSpacing: "0.04em",
              }}
            >
              {p.degree}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {p.teaches.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11.5,
                  color: palette.ink,
                  background: palette.bg,
                  border: `1px solid ${palette.line}`,
                  padding: "4px 9px",
                  borderRadius: 999,
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.01em",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div
            style={{
              fontSize: 12,
              color: palette.muted,
              fontFamily: '"Noto Sans KR", system-ui',
            }}
          >
            {p.office}
          </div>
          <div
            style={{
              fontSize: 11,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
              textAlign: "right",
              letterSpacing: "0.02em",
            }}
          >
            {p.hours}
          </div>
        </div>
      ))}
    </div>
  );
}
