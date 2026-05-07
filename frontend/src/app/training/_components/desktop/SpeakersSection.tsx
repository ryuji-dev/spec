import type { Palette } from "@/app/_components/shared/palette";
import { TR_SPEAKERS } from "@/lib/training-data";
import SectionEyebrow from "../shared/SectionEyebrow";

type Props = { palette: Palette };

export default function SpeakersSection({ palette }: Props) {
  return (
    <section style={{ padding: "80px 80px 0" }}>
      <SectionEyebrow
        palette={palette}
        en="SPEAKERS · 강사진"
        ko="누가 함께하는가"
        desc="이번 봄 수련회에서 말씀과 대담으로 만나주실 세 분의 강사를 소개합니다."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
          marginTop: 32,
        }}
      >
        {TR_SPEAKERS.map((s, i) => (
          <article
            key={s.name}
            style={{
              background: i === 0 ? palette.primary : palette.surface,
              color: i === 0 ? "#F5F1E8" : palette.ink,
              border: i === 0 ? "none" : `1px solid ${palette.line}`,
              borderRadius: 14,
              padding: "28px 26px",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {i === 0 && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 160,
                  height: 160,
                  borderRadius: 999,
                  background: `radial-gradient(circle, ${palette.accent}44 0%, transparent 70%)`,
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 999,
                  background: i === 0 ? palette.accent : palette.bg,
                  color: i === 0 ? palette.ink : palette.primary,
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 26,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.init}
              </div>
              <span
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.18em",
                  fontFamily: "Inter, system-ui",
                  fontWeight: 600,
                  opacity: i === 0 ? 0.7 : 0.5,
                  paddingTop: 6,
                }}
              >
                SPEAKER 0{i + 1}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  marginBottom: 4,
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: i === 0 ? 0.7 : 0.55,
                  fontFamily: '"Noto Sans KR", system-ui',
                  marginBottom: 18,
                }}
              >
                {s.affiliation}
              </div>
              <div
                style={{
                  paddingTop: 16,
                  borderTop:
                    i === 0
                      ? "1px solid rgba(245,241,232,0.18)"
                      : `1px solid ${palette.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    fontFamily: '"Noto Sans KR", system-ui',
                    letterSpacing: "-0.01em",
                  }}
                >
                  {s.role}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, system-ui",
                    fontSize: 11,
                    fontWeight: 600,
                    color: i === 0 ? palette.accent : palette.primary,
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.talks} TALKS
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
