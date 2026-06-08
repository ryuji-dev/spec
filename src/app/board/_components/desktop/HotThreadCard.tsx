import type { Palette } from "@/app/_components/shared/palette";
import type { HotThread } from "@/lib/board-data";
import CmAvatar from "../shared/CmAvatar";
import CmCatChip from "../shared/CmCatChip";
import HeatGauge from "../shared/HeatGauge";

type Props = {
  post: HotThread;
  palette: Palette;
};

/**
 * HOT 스레드 카드 (큰 카드).
 * 디자인 원본 community.jsx 의 HotThreadCard 그대로.
 */
export default function HotThreadCard({ post, palette }: Props) {
  return (
    <article
      style={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 4,
        padding: "24px 26px 22px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <HeatGauge heat={post.heat} />
        <CmCatChip cat={post.cat} palette={palette} />
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 22,
            fontWeight: 500,
            color: palette.ink,
            letterSpacing: "-0.025em",
            lineHeight: 1.32,
          }}
        >
          {post.title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
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
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
        <CmAvatar init={post.avatar} name={post.author} palette={palette} size={28} />
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: palette.ink,
              letterSpacing: "-0.02em",
              fontFamily: '"Noto Sans KR", system-ui',
            }}
          >
            {post.author}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
              marginTop: 1,
            }}
          >
            {post.church} · {post.date}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 11.5,
            color: palette.muted,
            fontFamily: "Inter, system-ui",
          }}
        >
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 10 C6 10 1.5 7 1.5 4 a2.5 2.5 0 0 1 4.5 -1.5 a2.5 2.5 0 0 1 4.5 1.5 C10.5 7 6 10 6 10 Z"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
              />
            </svg>
            {post.likes}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <ellipse cx="6" cy="6" rx="5" ry="3.2" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="6" cy="6" r="1.4" fill="currentColor" />
            </svg>
            {post.views.toLocaleString()}
          </span>
        </div>
      </div>

      {post.lastReply && (
        <div
          style={{
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            borderRadius: 4,
            padding: "12px 14px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginTop: 4,
          }}
        >
          <CmAvatar
            init={post.lastReply.name.charAt(0)}
            name={post.lastReply.name}
            palette={palette}
            size={22}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: palette.ink,
                  letterSpacing: "-0.02em",
                }}
              >
                {post.lastReply.name}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: palette.muted,
                  fontFamily: "Inter, system-ui",
                }}
              >
                {post.lastReply.when}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: palette.muted,
                lineHeight: 1.5,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {post.lastReply.text}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
