import type { Palette } from "../shared/palette";
import { BD_POPULAR, BD_TAGS, SIDE_AUTHORS } from "@/lib/committee-data";

type SideProps = { palette: Palette };

/** 사이드 — 인기 게시글. */
function SidePopular({ palette }: SideProps) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: `2px solid ${palette.ink}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.24em",
              color: palette.secondary,
              fontWeight: 600,
              fontFamily: "Inter, system-ui",
            }}
          >
            POPULAR · 이번 주
          </div>
          <div
            style={{
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 19,
              fontWeight: 500,
              marginTop: 4,
              letterSpacing: "-0.02em",
            }}
          >
            많이 읽힌 글
          </div>
        </div>
      </div>
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {BD_POPULAR.map((p, i) => (
          <li
            key={p.id}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              gap: 12,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 22,
                fontWeight: 400,
                color: i === 0 ? palette.accent : palette.muted,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: palette.ink,
                  lineHeight: 1.45,
                  letterSpacing: "-0.02em",
                  fontFamily: '"Noto Sans KR", system-ui',
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: palette.muted,
                  marginTop: 4,
                  fontFamily: "Inter, system-ui",
                  letterSpacing: "0.02em",
                }}
              >
                {p.views.toLocaleString()} views
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 사이드 — 태그. */
function SideTags({ palette }: SideProps) {
  return (
    <div>
      <div
        style={{
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: `2px solid ${palette.ink}`,
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: "0.24em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
          }}
        >
          TAGS
        </div>
        <div
          style={{
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 19,
            fontWeight: 500,
            marginTop: 4,
            letterSpacing: "-0.02em",
          }}
        >
          주요 태그
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {BD_TAGS.map((t, i) => (
          <span
            key={t}
            style={{
              fontSize: 11.5,
              background: i % 3 === 0 ? palette.ink : palette.surface,
              color: i % 3 === 0 ? "#fff" : palette.ink,
              padding: "5px 10px",
              borderRadius: 999,
              border: i % 3 === 0 ? "none" : `1px solid ${palette.line}`,
              fontFamily: '"Noto Sans KR", system-ui',
              fontWeight: 500,
              letterSpacing: "-0.01em",
              cursor: "pointer",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 사이드 — 활발한 작성자. */
function SideAuthorsBlock({ palette }: SideProps) {
  return (
    <div>
      <div
        style={{
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: `2px solid ${palette.ink}`,
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: "0.24em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
          }}
        >
          CONTRIBUTORS
        </div>
        <div
          style={{
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 19,
            fontWeight: 500,
            marginTop: 4,
            letterSpacing: "-0.02em",
          }}
        >
          활발한 작성자
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SIDE_AUTHORS.map((a) => {
          const seed = a.init.charCodeAt(0);
          const tones = [palette.primary, palette.secondary, palette.accent, palette.muted];
          const c = tones[seed % tones.length];
          return (
            <div
              key={a.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 0",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: c,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.02em",
                  flexShrink: 0,
                }}
              >
                {a.init}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: palette.ink,
                    fontFamily: '"Noto Sans KR", system-ui',
                    letterSpacing: "-0.02em",
                  }}
                >
                  {a.name}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: palette.muted,
                    marginTop: 1,
                    fontFamily: '"Noto Sans KR", system-ui',
                  }}
                >
                  {a.role}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: palette.primary,
                  fontFamily: "Inter, system-ui",
                  fontWeight: 600,
                }}
              >
                {a.posts} posts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar({ palette }: SideProps) {
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <SidePopular palette={palette} />
      <SideTags palette={palette} />
      <SideAuthorsBlock palette={palette} />
    </aside>
  );
}
