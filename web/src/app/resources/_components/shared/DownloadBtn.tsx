import type { Palette } from "@/app/_components/shared/palette";

type Variant = "primary" | "ghost";
type Size = "md" | "sm";

type Props = {
  palette: Palette;
  variant?: Variant;
  size?: Size;
  label?: string;
};

const SIZES: Record<Size, { pad: string; fs: number }> = {
  md: { pad: "9px 14px", fs: 12 },
  sm: { pad: "6px 11px", fs: 11 },
};

/**
 * 다운로드 버튼 (primary / ghost 변형).
 * 디자인 원본 library.jsx 의 DownloadBtn 그대로.
 */
export default function DownloadBtn({
  palette,
  variant = "primary",
  size = "md",
  label = "다운로드",
}: Props) {
  const s = SIZES[size];
  const isGhost = variant === "ghost";
  return (
    <button
      type="button"
      style={{
        background: isGhost ? "transparent" : palette.ink,
        color: isGhost ? palette.ink : "#fff",
        border: isGhost ? `1px solid ${palette.line}` : "none",
        padding: s.pad,
        borderRadius: 2,
        fontSize: s.fs,
        fontWeight: 600,
        fontFamily: '"Noto Sans KR", system-ui',
        letterSpacing: "-0.01em",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 1 V8 M3 5.5 L6 8.5 L9 5.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="2"
          y1="11"
          x2="10"
          y2="11"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      {label}
    </button>
  );
}
