import type { WebzinePalette } from "@/lib/webzine-data";

type Props = { palette: WebzinePalette };

// 원본 _design/.../webzine.jsx CoverWilderness 그대로.
// palette는 시그니처 호환을 위해 유지(내부 색상은 모두 하드코딩 그라디언트).
export default function CoverWilderness({ palette: _palette }: Props) {
  void _palette;
  return (
    <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="wzcw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8B888" />
          <stop offset="35%" stopColor="#9C7456" />
          <stop offset="70%" stopColor="#3F2E22" />
          <stop offset="100%" stopColor="#15100C" />
        </linearGradient>
        <radialGradient id="wzcw-sun" cx="0.5" cy="0.45" r="0.32">
          <stop offset="0%" stopColor="#FBE6BE" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#F4C896" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F4C896" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="520" fill="url(#wzcw-sky)" />
      <rect width="800" height="520" fill="url(#wzcw-sun)" />
      <circle cx="400" cy="220" r="62" fill="#FBE6BE" opacity="0.92" />
      <circle cx="400" cy="220" r="100" fill="#FBE6BE" opacity="0.18" />
      <path d="M180 180 q5 -5 10 0 q5 -5 10 0" stroke="#1A1410" strokeWidth="1.2" fill="none" opacity="0.55" />
      <path d="M560 150 q4 -4 8 0 q4 -4 8 0" stroke="#1A1410" strokeWidth="1.0" fill="none" opacity="0.5" />
      <path d="M0 320 L120 290 L260 315 L400 285 L540 310 L680 290 L800 300 L800 520 L0 520 Z" fill="#6E4E36" opacity="0.55" />
      <path d="M0 380 L160 345 L320 375 L480 340 L640 370 L800 355 L800 520 L0 520 Z" fill="#3D2A1D" opacity="0.85" />
      <path d="M0 440 L120 415 L260 445 L400 420 L540 450 L680 425 L800 440 L800 520 L0 520 Z" fill="#1A1108" />
      <path d="M400 520 Q412 470 398 430 Q390 410 402 380" stroke="#D4A574" strokeWidth="2.5" fill="none" opacity="0.6" />
      <path d="M400 520 Q412 470 398 430 Q390 410 402 380" stroke="#F4E4C1" strokeWidth="0.8" fill="none" opacity="0.5" />
    </svg>
  );
}
