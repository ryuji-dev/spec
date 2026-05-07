import type { Palette } from "@/app/_components/shared/palette";
import type { Post } from "@/lib/committee-data";
import CatLabel from "@/app/_components/shared/CatLabel";
import StatRow from "@/app/_components/shared/StatRow";
import { catTone } from "../catTone";

type Props = { post: Post; palette: Palette };

export default function PostListMobile({ post, palette }: Props) {
  return (
    <article
      style={{
        padding: "14px 0",
        borderBottom: `1px solid ${palette.line}`,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CatLabel label={post.cat} tone={catTone(post.cat, palette)} />
        <span
          style={{
            fontSize: 10.5,
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
      </div>
      <h4
        style={{
          margin: 0,
          fontFamily: '"Noto Sans KR", system-ui',
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          lineHeight: 1.4,
          color: palette.ink,
        }}
      >
        {post.title}
        {post.comments > 0 && (
          <span
            style={{
              fontSize: 11.5,
              color: palette.primary,
              fontFamily: "Inter, system-ui",
              fontWeight: 600,
              marginLeft: 6,
            }}
          >
            [{post.comments}]
          </span>
        )}
      </h4>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: palette.muted,
            fontFamily: '"Noto Sans KR", system-ui',
          }}
        >
          {post.author}
        </span>
        <StatRow post={post} palette={palette} size={10.5} />
      </div>
    </article>
  );
}
