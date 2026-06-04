import type { Palette } from "@/app/_components/shared/palette";
import type { FeedPost } from "@/lib/board-data";
import CmAvatar from "../shared/CmAvatar";
import CmCatChip from "../shared/CmCatChip";
import FeedCover from "../shared/FeedCover";
import LikeButton from "../LikeButton";

type Props = {
  post: FeedPost;
  palette: Palette;
  onOpen?: () => void;
};

/**
 * 일반 피드 카드.
 * 디자인 원본 community.jsx 의 FeedCard 그대로.
 */
export default function FeedCard({ post, palette, onOpen }: Props) {
  const hasImage = !!post.image;
  const isPrayer = post.kind === "prayer";
  const isQuestion = post.kind === "question";

  return (
    <article
      onClick={onOpen}
      style={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 4,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        gap: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          padding: "20px 24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CmCatChip cat={post.cat} palette={palette} />
          {post.isNew && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: palette.primary,
                fontFamily: "Inter, system-ui",
              }}
            >
              NEW
            </span>
          )}
          {isQuestion && post.isAnswered && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: palette.primary,
                fontFamily: "Inter, system-ui",
                background: palette.primary + "14",
                padding: "2px 7px",
                borderRadius: 2,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 5 L4.5 7.5 L8.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              해결됨
            </span>
          )}
        </div>

        <h3
          style={{
            margin: 0,
            fontFamily: '"Noto Sans KR", system-ui',
            fontSize: 17,
            fontWeight: 700,
            color: palette.ink,
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
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
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingTop: 8,
            marginTop: "auto",
          }}
        >
          <CmAvatar init={post.avatar} name={post.author} palette={palette} size={24} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: palette.ink,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {post.author}
              <span
                style={{
                  fontSize: 11,
                  color: palette.muted,
                  fontWeight: 500,
                  marginLeft: 6,
                }}
              >
                · {post.church}
              </span>
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: palette.muted,
                marginTop: 1,
                fontFamily: "Inter, system-ui",
              }}
            >
              {post.date}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 11,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
            }}
          >
            {isPrayer ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: palette.primary,
                  fontWeight: 700,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 2 V10 M2 6 H10"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                기도 {post.prayerCount}
              </span>
            ) : (
              <LikeButton
                postId={post.id}
                initialLiked={post.likedByMe ?? false}
                initialCount={post.likes}
                palette={palette}
              />
            )}
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
          </div>
        </div>
      </div>
      {hasImage && post.image && (
        <div
          style={{
            width: 200,
            flexShrink: 0,
            borderLeft: `1px solid ${palette.line}`,
            background: palette.bg,
          }}
        >
          <FeedCover kind={post.image} palette={palette} />
        </div>
      )}
    </article>
  );
}
