import type { Palette } from "@/app/_components/shared/palette";
import type { BoardImageKind } from "@/lib/board-data";

type Props = {
  kind: BoardImageKind;
  palette: Palette;
};

/**
 * 피드 카드 커버 — 추상 일러스트 SVG.
 * 디자인 원본 community.jsx 의 FeedCover 그대로.
 * 종류: sunset | worship | congrats
 */
export default function FeedCover({ kind, palette }: Props) {
  if (kind === "sunset") {
    return (
      <svg
        viewBox="0 0 280 160"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="cm-sunset" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8B888" />
            <stop offset="60%" stopColor="#9B6E4A" />
            <stop offset="100%" stopColor="#3A2820" />
          </linearGradient>
        </defs>
        <rect width="280" height="160" fill="url(#cm-sunset)" />
        <circle cx="200" cy="60" r="28" fill="#FBE6BE" opacity="0.85" />
        <path
          d="M0 110 Q70 95 140 110 T280 100 L280 160 L0 160 Z"
          fill={palette.ink}
          opacity="0.55"
        />
        <path
          d="M0 130 Q90 118 180 130 T280 125 L280 160 L0 160 Z"
          fill={palette.ink}
        />
      </svg>
    );
  }
  if (kind === "worship") {
    return (
      <svg
        viewBox="0 0 280 160"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="cm-worship" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.primary} />
            <stop offset="100%" stopColor="#1A2218" />
          </linearGradient>
        </defs>
        <rect width="280" height="160" fill="url(#cm-worship)" />
        <circle cx="140" cy="60" r="40" fill={palette.accent} opacity="0.35" />
        <circle cx="140" cy="60" r="22" fill={palette.accent} opacity="0.7" />
        {[60, 100, 140, 180, 220].map((x, i) => (
          <rect
            key={i}
            x={x - 3}
            y={120 - (i % 3) * 8}
            width="6"
            height={30 + (i % 3) * 8}
            fill={palette.surface}
            opacity="0.85"
          />
        ))}
        {[80, 120, 160, 200].map((x, i) => (
          <circle key={i} cx={x} cy="118" r="4" fill={palette.surface} />
        ))}
      </svg>
    );
  }
  if (kind === "congrats") {
    return (
      <svg
        viewBox="0 0 280 160"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <rect width="280" height="160" fill={palette.accent} />
        <rect
          x="20"
          y="40"
          width="240"
          height="90"
          rx="2"
          fill={palette.surface}
        />
        <line
          x1="40"
          y1="70"
          x2="240"
          y2="70"
          stroke={palette.primary}
          strokeWidth="0.8"
          opacity="0.4"
        />
        <text
          x="140"
          y="92"
          textAnchor="middle"
          fontFamily='"Noto Serif KR", serif'
          fontSize="24"
          fontWeight="500"
          fill={palette.primary}
        >
          제27회 성경고사
        </text>
        <text
          x="140"
          y="115"
          textAnchor="middle"
          fontFamily="Inter"
          fontSize="9"
          fontWeight="600"
          fill={palette.muted}
          letterSpacing="0.2em"
        >
          CHAMPION · 2026
        </text>
        <circle cx="50" cy="55" r="3" fill={palette.primary} />
        <circle cx="230" cy="55" r="3" fill={palette.primary} />
      </svg>
    );
  }
  return null;
}
