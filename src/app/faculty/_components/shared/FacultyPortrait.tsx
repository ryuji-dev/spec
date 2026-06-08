import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyTone } from "@/lib/faculty-data";
import { portraitTone } from "../deptTone";

type Props = {
  tone: FacultyTone;
  palette: Palette;
  init: string;
};

// 추상 패턴 — 교수 포트레이트 placeholder. 디자인 원본 FacPortrait 그대로.
export default function FacultyPortrait({ tone, palette, init }: Props) {
  const c = portraitTone(tone, palette);
  const gradId = `fac-grad-${tone}-${init}`;
  return (
    <svg
      viewBox="0 0 200 240"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.a} />
          <stop offset="100%" stopColor={c.b} />
        </linearGradient>
      </defs>
      <rect width="200" height="240" fill={`url(#${gradId})`} />
      <ellipse cx="100" cy="280" rx="120" ry="70" fill={c.b} opacity="0.7" />
      <circle cx="100" cy="115" r="48" fill={c.b} opacity="0.55" />
      <text
        x="100"
        y="138"
        textAnchor="middle"
        fontFamily='"Noto Serif KR", serif'
        fontSize="56"
        fontWeight="500"
        fill={c.accent}
        letterSpacing="-2"
        opacity="0.92"
      >
        {init}
      </text>
      <g opacity="0.06" fill={c.accent}>
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x="0" y={i * 18} width="200" height="0.8" />
        ))}
      </g>
    </svg>
  );
}
