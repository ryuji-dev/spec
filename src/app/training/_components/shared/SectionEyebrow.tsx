import type { Palette } from "@/app/_components/shared/palette";

type Props = {
  palette: Palette;
  en: string;
  ko: string;
  desc: string;
};

export default function SectionEyebrow({ palette, en, ko, desc }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 40,
        alignItems: "flex-end",
        paddingBottom: 18,
        borderBottom: `1px solid ${palette.line}`,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.28em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
            marginBottom: 12,
          }}
        >
          {en}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 38,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
          }}
        >
          {ko}
        </h2>
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.65,
          color: palette.muted,
          fontWeight: 300,
          fontFamily: '"Noto Sans KR", system-ui',
          textWrap: "pretty",
        }}
      >
        {desc}
      </div>
    </div>
  );
}
