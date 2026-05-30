import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyTone } from "@/lib/faculty-data";
import { avatarTone } from "../deptTone";

type Props = {
  init: string;
  palette: Palette;
  size?: number;
  tone?: FacultyTone;
};

export default function FacAvatar({ init, palette, size = 56, tone = "forest" }: Props) {
  const c = avatarTone(tone, palette);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontFamily: '"Noto Serif KR", serif',
        fontSize: size * 0.46,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {init}
    </div>
  );
}
