import type { Palette } from "@/app/_components/shared/palette";
import type { CollectionCoverKind } from "@/lib/resources-data";

type Props = {
  kind: CollectionCoverKind;
  palette: Palette;
};

/**
 * 컬렉션 커버 — 추상 그래디언트 SVG 3종(spring/easter/teacher).
 * 디자인 원본 library.jsx 의 CollectionCover 그대로.
 */
export default function CollectionCover({ kind, palette }: Props) {
  if (kind === "spring") {
    return (
      <svg
        viewBox="0 0 280 160"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="lc-spring" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B5C4A8" />
            <stop offset="100%" stopColor="#5A6B4A" />
          </linearGradient>
        </defs>
        <rect width="280" height="160" fill="url(#lc-spring)" />
        <circle cx="220" cy="40" r="28" fill="#F5F1E8" opacity="0.6" />
        <path
          d="M0 110 Q60 90 120 105 T280 95 L280 160 L0 160 Z"
          fill={palette.primary}
          opacity="0.5"
        />
        <path
          d="M0 135 Q70 120 140 130 T280 125 L280 160 L0 160 Z"
          fill={palette.primary}
          opacity="0.85"
        />
        {[40, 90, 150, 210].map((x, i) => (
          <g key={i} transform={`translate(${x}, 130)`}>
            <line x1="0" y1="0" x2="0" y2="-15" stroke="#1A1410" strokeWidth="1.2" />
            <circle cx="0" cy="-18" r="3" fill={palette.accent} />
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "easter") {
    return (
      <svg
        viewBox="0 0 280 160"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <radialGradient id="lc-easter" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0%" stopColor="#E8B888" />
            <stop offset="100%" stopColor="#3A2820" />
          </radialGradient>
        </defs>
        <rect width="280" height="160" fill="url(#lc-easter)" />
        <ellipse cx="140" cy="60" rx="60" ry="50" fill="#FBE6BE" opacity="0.4" />
        <rect x="135" y="40" width="10" height="80" fill={palette.surface} />
        <rect x="115" y="60" width="50" height="10" fill={palette.surface} />
        <ellipse cx="140" cy="130" rx="80" ry="6" fill="#1A1410" opacity="0.4" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 280 160"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id="lc-teacher" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A96E" />
          <stop offset="100%" stopColor="#5C4530" />
        </linearGradient>
      </defs>
      <rect width="280" height="160" fill="url(#lc-teacher)" />
      <rect
        x="60"
        y="100"
        width="160"
        height="20"
        rx="2"
        fill={palette.surface}
        opacity="0.95"
      />
      <rect x="70" y="80" width="140" height="20" rx="2" fill={palette.primary} />
      <rect x="55" y="60" width="170" height="20" rx="2" fill={palette.surface} />
      <rect x="80" y="40" width="120" height="20" rx="2" fill={palette.ink} />
      <line
        x1="100"
        y1="50"
        x2="180"
        y2="50"
        stroke={palette.surface}
        strokeWidth="0.5"
        opacity="0.6"
      />
      <line
        x1="80"
        y1="70"
        x2="200"
        y2="70"
        stroke={palette.muted}
        strokeWidth="0.5"
        opacity="0.6"
      />
    </svg>
  );
}
