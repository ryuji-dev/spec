import type { Palette } from "../shared/palette";
import type { Post } from "@/lib/committee-data";

type Props = {
  post: Post;
  palette: Palette;
};

/**
 * 게시판 핀 카드 (어두운 배경 + accent 글로우).
 * 디자인 원본 board.jsx PinnedCard.
 */
export default function PinnedCard({ post, palette }: Props) {
  return (
    <article
      style={{
        background: palette.ink,
        color: "#F5F1E8",
        borderRadius: 14,
        padding: "32px 36px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 28,
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 패턴 장식 */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: 999,
          background: `radial-gradient(circle, ${palette.accent}33 0%, transparent 65%)`,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -60,
          left: "40%",
          width: 180,
          height: 180,
          borderRadius: 999,
          background: `radial-gradient(circle, ${palette.primary}55 0%, transparent 70%)`,
        }}
      />

      <div style={{ position: "relative", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: palette.accent,
              color: palette.ink,
              fontSize: 10,
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: 2,
              letterSpacing: "0.08em",
              fontFamily: "Inter, system-ui",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: palette.ink,
              }}
            />
            PINNED · 공지
          </span>
          {post.isNew && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 8px",
                background: "transparent",
                color: palette.accent,
                border: `1px solid ${palette.accent}`,
                borderRadius: 2,
                fontFamily: "Inter, system-ui",
                letterSpacing: "0.1em",
              }}
            >
              NEW
            </span>
          )}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif',
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            marginBottom: 14,
          }}
        >
          {post.title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            lineHeight: 1.7,
            fontFamily: '"Noto Sans KR", system-ui',
            fontWeight: 300,
            opacity: 0.85,
            maxWidth: 620,
            textWrap: "pretty",
          }}
        >
          {post.excerpt}
        </p>
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: palette.accent,
                color: palette.ink,
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
                fontSize: 12.5,
                fontFamily: '"Noto Sans KR", system-ui',
                opacity: 0.85,
                letterSpacing: "-0.01em",
              }}
            >
              {post.author}
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: "rgba(245,241,232,0.25)" }} />
          <span
            style={{
              fontSize: 11.5,
              opacity: 0.7,
              fontFamily: "Inter, system-ui",
              letterSpacing: "0.02em",
            }}
          >
            {post.date}
          </span>
          <span
            style={{
              fontSize: 11.5,
              opacity: 0.7,
              fontFamily: "Inter, system-ui",
            }}
          >
            · {post.views.toLocaleString()} views
          </span>
          <span
            style={{
              fontSize: 11.5,
              opacity: 0.7,
              fontFamily: "Inter, system-ui",
            }}
          >
            · {post.comments} comments
          </span>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          style={{
            background: palette.accent,
            color: palette.ink,
            border: "none",
            padding: "14px 24px",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: '"Noto Sans KR", system-ui',
            letterSpacing: "-0.01em",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          본문 읽기
          <svg width="11" height="11" viewBox="0 0 12 12">
            <path
              d="M3 6 H10 M7 3 L10 6 L7 9"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          style={{
            background: "transparent",
            color: "#F5F1E8",
            border: `1px solid rgba(245,241,232,0.3)`,
            padding: "11px 22px",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: '"Noto Sans KR", system-ui',
            letterSpacing: "-0.01em",
            cursor: "pointer",
          }}
        >
          일정 캘린더 추가
        </button>
      </div>
    </article>
  );
}
