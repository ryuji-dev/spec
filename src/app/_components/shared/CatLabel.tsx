import type { CatTone } from "./catTone";

type Props = {
  label: string;
  tone: CatTone;
  variant?: "soft" | "solid";
};

/**
 * 카테고리 칩. 카테고리 → 색상 매핑(`catTone`)은 각 페이지에서 정의해 prop으로 주입.
 * 디자인 원본 board.jsx 의 두 가지 표시(soft 도트 / solid 박스) 그대로.
 */
export default function CatLabel({ label, tone, variant = "soft" }: Props) {
  if (variant === "solid") {
    return (
      <span
        style={{
          display: "inline-block",
          background: tone.bg,
          color: tone.fg,
          fontSize: 10.5,
          fontWeight: 600,
          padding: "4px 9px",
          borderRadius: 2,
          fontFamily: '"Noto Sans KR", system-ui',
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        color: tone.bg,
        fontFamily: '"Noto Sans KR", system-ui',
        letterSpacing: "-0.01em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: tone.bg }} />
      {label}
    </span>
  );
}
