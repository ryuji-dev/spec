import type { Palette } from "@/app/_components/shared/palette";
import type { TrainingPost } from "@/lib/training-data";
import CatLabel from "@/app/_components/shared/CatLabel";
import StatRow from "@/app/_components/shared/StatRow";
import { catTone } from "../catTone";

type Props = {
  post: TrainingPost;
  palette: Palette;
};

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
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textWrap: "pretty",
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: palette.primary,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: '"Noto Sans KR", system-ui',
            }}
          >
            {post.authorInit}
          </div>
          <span
            style={{
              fontSize: 11.5,
              color: palette.muted,
              fontFamily: '"Noto Sans KR", system-ui',
              letterSpacing: "-0.01em",
            }}
          >
            {post.author.split(" ").slice(0, 2).join(" ")}
          </span>
        </div>
        <StatRow post={post} palette={palette} />
      </div>
    </article>
  );
}
