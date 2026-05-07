/**
 * 메뉴 카드 아이콘 — 디자인 원본의 SVG 일러스트 그대로.
 * 색상은 forest 팔레트의 CSS 변수를 직접 인용 (var(--palette-*)).
 */
import { ReactElement } from "react";

const C = {
  primary: "var(--palette-primary)",
  secondary: "var(--palette-secondary)",
  accent: "var(--palette-accent)",
  bg: "var(--palette-bg)",
  surface: "var(--palette-surface)",
  muted: "var(--palette-muted)",
};

const ICONS: Record<string, ReactElement> = {
  webzine: (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="30" fill={C.primary} opacity="0.08" />
      <path d="M14 20 L30 24 L46 20 L46 42 L30 46 L14 42 Z" fill={C.surface} stroke={C.primary} strokeWidth="1.5" />
      <path d="M30 24 L30 46" stroke={C.primary} strokeWidth="1.5" />
      <path
        d="M18 27 L26 29 M18 31 L26 33 M18 35 L24 36 M34 29 L42 27 M34 33 L42 31 M34 36 L40 35"
        stroke={C.muted}
        strokeWidth="0.8"
      />
    </svg>
  ),
  edu: (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="30" fill={C.accent} opacity="0.18" />
      <rect x="29" y="14" width="2" height="20" fill={C.primary} />
      <rect x="23" y="18" width="14" height="2" fill={C.primary} />
      <circle cx="22" cy="38" r="3" fill={C.primary} />
      <circle cx="30" cy="36" r="3.5" fill={C.primary} />
      <circle cx="38" cy="38" r="3" fill={C.primary} />
      <path d="M16 48 Q22 42 28 46 Q34 42 40 46 Q46 42 44 48 Z" fill={C.primary} />
    </svg>
  ),
  training: (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="30" fill={C.secondary} opacity="0.18" />
      <path d="M14 44 L22 28 L30 44 Z" fill={C.primary} />
      <path d="M22 28 L22 44" stroke={C.bg} strokeWidth="1" />
      <path d="M30 44 L40 24 L46 32 L46 44 Z" fill={C.secondary} />
      <circle cx="42" cy="20" r="3" fill={C.accent} />
    </svg>
  ),
  board: (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="30" fill={C.primary} opacity="0.08" />
      <path
        d="M14 20 H34 A3 3 0 0 1 37 23 V33 A3 3 0 0 1 34 36 H22 L18 41 V36 H17 A3 3 0 0 1 14 33 V23 A3 3 0 0 1 17 20 Z"
        fill={C.surface}
        stroke={C.primary}
        strokeWidth="1.4"
      />
      <path
        d="M26 30 H44 A3 3 0 0 1 47 33 V42 A3 3 0 0 1 44 45 H40 L42 50 L36 45 H29 A3 3 0 0 1 26 42 V33 Z"
        fill={C.accent}
        opacity="0.85"
        stroke={C.primary}
        strokeWidth="1.4"
      />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="30" fill={C.secondary} opacity="0.18" />
      <rect x="18" y="20" width="22" height="28" rx="1" fill={C.surface} stroke={C.primary} strokeWidth="1.2" />
      <rect x="20" y="16" width="22" height="28" rx="1" fill={C.surface} stroke={C.primary} strokeWidth="1.2" />
      <path d="M24 24 L36 24 M24 28 L36 28 M24 32 L32 32" stroke={C.muted} strokeWidth="1" strokeLinecap="round" />
      <circle cx="36" cy="38" r="2.5" fill={C.accent} />
      <path d="M38.5 38 L38.5 30" stroke={C.accent} strokeWidth="1.2" />
    </svg>
  ),
  professor: (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <circle cx="30" cy="30" r="30" fill={C.accent} opacity="0.18" />
      <rect x="16" y="13" width="28" height="34" rx="2" fill={C.surface} stroke={C.primary} strokeWidth="1.4" />
      <rect x="20" y="17" width="20" height="18" fill={C.primary} opacity="0.1" />
      <circle cx="30" cy="24" r="4" fill={C.primary} />
      <path d="M22 35 Q22 28 30 28 Q38 28 38 35 Z" fill={C.primary} />
      <line x1="20" y1="40" x2="40" y2="40" stroke={C.muted} strokeWidth="1" strokeLinecap="round" />
      <line x1="20" y1="43" x2="34" y2="43" stroke={C.muted} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  ),
};

export default function MenuIcon({ menuKey }: { menuKey: string }) {
  return ICONS[menuKey] ?? null;
}
