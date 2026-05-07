import type { Palette } from "@/app/_components/shared/palette";
import CmAvatar from "../shared/CmAvatar";

type Props = { palette: Palette };

const QUICK_BUTTONS: ReadonlyArray<{ label: string; icon: string }> = [
  { label: "나눔", icon: "✿" },
  { label: "질문", icon: "?" },
  { label: "기도", icon: "✚" },
];

/**
 * 컴포저 — 글쓰기 진입 영역.
 * 디자인 원본 community.jsx 의 Composer 그대로.
 */
export default function Composer({ palette }: Props) {
  return (
    <div
      style={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 4,
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 28,
      }}
    >
      <CmAvatar init="나" name="me" palette={palette} size={36} />
      <div
        style={{
          flex: 1,
          fontSize: 13.5,
          color: palette.muted,
          fontFamily: '"Noto Sans KR", system-ui',
          letterSpacing: "-0.01em",
        }}
      >
        오늘은 어떤 이야기를 나누고 싶으신가요?
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {QUICK_BUTTONS.map((b) => (
          <button
            key={b.label}
            type="button"
            style={{
              background: palette.bg,
              color: palette.ink,
              border: `1px solid ${palette.line}`,
              padding: "7px 12px",
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: '"Noto Sans KR", system-ui',
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.7 }}>{b.icon}</span>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
