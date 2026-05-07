import type { Palette } from "@/app/_components/shared/palette";

type Props = {
  count: number;
  palette: Palette;
  size?: number;
};

/**
 * 다운로드 카운트 표시(아이콘 + 숫자). 디자인 원본 library.jsx 의 DownloadStat 그대로.
 */
export default function DownloadStat({ count, palette, size = 11 }: Props) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: size,
        color: palette.muted,
        fontFamily: "Inter, system-ui",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 1 V8 M3 5.5 L6 8.5 L9 5.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line
          x1="2"
          y1="11"
          x2="10"
          y2="11"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      {count.toLocaleString()}
    </span>
  );
}
