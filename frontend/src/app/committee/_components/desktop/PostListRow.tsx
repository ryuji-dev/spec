import type { Palette } from "../shared/palette";
import type { Post } from "@/lib/committee-data";
import AuthorChip from "../shared/AuthorChip";
import CatLabel from "../shared/CatLabel";
import StatRow from "../shared/StatRow";

type Props = {
  post: Post;
  palette: Palette;
};

/** 리스트형 — 미디엄/노션 스타일. */
export default function PostListRow({ post, palette }: Props) {
  return (
    <article
      style={{
        padding: "22px 4px",
        borderBottom: `1px solid ${palette.line}`,
        display: "grid",
        gridTemplateColumns: "1fr 220px",
        gap: 32,
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <CatLabel cat={post.cat} palette={palette} />
          <span
            style={{
              fontSize: 11,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
              letterSpacing: "0.02em",
            }}
          >
            {post.date}
          </span>
          {post.isNew && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: "2px 6px",
                background: palette.accent,
                color: palette.ink,
                borderRadius: 2,
                fontFamily: "Inter, system-ui",
                letterSpacing: "0.12em",
              }}
            >
              NEW
            </span>
          )}
        </div>
        <h3
          style={{
            margin: 0,
            fontFamily: '"Noto Sans KR", system-ui',
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.35,
            color: palette.ink,
            marginBottom: 8,
          }}
        >
          {post.title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: 1.6,
            color: palette.muted,
            fontWeight: 300,
            fontFamily: '"Noto Sans KR", system-ui',
            textWrap: "pretty",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.excerpt}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        <AuthorChip
          name={post.author.split(" ").slice(0, 2).join(" ")}
          init={post.authorInit}
          palette={palette}
          size={26}
        />
        <StatRow post={post} palette={palette} />
      </div>
    </article>
  );
}
