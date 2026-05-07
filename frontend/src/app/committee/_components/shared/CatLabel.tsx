import type { Palette } from "./palette";
import type { PostCategoryKo } from "@/lib/committee-data";
import { catTone } from "./catTone";

type Props = {
  cat: PostCategoryKo;
  palette: Palette;
  variant?: "soft" | "solid";
};

export default function CatLabel({ cat, palette, variant = "soft" }: Props) {
  const t = catTone(cat, palette);
  if (variant === "solid") {
    return (
      <span
        style={{
          display: "inline-block",
          background: t.bg,
          color: t.fg,
          fontSize: 10.5,
          fontWeight: 600,
          padding: "4px 9px",
          borderRadius: 2,
          fontFamily: '"Noto Sans KR", system-ui',
          letterSpacing: "0.02em",
        }}
      >
        {cat}
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
        color: t.bg,
        fontFamily: '"Noto Sans KR", system-ui',
        letterSpacing: "-0.01em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.bg }} />
      {cat}
    </span>
  );
}
