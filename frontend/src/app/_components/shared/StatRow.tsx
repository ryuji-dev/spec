import type { Palette } from "./palette";

type PostStats = {
  views: number;
  comments: number;
  attach?: number;
};

type Props = {
  post: PostStats;
  palette: Palette;
  size?: number;
};

export default function StatRow({ post, palette, size = 11 }: Props) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        fontSize: size,
        color: palette.muted,
        fontFamily: "Inter, system-ui",
        letterSpacing: "0.01em",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <ellipse cx="6" cy="6" rx="5" ry="3.2" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="6" cy="6" r="1.4" fill="currentColor" />
        </svg>
        {post.views.toLocaleString()}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 3 H10 V8.5 H6.5 L4 11 V8.5 H2 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        {post.comments}
      </span>
      {post.attach ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M8 3 L4.5 6.5 a1.5 1.5 0 0 0 2 2 L10 5 a3 3 0 0 0 -4 -4 L2 5 a4 4 0 0 0 5.5 5.5"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          {post.attach}
        </span>
      ) : null}
    </div>
  );
}
