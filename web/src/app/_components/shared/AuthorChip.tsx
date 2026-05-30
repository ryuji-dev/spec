import type { Palette } from "./palette";

type Props = {
  name: string;
  init: string;
  palette: Palette;
  size?: number;
};

/**
 * 작성자 아바타 — 한글 초성 원형 마크. 이름 시드로 톤 변형.
 */
export default function AuthorChip({ name, init, palette, size = 22 }: Props) {
  const seed = (init || name || "").charCodeAt(0) || 0;
  const tones = [palette.primary, palette.secondary, palette.accent, palette.muted, "#3F2E22"];
  const c = tones[seed % tones.length];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: '"Noto Sans KR", system-ui',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          background: c,
          color: "#fff",
          fontSize: size * 0.45,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: "-0.02em",
          flexShrink: 0,
        }}
      >
        {init}
      </div>
      <span
        style={{
          fontSize: 12,
          color: palette.muted,
          letterSpacing: "-0.02em",
        }}
      >
        {name}
      </span>
    </div>
  );
}
