import type { Palette } from "@/app/_components/shared/palette";
import type { Post } from "@/lib/committee-data";
import AuthorChip from "@/app/_components/shared/AuthorChip";
import CatLabel from "@/app/_components/shared/CatLabel";
import StatRow from "@/app/_components/shared/StatRow";
import { catTone } from "../catTone";

type Props = {
  post: Post;
  palette: Palette;
};

/** 카드형 게시글 (top 2). */
export default function PostCard({ post, palette }: Props) {
  return (
    <article
      style={{
        background: palette.surface,
        borderRadius: 12,
        border: `1px solid ${palette.line}`,
        padding: "22px 24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CatLabel label={post.cat} tone={catTone(post.cat, palette)} />
        {post.isNew && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: "3px 7px",
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
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.4,
          color: palette.ink,
          textWrap: "balance",
        }}
      >
        {post.title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.65,
          color: palette.muted,
          fontWeight: 300,
          fontFamily: '"Noto Sans KR", system-ui',
          textWrap: "pretty",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {post.excerpt}
      </p>
      <div
        style={{
          marginTop: "auto",
          paddingTop: 12,
          borderTop: `1px solid ${palette.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <AuthorChip name={post.author.split(" ")[0]} init={post.authorInit} palette={palette} />
        <StatRow post={post} palette={palette} />
      </div>
    </article>
  );
}
