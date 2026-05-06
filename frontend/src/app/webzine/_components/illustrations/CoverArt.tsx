import type { ReactNode } from "react";
import type { WebzinePalette } from "@/lib/webzine-data";

export type CoverArtType =
  | "book"
  | "rural"
  | "book2"
  | "child"
  | "history"
  | "dialogue";

type Props = {
  type: CoverArtType;
  palette: WebzinePalette;
};

type WrapProps = { children: ReactNode; bg: string };

function Wrap({ children, bg }: WrapProps) {
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="400" height="280" fill={bg} />
      {children}
    </svg>
  );
}

// 원본 _design/.../webzine.jsx CoverArt 그대로.
export default function CoverArt({ type, palette }: Props) {
  if (type === "book")
    return (
      <Wrap bg="#3D2A1D">
        <rect x="80" y="60" width="240" height="160" fill="#1A1108" />
        <rect x="90" y="70" width="220" height="140" fill={palette.surface} />
        <line x1="200" y1="70" x2="200" y2="210" stroke={palette.primary} strokeWidth="1.5" />
        {[100, 115, 130, 145, 160, 175].map((y, i) => (
          <g key={i}>
            <line x1="105" y1={y} x2="190" y2={y} stroke={palette.muted} strokeWidth="0.6" opacity="0.5" />
            <line x1="210" y1={y} x2="295" y2={y} stroke={palette.muted} strokeWidth="0.6" opacity="0.5" />
          </g>
        ))}
        <circle cx="60" cy="40" r="14" fill="#F4D9A8" opacity="0.6" />
      </Wrap>
    );
  if (type === "rural")
    return (
      <Wrap bg="#7A8B6F">
        <ellipse cx="320" cy="80" rx="50" ry="30" fill="#F4E4C1" opacity="0.5" />
        <path d="M0 180 Q100 160 200 175 T400 165 L400 280 L0 280 Z" fill="#5A6B4A" />
        <path d="M0 220 Q120 200 240 215 T400 210 L400 280 L0 280 Z" fill="#2D3A28" />
        <g transform="translate(200, 150)">
          <rect x="-20" y="0" width="40" height="40" fill="#F5F1E8" opacity="0.92" />
          <path d="M-22 0 L0 -18 L22 0 Z" fill="#3A2818" />
          <rect x="-2" y="-30" width="2" height="14" fill="#3A2818" />
          <rect x="-6" y="-26" width="10" height="2" fill="#3A2818" />
          <rect x="-5" y="20" width="10" height="20" fill="#3A2818" />
        </g>
      </Wrap>
    );
  if (type === "book2")
    return (
      <Wrap bg="#C9A96E">
        <rect x="100" y="40" width="200" height="200" fill={palette.surface} />
        <rect x="100" y="40" width="200" height="40" fill={palette.primary} />
        <text x="200" y="65" fontSize="14" fill="#fff" textAnchor="middle" fontFamily="serif" letterSpacing="2">
          SPIRIT
        </text>
        <line x1="120" y1="110" x2="280" y2="110" stroke={palette.muted} strokeWidth="0.6" />
        <line x1="120" y1="130" x2="280" y2="130" stroke={palette.muted} strokeWidth="0.6" />
        <line x1="120" y1="150" x2="240" y2="150" stroke={palette.muted} strokeWidth="0.6" />
        <line x1="120" y1="170" x2="280" y2="170" stroke={palette.muted} strokeWidth="0.6" />
        <line x1="120" y1="190" x2="220" y2="190" stroke={palette.muted} strokeWidth="0.6" />
      </Wrap>
    );
  if (type === "child")
    return (
      <Wrap bg="#E8C8A0">
        <ellipse cx="200" cy="100" rx="160" ry="60" fill="#FBE6BE" opacity="0.5" />
        <g transform="translate(200, 200)">
          <circle cx="0" cy="-50" r="14" fill="#3A2818" />
          <path d="M-18 -36 Q0 -42 18 -36 L20 30 L-20 30 Z" fill="#3A2818" />
          <circle cx="-22" cy="-10" r="3" fill="#3A2818" />
          <circle cx="22" cy="-10" r="3" fill="#3A2818" />
        </g>
        <line x1="0" y1="240" x2="400" y2="240" stroke="#3A2818" strokeWidth="1" opacity="0.3" />
      </Wrap>
    );
  if (type === "history")
    return (
      <Wrap bg="#2D3A28">
        {([
          [60, 40], [120, 80], [180, 30], [240, 70], [300, 50],
          [340, 90], [80, 120], [200, 110], [280, 130],
        ] as const).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.2" fill="#F5F1E8" opacity="0.7" />
        ))}
        <path d="M0 180 L80 150 L160 175 L240 145 L320 170 L400 155 L400 280 L0 280 Z" fill="#1A2218" />
        <path d="M0 230 L100 210 L200 225 L300 205 L400 220 L400 280 L0 280 Z" fill="#0E1410" />
        <g transform="translate(200, 200)">
          <circle r="12" fill="#FBE6BE" opacity="0.4" />
          <circle r="4" fill="#F4C896" />
        </g>
      </Wrap>
    );
  if (type === "dialogue")
    return (
      <Wrap bg="#FAF7F0">
        <g transform="translate(120, 200)">
          <rect x="-20" y="-20" width="40" height="20" fill={palette.primary} />
          <rect x="-20" y="0" width="6" height="40" fill={palette.primary} />
          <rect x="14" y="0" width="6" height="40" fill={palette.primary} />
        </g>
        <g transform="translate(280, 200)">
          <rect x="-20" y="-20" width="40" height="20" fill={palette.secondary} />
          <rect x="-20" y="0" width="6" height="40" fill={palette.secondary} />
          <rect x="14" y="0" width="6" height="40" fill={palette.secondary} />
        </g>
        <g transform="translate(200, 150)">
          <ellipse cx="0" cy="0" rx="14" ry="3" fill={palette.muted} opacity="0.3" />
          <path d="M-12 -2 L-10 -18 L10 -18 L12 -2 Z" fill="#F5F1E8" stroke={palette.muted} strokeWidth="0.8" />
          <path d="M0 -22 Q-3 -28 0 -32 Q3 -28 0 -22" stroke={palette.muted} strokeWidth="0.6" fill="none" opacity="0.5" />
        </g>
        <line x1="0" y1="240" x2="400" y2="240" stroke={palette.line} strokeWidth="1" />
      </Wrap>
    );
  return null;
}
