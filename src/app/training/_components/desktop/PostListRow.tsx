import type { Palette } from "@/app/_components/shared/palette";
import type { TrainingPost } from "@/lib/training-data";
import CatLabel from "@/app/_components/shared/CatLabel";
import StatRow from "@/app/_components/shared/StatRow";
import { catTone } from "../catTone";

type Props = {
  post: TrainingPost;
  palette: Palette;
  onOpen?: () => void;
};

export default function PostListRow({ post, palette, onOpen }: Props) {
  return (
    <article
      onClick={onOpen}
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
          <CatLabel label={post.cat} tone={catTone(post.cat, palette)} />
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
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textWrap: "pretty",
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: palette.secondary,
              color: "#fff",
              fontSize: 12,
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
              fontSize: 12,
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
