import type { Palette } from "@/app/_components/shared/palette";

type Props = {
  init: string;
  name?: string;
  palette: Palette;
  size?: number;
};

/**
 * 자유게시판 아바타 — 디자인 원본 community.jsx 의 CmAvatar 그대로.
 * 첫 글자 코드값으로 팔레트 톤을 결정해 시각적 다양성 확보.
 */
export default function CmAvatar({ init, name, palette, size = 32 }: Props) {
  const seed = (init || name || "").charCodeAt(0) || 0;
  const tones = [
    palette.primary,
    palette.secondary,
    palette.accent,
    palette.muted,
    "#3F2E22",
    "#9B3A2A",
  ];
  const c = tones[seed % tones.length];
  const fg = c === palette.accent ? palette.ink : "#fff";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: c,
        color: fg,
        fontSize: size * 0.42,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "-0.02em",
        flexShrink: 0,
        fontFamily: '"Noto Sans KR", system-ui',
      }}
    >
      {init}
    </div>
  );
}
