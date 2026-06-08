import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyDept, FacultyTone } from "@/lib/faculty-data";

/**
 * 학과(dept) → 강조 색상 매핑.
 * 디자인 원본 faculty.jsx 의 facDeptColor() 그대로.
 */
export function deptColor(
  dept: Exclude<FacultyDept, "all">,
  palette: Palette,
): string {
  const map: Record<Exclude<FacultyDept, "all">, string> = {
    ot: palette.primary,
    nt: "#9B3A2A",
    st: palette.secondary,
    pt: palette.accent,
    ch: "#3F2E22",
    mn: "#5C7A6F",
  };
  return map[dept];
}

/**
 * tone 토큰 → Avatar 배경/전경 색상 매핑.
 * 디자인 원본 FacAvatar 의 palMap 그대로.
 */
export function avatarTone(
  tone: FacultyTone,
  palette: Palette,
): { bg: string; fg: string } {
  const map: Record<FacultyTone, { bg: string; fg: string }> = {
    forest: { bg: palette.primary, fg: "#fff" },
    olive: { bg: palette.secondary, fg: "#fff" },
    pine: { bg: "#3F2E22", fg: palette.accent },
    sage: { bg: palette.accent, fg: palette.ink },
  };
  return map[tone];
}

/**
 * tone 토큰 → Portrait SVG 그라데이션 색상 매핑.
 * 디자인 원본 FacPortrait 의 palMap 그대로.
 */
export function portraitTone(
  tone: FacultyTone,
  palette: Palette,
): { a: string; b: string; accent: string } {
  const map: Record<FacultyTone, { a: string; b: string; accent: string }> = {
    forest: { a: palette.primary, b: "#1E3329", accent: palette.accent },
    olive: { a: palette.secondary, b: "#5C5538", accent: palette.bg },
    pine: { a: "#3F2E22", b: "#1E1610", accent: palette.accent },
    sage: { a: palette.accent, b: "#9B8A6E", accent: palette.surface },
  };
  return map[tone];
}
