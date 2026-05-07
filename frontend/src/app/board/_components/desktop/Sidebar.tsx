import type { Palette } from "@/app/_components/shared/palette";
import { CM_CATEGORIES, CM_MEMBERS, CM_TAGS } from "@/lib/board-data";
import CmAvatar from "../shared/CmAvatar";
import { catTone } from "../catTone";

type Props = { palette: Palette };

/**
 * 자유게시판 사이드바 — 활발한 멤버 / 인기 태그 / 가이드 / 카테고리.
 * 디자인 원본 community.jsx CommunityDesktop 의 aside 영역 그대로.
 */
export function SideMembers({ palette }: Props) {
  return (
    <section>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: "0.24em",
          color: palette.secondary,
          fontWeight: 600,
          fontFamily: "Inter, system-ui",
          marginBottom: 14,
        }}
      >
        ACTIVE THIS MONTH
      </div>
      <div
        style={{
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 4,
          padding: "6px 18px",
        }}
      >
        {CM_MEMBERS.map((m, i) => (
          <div
            key={m.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom:
                i < CM_MEMBERS.length - 1
                  ? `1px solid ${palette.line}`
                  : "none",
              cursor: "pointer",
            }}
          >
            <div style={{ position: "relative" }}>
              <CmAvatar init={m.init} name={m.name} palette={palette} size={32} />
              {i < 3 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    background: i === 0 ? palette.accent : palette.bg,
                    color: palette.ink,
                    border: `1.5px solid ${palette.surface}`,
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  {i + 1}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: palette.ink,
                  letterSpacing: "-0.02em",
                  fontFamily: '"Noto Sans KR", system-ui',
                }}
              >
                {m.name}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: palette.muted,
                  marginTop: 1,
                  fontFamily: '"Noto Sans KR", system-ui',
                }}
              >
                {m.church}교회
              </div>
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: palette.muted,
                fontFamily: "Inter, system-ui",
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 17,
                  fontWeight: 500,
                  color: palette.primary,
                  lineHeight: 1,
                }}
              >
                {m.posts}
              </div>
              <div style={{ marginTop: 2 }}>posts</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SideTags({ palette }: Props) {
  return (
    <section>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: "0.24em",
          color: palette.secondary,
          fontWeight: 600,
          fontFamily: "Inter, system-ui",
          marginBottom: 14,
        }}
      >
        TRENDING TAGS
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CM_TAGS.map((t) => (
          <button
            key={t.tag}
            type="button"
            style={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              padding: "7px 12px",
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: '"Noto Sans KR", system-ui',
              letterSpacing: "-0.01em",
              color: palette.ink,
              display: "inline-flex",
              alignItems: "baseline",
              gap: 5,
            }}
          >
            <span>#{t.tag}</span>
            <span
              style={{
                fontSize: 10,
                color: palette.muted,
                fontFamily: "Inter, system-ui",
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function SideGuide({ palette }: Props) {
  return (
    <section
      style={{
        background: palette.ink,
        color: "#F5F1E8",
        padding: 24,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.24em",
          opacity: 0.55,
          fontWeight: 600,
          fontFamily: "Inter, system-ui",
          marginBottom: 12,
        }}
      >
        BOARD GUIDE
      </div>
      <h4
        style={{
          margin: 0,
          marginBottom: 12,
          fontFamily: '"Noto Serif KR", serif',
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.4,
        }}
      >
        이곳은 형제가 연합하여
        <br />
        동거하는 자리입니다
      </h4>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          fontSize: 11.5,
          lineHeight: 1.7,
          opacity: 0.7,
          fontFamily: '"Noto Sans KR", system-ui',
          letterSpacing: "-0.01em",
        }}
      >
        <li
          style={{ display: "flex", gap: 8, paddingLeft: 0, marginBottom: 4 }}
        >
          <span style={{ opacity: 0.5 }}>—</span>
          서로의 사역을 격려합니다
        </li>
        <li
          style={{ display: "flex", gap: 8, paddingLeft: 0, marginBottom: 4 }}
        >
          <span style={{ opacity: 0.5 }}>—</span>
          정치·교리 논쟁은 자제합니다
        </li>
        <li style={{ display: "flex", gap: 8, paddingLeft: 0 }}>
          <span style={{ opacity: 0.5 }}>—</span>
          기도제목은 신중히 다룹니다
        </li>
      </ul>
    </section>
  );
}

export function SideCategories({ palette }: Props) {
  return (
    <section>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: "0.24em",
          color: palette.secondary,
          fontWeight: 600,
          fontFamily: "Inter, system-ui",
          marginBottom: 14,
        }}
      >
        CATEGORIES
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CM_CATEGORIES.slice(1).map((c) => {
          const t = catTone(c.ko as Exclude<typeof c.ko, "전체">, palette);
          return (
            <div
              key={c.en}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: t.bg,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: palette.ink,
                    letterSpacing: "-0.02em",
                    fontFamily: '"Noto Sans KR", system-ui',
                  }}
                >
                  {c.ko}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: palette.muted,
                    marginTop: 1,
                    fontFamily: '"Noto Sans KR", system-ui',
                  }}
                >
                  {c.hint}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  color: palette.muted,
                  fontFamily: "Inter, system-ui",
                }}
              >
                {c.count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
