/**
 * 사진 섬네일 SVG 일러스트 — 디자인 원본 그대로.
 * gradient id 충돌 방지용 prefix를 props로 받음.
 * 색상은 forest 팔레트 CSS 변수 직접 인용.
 */
import { PhotoTileType } from "@/lib/main-page-data";

const C = {
  primary: "var(--palette-primary)",
  secondary: "var(--palette-secondary)",
  accent: "var(--palette-accent)",
  bg: "var(--palette-bg)",
  surface: "var(--palette-surface)",
  ink: "var(--palette-ink)",
  muted: "var(--palette-muted)",
};

type Props = { type: PhotoTileType; idPrefix: string };

export default function PhotoThumb({ type, idPrefix }: Props) {
  switch (type) {
    case "mountain":
      return (
        <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id={`${idPrefix}-mountain`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4A574" />
              <stop offset="100%" stopColor="#5C4838" />
            </linearGradient>
          </defs>
          <rect width="200" height="150" fill={`url(#${idPrefix}-mountain)`} />
          <circle cx="150" cy="50" r="18" fill="#F4D9A8" opacity="0.7" />
          <path d="M0 100 L40 70 L80 95 L120 60 L160 90 L200 75 L200 150 L0 150 Z" fill="#3A2E26" opacity="0.7" />
          <path d="M0 120 L50 95 L100 115 L150 90 L200 110 L200 150 L0 150 Z" fill="#1A1410" />
        </svg>
      );
    case "forest":
      return (
        <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill={C.primary} />
          {[20, 60, 100, 140, 180].map((x, i) => (
            <ellipse key={i} cx={x} cy={40 + (i % 2) * 15} rx="35" ry="25" fill={C.secondary} opacity="0.7" />
          ))}
          {[30, 75, 120, 165].map((x, i) => (
            <rect key={i} x={x} y="80" width="6" height="70" fill="#1A1410" />
          ))}
          <rect y="130" width="200" height="20" fill="#1A1410" />
        </svg>
      );
    case "meeting":
      return (
        <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill={C.bg} />
          <rect x="20" y="80" width="160" height="40" rx="3" fill={C.secondary} opacity="0.5" />
          {[40, 80, 120, 160].map((x, i) => (
            <g key={i}>
              <ellipse cx={x} cy="55" rx="8" ry="9" fill={C.ink} />
              <path d={`M${x - 12} 70 Q${x} 65 ${x + 12} 70 L${x + 14} 95 L${x - 14} 95 Z`} fill={C.primary} />
            </g>
          ))}
          <rect x="60" y="92" width="80" height="2" fill={C.muted} opacity="0.4" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill={C.accent} />
          <path d="M40 40 L100 50 L160 40 L160 110 L100 120 L40 110 Z" fill={C.surface} />
          <path d="M100 50 L100 120" stroke={C.primary} strokeWidth="1.5" />
          {[60, 70, 80].map((y, i) => (
            <g key={i}>
              <rect x="50" y={y} width="40" height="1.5" fill={C.muted} opacity="0.5" />
              <rect x="110" y={y} width="40" height="1.5" fill={C.muted} opacity="0.5" />
            </g>
          ))}
        </svg>
      );
    case "music":
      return (
        <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill={C.primary} />
          {[40, 60, 80, 100].map((y, i) => (
            <line key={i} x1="20" y1={y} x2="180" y2={y} stroke={C.surface} strokeOpacity="0.3" strokeWidth="0.5" />
          ))}
          <g fill={C.accent}>
            <ellipse cx="50" cy="80" rx="6" ry="4.5" transform="rotate(-15 50 80)" />
            <rect x="55" y="55" width="1.5" height="25" />
            <ellipse cx="90" cy="60" rx="6" ry="4.5" transform="rotate(-15 90 60)" />
            <rect x="95" y="35" width="1.5" height="25" />
            <ellipse cx="130" cy="70" rx="6" ry="4.5" transform="rotate(-15 130 70)" />
            <rect x="135" y="45" width="1.5" height="25" />
            <path d="M55 55 Q70 50 95 35" stroke={C.accent} strokeWidth="2" fill="none" />
          </g>
        </svg>
      );
    case "camp":
      return (
        <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id={`${idPrefix}-camp`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3A4A4F" />
              <stop offset="100%" stopColor="#2A3328" />
            </linearGradient>
          </defs>
          <rect width="200" height="150" fill={`url(#${idPrefix}-camp)`} />
          <circle cx="150" cy="40" r="14" fill="#F4D9A8" opacity="0.8" />
          <path d="M0 90 L60 60 L120 80 L200 65 L200 150 L0 150 Z" fill="#1A2218" />
          <path d="M40 130 L60 100 L80 130 Z" fill={C.primary} />
          <path d="M120 132 L140 105 L160 132 Z" fill={C.secondary} />
        </svg>
      );
  }
}
