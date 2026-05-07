import type { Palette } from "../shared/palette";
import type { Post } from "@/lib/committee-data";
import AuthorChip from "../shared/AuthorChip";
import CatLabel from "../shared/CatLabel";
import StatRow from "../shared/StatRow";

type Props = { post: Post; palette: Palette };

export default function PostCardMobile({ post, palette }: Props) {
  return (
    <article
      style={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 12,
        padding: "18px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CatLabel cat={post.cat} palette={palette} />
        {post.isNew && (
          <span
            style={{
              fontSize: 9,
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
          fontSize: 16,
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
          fontSize: 12.5,
          lineHeight: 1.6,
          color: palette.muted,
          fontWeight: 300,
          fontFamily: '"Noto Sans KR", system-ui',
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
          marginTop: 4,
          paddingTop: 10,
          borderTop: `1px solid ${palette.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <AuthorChip
          name={post.author.split(" ").slice(0, 2).join(" ")}
          init={post.authorInit}
          palette={palette}
          size={20}
        />
        <StatRow post={post} palette={palette} size={10.5} />
      </div>
    </article>
  );
}
