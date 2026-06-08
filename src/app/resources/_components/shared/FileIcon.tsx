import type { Palette } from "@/app/_components/shared/palette";
import type { ResourceFileType } from "@/lib/resources-data";
import { fileTone } from "../fileTone";

type Props = {
  type: ResourceFileType;
  palette: Palette;
  size?: number;
};

/**
 * 파일타입별 인라인 SVG 아이콘. 원본 library.jsx 의 FileIcon 그대로.
 */
export default function FileIcon({ type, palette, size = 44 }: Props) {
  const t = fileTone(type, palette);
  const stroke = t.color;

  if (type === "ppt") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <rect
          x="6"
          y="3"
          width="32"
          height="38"
          rx="2"
          fill={t.soft}
          stroke={stroke}
          strokeWidth="1.4"
        />
        <rect x="11" y="13" width="22" height="13" rx="1" fill={stroke} opacity="0.18" />
        <circle cx="22" cy="19.5" r="3" fill={stroke} />
        <rect x="11" y="29" width="14" height="2" fill={stroke} opacity="0.5" />
        <rect x="11" y="33" width="18" height="2" fill={stroke} opacity="0.4" />
      </svg>
    );
  }
  if (type === "pdf") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <path
          d="M10 3 H28 L36 11 V41 H10 Z"
          fill={t.soft}
          stroke={stroke}
          strokeWidth="1.4"
        />
        <path d="M28 3 V11 H36" stroke={stroke} strokeWidth="1.4" fill="none" />
        <text
          x="22"
          y="30"
          fontFamily="Inter"
          fontSize="9"
          fontWeight="700"
          fill={stroke}
          textAnchor="middle"
        >
          PDF
        </text>
      </svg>
    );
  }
  if (type === "score") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <rect
          x="6"
          y="3"
          width="32"
          height="38"
          rx="2"
          fill={t.soft}
          stroke={stroke}
          strokeWidth="1.4"
        />
        {[12, 16, 20, 24, 28].map((y) => (
          <line
            key={y}
            x1="11"
            y1={y}
            x2="33"
            y2={y}
            stroke={stroke}
            strokeWidth="0.5"
            opacity="0.5"
          />
        ))}
        <ellipse
          cx="16"
          cy="28"
          rx="3"
          ry="2.2"
          transform="rotate(-15 16 28)"
          fill={stroke}
        />
        <line x1="18.6" y1="27" x2="18.6" y2="14" stroke={stroke} strokeWidth="1.2" />
        <ellipse
          cx="27"
          cy="32"
          rx="3"
          ry="2.2"
          transform="rotate(-15 27 32)"
          fill={stroke}
        />
        <line x1="29.6" y1="31" x2="29.6" y2="18" stroke={stroke} strokeWidth="1.2" />
        <path
          d="M18.6 14 Q24 12 29.6 18"
          stroke={stroke}
          strokeWidth="1.4"
          fill="none"
        />
      </svg>
    );
  }
  if (type === "doc") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <path
          d="M10 3 H28 L36 11 V41 H10 Z"
          fill={t.soft}
          stroke={stroke}
          strokeWidth="1.4"
        />
        <path d="M28 3 V11 H36" stroke={stroke} strokeWidth="1.4" fill="none" />
        <line x1="14" y1="20" x2="32" y2="20" stroke={stroke} strokeWidth="1" opacity="0.6" />
        <line x1="14" y1="25" x2="32" y2="25" stroke={stroke} strokeWidth="1" opacity="0.6" />
        <line x1="14" y1="30" x2="32" y2="30" stroke={stroke} strokeWidth="1" opacity="0.6" />
        <line x1="14" y1="35" x2="26" y2="35" stroke={stroke} strokeWidth="1" opacity="0.6" />
      </svg>
    );
  }
  if (type === "video") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <rect
          x="4"
          y="9"
          width="36"
          height="26"
          rx="2"
          fill={t.soft}
          stroke={stroke}
          strokeWidth="1.4"
        />
        <path d="M19 17 L29 22 L19 27 Z" fill={stroke} />
        <circle cx="10" cy="22" r="1.5" fill={stroke} opacity="0.5" />
        <circle cx="34" cy="22" r="1.5" fill={stroke} opacity="0.5" />
      </svg>
    );
  }
  if (type === "image") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <rect
          x="6"
          y="6"
          width="32"
          height="32"
          rx="2"
          fill={t.soft}
          stroke={stroke}
          strokeWidth="1.4"
        />
        <circle cx="14" cy="16" r="2.5" fill={stroke} />
        <path
          d="M6 32 L16 22 L24 28 L32 18 L38 23 V38 H6 Z"
          fill={stroke}
          opacity="0.5"
        />
      </svg>
    );
  }
  return null;
}
