"use client";
import { useOptimistic, useTransition } from "react";
import type { MouseEvent } from "react";
import type { Palette } from "@/app/_components/shared/palette";
import { toggleLike } from "@/server/actions/board-like";

type Props = {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  palette: Palette;
};

// 좋아요 토글 — 디자인 하트 마크업 보존(span + svg). liked 시 채움색만 반영.
export default function LikeButton({ postId, initialLiked, initialCount, palette }: Props) {
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(
    { liked: initialLiked, count: initialCount },
    (_prev, next: { liked: boolean; count: number }) => next,
  );
  const onClick = (e: MouseEvent) => {
    e.stopPropagation(); // 카드 onClick(상세 이동) 차단
    startTransition(async () => {
      setOptimistic({
        liked: !state.liked,
        count: state.count + (state.liked ? -1 : 1),
      });
      await toggleLike(postId);
    });
  };
  return (
    <span
      role="button"
      aria-pressed={state.liked}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
        color: state.liked ? palette.primary : "inherit",
        fontWeight: state.liked ? 700 : "inherit",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 10 C6 10 1.5 7 1.5 4 a2.5 2.5 0 0 1 4.5 -1.5 a2.5 2.5 0 0 1 4.5 1.5 C10.5 7 6 10 6 10 Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill={state.liked ? "currentColor" : "none"}
        />
      </svg>
      {state.count}
    </span>
  );
}
