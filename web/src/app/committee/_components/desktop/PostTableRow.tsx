import type { Palette } from "@/app/_components/shared/palette";
import type { Post } from "@/lib/committee-data";
import CatLabel from "@/app/_components/shared/CatLabel";
import { catTone } from "../catTone";

type Props = {
  post: Post;
  palette: Palette;
  index: number;
  onOpen?: () => void;
};

/** 테이블 행 — 전통적 게시판. */
export default function PostTableRow({ post, palette, index, onOpen }: Props) {
  return (
    <div
      onClick={onOpen}
      style={{
        display: "grid",
        gridTemplateColumns: "60px 100px 1fr 180px 100px 90px",
        padding: "14px 16px",
        borderBottom: `1px solid ${palette.line}`,
        alignItems: "center",
        fontSize: 13,
        fontFamily: '"Noto Sans KR", system-ui',
        cursor: "pointer",
      }}
    >
      <div
        style={{
          color: palette.muted,
          fontFamily: "Inter, system-ui",
          fontSize: 12,
          letterSpacing: "0.02em",
        }}
      >
        {String(index).padStart(3, "0")}
      </div>
      <div>
        <CatLabel label={post.cat} tone={catTone(post.cat, palette)} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 500,
          color: palette.ink,
          letterSpacing: "-0.02em",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {post.title}
        </span>
        {post.comments > 0 && (
          <span
            style={{
              fontSize: 11,
              color: palette.primary,
              fontFamily: "Inter, system-ui",
              fontWeight: 600,
            }}
          >
            [{post.comments}]
          </span>
        )}
        {post.isNew && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "1px 5px",
              background: palette.accent,
              color: palette.ink,
              borderRadius: 2,
              fontFamily: "Inter",
            }}
          >
            N
          </span>
        )}
        {post.attach && (
          <svg width="11" height="11" viewBox="0 0 12 12" style={{ color: palette.muted }}>
            <path
              d="M8 3 L4.5 6.5 a1.5 1.5 0 0 0 2 2 L10 5 a3 3 0 0 0 -4 -4 L2 5 a4 4 0 0 0 5.5 5.5"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      <div style={{ color: palette.muted, fontSize: 12.5 }}>{post.author}</div>
      <div
        style={{
          color: palette.muted,
          fontFamily: "Inter, system-ui",
          fontSize: 12,
        }}
      >
        {post.date}
      </div>
      <div
        style={{
          textAlign: "right",
          color: palette.muted,
          fontFamily: "Inter, system-ui",
          fontSize: 12,
        }}
      >
        {post.views.toLocaleString()}
      </div>
    </div>
  );
}
