import type { Palette } from "@/app/_components/shared/palette";
import type { CatTone } from "@/app/_components/shared/catTone";
import type { TrainingCategoryKo } from "@/lib/training-data";

/**
 * 교역자수련회 카테고리별 색상 매핑 — 디자인 원본 training.jsx 의 trCatTone() 그대로.
 */
export function catTone(cat: TrainingCategoryKo, palette: Palette): CatTone {
  const map: Record<TrainingCategoryKo, CatTone> = {
    예정: { bg: palette.secondary, fg: "#fff", soft: palette.secondary + "20" },
    신청: { bg: palette.primary, fg: "#fff", soft: palette.primary + "14" },
    후기: { bg: palette.accent, fg: palette.ink, soft: palette.accent + "30" },
    강의자료: { bg: "#3F2E22", fg: "#fff", soft: "#3F2E2218" },
    "Q&A": { bg: palette.muted, fg: "#fff", soft: palette.muted + "20" },
  };
  return map[cat] ?? map["예정"];
}
