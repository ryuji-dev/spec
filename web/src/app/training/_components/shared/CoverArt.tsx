import type { Palette } from "@/app/_components/shared/palette";
import type { CoverKind } from "@/lib/training-data";

type Props = {
  kind: CoverKind;
  palette: Palette;
};

/**
 * 수련회 분위기 SVG 일러스트 — 디자인 원본 training.jsx 의 CoverArt 그대로.
 * 종류: mountain-dawn | autumn | youth | desert | pine | lake | field
 */
export default function CoverArt({ kind, palette }: Props) {
  const gradientId = `cv-${kind}`;
  const wrap = (
    children: React.ReactNode,
    gradStops: React.ReactNode,
  ) => (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          {gradStops}
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${gradientId})`} />
      {children}
    </svg>
  );

  if (kind === "mountain-dawn") {
    return wrap(
      <>
        <circle cx="280" cy="80" r="38" fill="#FBE6BE" opacity="0.92" />
        <circle cx="280" cy="80" r="60" fill="#FBE6BE" opacity="0.18" />
        <path
          d="M0 160 L70 130 L150 155 L230 120 L310 150 L400 130 L400 240 L0 240 Z"
          fill="#6E4E36"
          opacity="0.55"
        />
        <path
          d="M0 195 L90 170 L180 195 L270 165 L360 190 L400 180 L400 240 L0 240 Z"
          fill="#3A2A1C"
          opacity="0.85"
        />
        <path
          d="M0 220 L60 210 L140 222 L220 212 L300 224 L380 214 L400 218 L400 240 L0 240 Z"
          fill="#1F1610"
        />
      </>,
      <>
        <stop offset="0%" stopColor="#E8B888" />
        <stop offset="55%" stopColor="#7A5D44" />
        <stop offset="100%" stopColor="#1F1610" />
      </>,
    );
  }
  if (kind === "autumn") {
    return wrap(
      <>
        <ellipse cx="320" cy="60" rx="80" ry="40" fill="#F4E4C1" opacity="0.35" />
        <path
          d="M0 130 Q100 100 200 120 T400 110 L400 240 L0 240 Z"
          fill="#8B6F47"
          opacity="0.55"
        />
        <path
          d="M0 175 Q120 150 240 170 T400 160 L400 240 L0 240 Z"
          fill="#5C4530"
          opacity="0.85"
        />
        <circle cx="60" cy="110" r="8" fill="#D4A574" opacity="0.9" />
        <circle cx="100" cy="95" r="5" fill="#C9956E" opacity="0.85" />
        <circle cx="135" cy="120" r="6" fill="#B8855E" opacity="0.8" />
      </>,
      <>
        <stop offset="0%" stopColor="#D4B896" />
        <stop offset="55%" stopColor="#8B6F47" />
        <stop offset="100%" stopColor="#3A2820" />
      </>,
    );
  }
  if (kind === "youth") {
    return wrap(
      <>
        <circle cx="100" cy="70" r="28" fill="#F5F1E8" opacity="0.18" />
        <circle cx="320" cy="160" r="46" fill="#F5F1E8" opacity="0.12" />
        <rect x="40" y="180" width="40" height="50" fill="#F5F1E8" opacity="0.4" />
        <rect x="90" y="160" width="40" height="70" fill="#F5F1E8" opacity="0.55" />
        <rect x="140" y="140" width="40" height="90" fill="#F5F1E8" opacity="0.7" />
        <rect x="190" y="170" width="40" height="60" fill="#F5F1E8" opacity="0.5" />
        <rect x="240" y="155" width="40" height="75" fill="#F5F1E8" opacity="0.6" />
        <rect x="290" y="175" width="40" height="55" fill="#F5F1E8" opacity="0.45" />
      </>,
      <>
        <stop offset="0%" stopColor="#4A5D4F" />
        <stop offset="100%" stopColor="#1F2E26" />
      </>,
    );
  }
  if (kind === "desert") {
    return wrap(
      <>
        <circle cx="320" cy="70" r="32" fill="#FBE6BE" opacity="0.85" />
        <path
          d="M0 160 Q100 130 200 155 T400 150 L400 240 L0 240 Z"
          fill="#A0856B"
          opacity="0.7"
        />
        <path d="M0 200 Q120 180 240 200 T400 195 L400 240 L0 240 Z" fill="#5C4530" />
        <path d="M120 240 Q150 200 180 240 Z" fill="#3A2820" />
        <path d="M260 240 Q295 195 330 240 Z" fill="#3A2820" />
      </>,
      <>
        <stop offset="0%" stopColor="#E8C99A" />
        <stop offset="100%" stopColor="#5C4530" />
      </>,
    );
  }
  if (kind === "pine") {
    return wrap(
      <>
        <ellipse cx="80" cy="50" rx="60" ry="30" fill="#F5F1E8" opacity="0.18" />
        <path
          d="M50 240 L50 130 M50 130 L30 160 M50 130 L70 160 M50 150 L25 180 M50 150 L75 180 M50 175 L20 210 M50 175 L80 210"
          stroke="#1F3A2E"
          strokeWidth="2.5"
          opacity="0.85"
        />
        <path
          d="M150 240 L150 100 M150 100 L125 135 M150 100 L175 135 M150 130 L120 165 M150 130 L180 165 M150 160 L115 200 M150 160 L185 200"
          stroke="#1F3A2E"
          strokeWidth="2.5"
          opacity="0.95"
        />
        <path
          d="M260 240 L260 115 M260 115 L235 150 M260 115 L285 150 M260 145 L228 180 M260 145 L292 180 M260 175 L222 215 M260 175 L298 215"
          stroke="#1F3A2E"
          strokeWidth="2.5"
          opacity="0.9"
        />
        <path
          d="M350 240 L350 130 M350 130 L330 160 M350 130 L370 160 M350 155 L325 190 M350 155 L375 190"
          stroke="#1F3A2E"
          strokeWidth="2.5"
          opacity="0.85"
        />
      </>,
      <>
        <stop offset="0%" stopColor="#B5C4A8" />
        <stop offset="100%" stopColor="#5A6B4A" />
      </>,
    );
  }
  if (kind === "lake") {
    return wrap(
      <>
        <path
          d="M0 120 Q100 110 200 118 T400 115 L400 160 L0 160 Z"
          fill="#4A5D4F"
          opacity="0.7"
        />
        <path d="M0 160 L400 160 L400 240 L0 240 Z" fill="#1F2E26" />
        <path
          d="M40 180 Q60 175 80 180 M120 195 Q150 188 180 195 M220 210 Q260 203 300 210 M320 185 Q345 180 370 185"
          stroke="#B5C4A8"
          strokeWidth="1"
          opacity="0.5"
          fill="none"
        />
        <circle cx="320" cy="60" r="22" fill="#F4E4C1" opacity="0.6" />
      </>,
      <>
        <stop offset="0%" stopColor="#9DB098" />
        <stop offset="60%" stopColor="#4A5D4F" />
        <stop offset="100%" stopColor="#1F2E26" />
      </>,
    );
  }
  if (kind === "field") {
    return wrap(
      <>
        <ellipse cx="100" cy="60" rx="70" ry="25" fill="#F5F1E8" opacity="0.25" />
        <path
          d="M0 150 Q100 120 200 145 T400 140 L400 240 L0 240 Z"
          fill="#7A8B6F"
          opacity="0.65"
        />
        <path d="M0 195 Q120 175 240 195 T400 190 L400 240 L0 240 Z" fill="#3A4A3E" />
      </>,
      <>
        <stop offset="0%" stopColor="#C9D4B8" />
        <stop offset="100%" stopColor="#3A4A3E" />
      </>,
    );
  }
  return wrap(
    <rect width="400" height="240" fill={palette.primary} />,
    <stop offset="0%" stopColor={palette.primary} />,
  );
}
