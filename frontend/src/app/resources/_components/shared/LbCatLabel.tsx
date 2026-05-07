import type { Palette } from "@/app/_components/shared/palette";
import type { ResourceFileCategory } from "@/lib/resources-data";

export type CatColorTone = { bg: string; fg: string };

/**
 * 자료공유 카테고리(파일 분류)별 색상 매핑.
 * 디자인 원본 library.jsx 의 lbCatTone() 함수와 동일.
 */
export function lbCatTone(cat: string, palette: Palette): CatColorTone {
  switch (cat) {
    case "설교PPT":
      return { bg: "#C75B3F", fg: "#fff" };
    case "악보":
      return { bg: palette.primary, fg: "#fff" };
    case "교안":
      return { bg: "#9B3A2A", fg: "#fff" };
    case "문서":
      return { bg: "#3F2E22", fg: "#fff" };
    case "영상":
      return { bg: palette.secondary, fg: "#fff" };
    case "디자인":
      return { bg: palette.accent, fg: palette.ink };
    default:
      return { bg: "#3F2E22", fg: "#fff" };
  }
}

type LabelProps = {
  /** 카테고리 라벨. 컬렉션 태그 등 ResourceFileCategory 외 값도 들어올 수 있어 string 허용. */
  cat: ResourceFileCategory | string;
  palette: Palette;
};

/**
 * 카테고리 칩(soft, 도트 + 텍스트).
 */
export default function LbCatLabel({ cat, palette }: LabelProps) {
  const t = lbCatTone(cat, palette);
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
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: t.bg,
        }}
      />
      {cat}
    </span>
  );
}

type SolidProps = LabelProps;

/**
 * 카테고리 칩(solid, 박스).
 */
export function LbCatSolid({ cat, palette }: SolidProps) {
  const t = lbCatTone(cat, palette);
  return (
    <span
      style={{
        display: "inline-block",
        background: t.bg,
        color: t.fg,
        fontSize: 10.5,
        fontWeight: 700,
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
