/**
 * 히어로 슬라이드 4종 — 디자인 원본 SVG 직렬화.
 * Phase 1: 4개 모두 마크업하되 첫 번째(idx=0)만 활성. 자동 루프/켄번스는 Phase 2.
 *
 * gradient/clipPath의 id 충돌을 막기 위해 컴포넌트별 prefix 부여.
 */

export function HeroSlide1() {
  return (
    <svg viewBox="0 0 402 720" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="s1sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8B888" />
          <stop offset="22%" stopColor="#C8956E" />
          <stop offset="55%" stopColor="#7A5D44" />
          <stop offset="100%" stopColor="#1F1610" />
        </linearGradient>
        <radialGradient id="s1sun" cx="0.5" cy="0.42" r="0.32">
          <stop offset="0%" stopColor="#FBE6BE" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#F4C896" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F4C896" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="s1mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4E4C1" stopOpacity="0" />
          <stop offset="100%" stopColor="#F4E4C1" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <rect width="402" height="720" fill="url(#s1sky)" />
      <rect width="402" height="720" fill="url(#s1sun)" />
      <circle cx="201" cy="305" r="46" fill="#FBE6BE" opacity="0.92" />
      <circle cx="201" cy="305" r="68" fill="#FBE6BE" opacity="0.18" />
      <path d="M0 430 L70 400 L150 425 L230 395 L310 420 L402 395 L402 720 L0 720 Z" fill="#6E4E36" opacity="0.55" />
      <path d="M0 490 L90 455 L180 485 L270 450 L360 480 L402 465 L402 720 L0 720 Z" fill="#4A3424" opacity="0.8" />
      <path d="M0 560 L60 535 L140 560 L220 540 L300 565 L380 545 L402 555 L402 720 L0 720 Z" fill="#2A1C12" />
      <path d="M201 720 Q210 640 200 580 Q195 560 201 540" stroke="#D4A574" strokeWidth="3" fill="none" opacity="0.55" />
      <path d="M201 720 Q210 640 200 580 Q195 560 201 540" stroke="#F4E4C1" strokeWidth="1" fill="none" opacity="0.4" />
      <rect y="500" width="402" height="220" fill="url(#s1mist)" />
    </svg>
  );
}

export function HeroSlide2() {
  const sheep = [
    { x: 130, s: 0.85 },
    { x: 180, s: 1 },
    { x: 235, s: 0.9 },
    { x: 285, s: 0.8 },
  ];
  const grassX = [20, 60, 90, 140, 210, 260, 310, 370];
  return (
    <svg viewBox="0 0 402 720" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="s2sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9B896" />
          <stop offset="35%" stopColor="#8FA582" />
          <stop offset="100%" stopColor="#3A4A3E" />
        </linearGradient>
        <linearGradient id="s2hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A6B4A" />
          <stop offset="100%" stopColor="#2D3A28" />
        </linearGradient>
      </defs>
      <rect width="402" height="720" fill="url(#s2sky)" />
      <ellipse cx="320" cy="180" rx="90" ry="60" fill="#F4E4C1" opacity="0.35" />
      <path d="M0 380 Q100 340 200 360 T402 350 L402 720 L0 720 Z" fill="#7A8B6F" opacity="0.5" />
      <path d="M0 460 Q120 420 240 440 T402 430 L402 720 L0 720 Z" fill="#4A5D4A" opacity="0.85" />
      <path d="M0 560 Q100 530 200 555 Q300 580 402 545 L402 720 L0 720 Z" fill="url(#s2hill)" />
      <path d="M0 660 Q120 640 220 660 Q310 680 402 660" stroke="#A8B89A" strokeWidth="3" fill="none" opacity="0.55" />
      <path d="M0 660 Q120 640 220 660 Q310 680 402 660" stroke="#F5F1E8" strokeWidth="1" fill="none" opacity="0.5" />
      {sheep.map((p, i) => (
        <g key={i} transform={`translate(${p.x}, 600) scale(${p.s})`}>
          <ellipse cx="0" cy="0" rx="14" ry="10" fill="#F5F1E8" />
          <circle cx="-12" cy="-2" r="5" fill="#3A2E26" />
          <rect x="-8" y="8" width="2" height="6" fill="#3A2E26" />
          <rect x="6" y="8" width="2" height="6" fill="#3A2E26" />
        </g>
      ))}
      {grassX.map((x, i) => (
        <g key={i} transform={`translate(${x},${680 + (i % 3) * 8})`}>
          <path d="M0 0 L-2 -8 M0 0 L0 -10 M0 0 L2 -8" stroke="#1F2A1A" strokeWidth="1" opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

export function HeroSlide3() {
  const ripples = [490, 515, 545, 580, 615, 650, 685];
  const reedsLeft = [20, 28, 34, 42, 52, 60];
  const reedsRight = [348, 358, 368, 378, 388];
  return (
    <svg viewBox="0 0 402 720" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="s3sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C8A0" />
          <stop offset="35%" stopColor="#B8A088" />
          <stop offset="70%" stopColor="#6E7A82" />
          <stop offset="100%" stopColor="#3A4854" />
        </linearGradient>
        <linearGradient id="s3water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7088A0" />
          <stop offset="50%" stopColor="#4A5E72" />
          <stop offset="100%" stopColor="#1F2A36" />
        </linearGradient>
        <radialGradient id="s3sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FBE6BE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FBE6BE" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="402" height="720" fill="url(#s3sky)" />
      <ellipse cx="201" cy="340" rx="180" ry="80" fill="url(#s3sun)" />
      <circle cx="201" cy="340" r="34" fill="#FBE6BE" opacity="0.9" />
      <circle cx="201" cy="340" r="50" fill="#FBE6BE" opacity="0.25" />
      <path d="M0 410 L80 380 L160 400 L240 375 L320 395 L402 380 L402 460 L0 460 Z" fill="#3A4854" opacity="0.7" />
      <path d="M0 440 L100 420 L200 435 L300 415 L402 430 L402 470 L0 470 Z" fill="#2A3540" />
      <rect y="470" width="402" height="250" fill="url(#s3water)" />
      <ellipse cx="201" cy="475" rx="60" ry="3" fill="#FBE6BE" opacity="0.7" />
      <ellipse cx="201" cy="500" rx="48" ry="2.5" fill="#FBE6BE" opacity="0.5" />
      <ellipse cx="201" cy="525" rx="38" ry="2" fill="#FBE6BE" opacity="0.38" />
      <ellipse cx="201" cy="555" rx="28" ry="1.5" fill="#FBE6BE" opacity="0.28" />
      <ellipse cx="201" cy="590" rx="20" ry="1.2" fill="#FBE6BE" opacity="0.2" />
      <ellipse cx="201" cy="630" rx="14" ry="1" fill="#FBE6BE" opacity="0.15" />
      {ripples.map((y, i) => (
        <line
          key={i}
          x1={i % 2 ? 40 : 60}
          y1={y}
          x2={i % 2 ? 360 : 340}
          y2={y}
          stroke="#A8BDD0"
          strokeWidth="0.6"
          opacity={0.22 - i * 0.02}
        />
      ))}
      <g opacity="0.85">
        {reedsLeft.map((x, i) => (
          <g key={i}>
            <line x1={x} y1="720" x2={x + (i % 2 ? -2 : 2)} y2={560 + i * 8} stroke="#3A2818" strokeWidth="1.2" />
            <ellipse cx={x + (i % 2 ? -2 : 2)} cy={560 + i * 8} rx="1.5" ry="6" fill="#5C4028" />
          </g>
        ))}
      </g>
      <g opacity="0.85">
        {reedsRight.map((x, i) => (
          <g key={i}>
            <line x1={x} y1="720" x2={x + (i % 2 ? 2 : -2)} y2={580 + i * 6} stroke="#3A2818" strokeWidth="1.2" />
            <ellipse cx={x + (i % 2 ? 2 : -2)} cy={580 + i * 6} rx="1.5" ry="6" fill="#5C4028" />
          </g>
        ))}
      </g>
      <path d="M120 280 q4 -4 8 0 q4 -4 8 0" stroke="#1A1410" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M280 250 q3 -3 6 0 q3 -3 6 0" stroke="#1A1410" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  );
}

export function HeroSlide4() {
  const stars: Array<[number, number, number]> = [
    [60, 90, 1.8], [120, 60, 1.2], [180, 110, 1.5], [240, 70, 1.3], [300, 120, 1.6], [360, 80, 1.1],
    [40, 180, 0.9], [100, 160, 1.1], [160, 200, 0.8], [220, 170, 1.0], [280, 210, 1.2], [340, 180, 0.9],
    [80, 260, 0.7], [140, 290, 0.9], [200, 250, 1.0], [260, 280, 0.8], [320, 260, 0.7], [380, 290, 0.6],
    [50, 340, 0.6], [110, 360, 0.8], [170, 330, 0.7], [230, 360, 0.6], [290, 340, 0.8], [350, 360, 0.7],
  ];
  return (
    <svg viewBox="0 0 402 720" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="s4sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E1622" />
          <stop offset="50%" stopColor="#1F2A3A" />
          <stop offset="100%" stopColor="#2A2820" />
        </linearGradient>
        <radialGradient id="s4glow" cx="0.5" cy="0.85" r="0.25">
          <stop offset="0%" stopColor="#F4C896" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F4C896" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="402" height="720" fill="url(#s4sky)" />
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#F5F1E8" opacity={0.55 + (r - 0.6) * 0.3} />
      ))}
      <g transform="translate(310, 130)">
        <circle r="3" fill="#FBE6BE" />
        <circle r="6" fill="#FBE6BE" opacity="0.4" />
        <line x1="-12" y1="0" x2="12" y2="0" stroke="#FBE6BE" strokeWidth="0.6" opacity="0.7" />
        <line x1="0" y1="-12" x2="0" y2="12" stroke="#FBE6BE" strokeWidth="0.6" opacity="0.7" />
      </g>
      <path d="M0 480 L70 440 L150 470 L240 425 L320 460 L402 445 L402 720 L0 720 Z" fill="#1A1410" />
      <path d="M0 560 L100 520 L200 550 L300 510 L402 540 L402 720 L0 720 Z" fill="#0E0A08" />
      <rect width="402" height="720" fill="url(#s4glow)" />
      <g transform="translate(201, 600)">
        <ellipse cx="0" cy="14" rx="22" ry="4" fill="#1A1410" />
        <path d="M-12 14 Q-6 -10 0 0 Q6 -18 12 -2 Q14 -10 12 14 Z" fill="#E8A55C" opacity="0.92" />
        <path d="M-6 14 Q-2 -2 2 4 Q6 -8 8 14 Z" fill="#FBE6BE" />
      </g>
      <g transform="translate(150, 595) scale(0.85)">
        <ellipse cx="0" cy="-30" rx="6" ry="8" fill="#0A0805" />
        <path d="M-8 -16 Q0 -22 8 -16 L10 30 L-10 30 Z" fill="#0A0805" />
      </g>
    </svg>
  );
}

export const HERO_SLIDE_COMPONENTS = [HeroSlide1, HeroSlide2, HeroSlide3, HeroSlide4];
