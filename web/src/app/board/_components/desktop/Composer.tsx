"use client";

import { useRouter } from "next/navigation";
import type { Palette } from "@/app/_components/shared/palette";
import CmAvatar from "../shared/CmAvatar";

type Props = { palette: Palette };

// 카테고리 선택까지 마크업으로 표현하기엔 컴포저가 단순 진입 트리거라,
// 클릭 시 /board/new 작성 폼으로 라우팅한다(마크업 보존).
const QUICK_BUTTONS: ReadonlyArray<{ label: string; icon: string; cat: string }> = [
  { label: "나눔", icon: "✿", cat: "나눔" },
  { label: "질문", icon: "?", cat: "Q&A" },
  { label: "기도", icon: "✚", cat: "기도" },
];

/**
 * 컴포저 — 글쓰기 진입 영역.
 * 디자인 원본 community.jsx 의 Composer 그대로. 클릭 시 /board/new 로 이동.
 */
export default function Composer({ palette }: Props) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push("/board/new")}
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
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/board/new?cat=${encodeURIComponent(b.cat)}`);
            }}
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
