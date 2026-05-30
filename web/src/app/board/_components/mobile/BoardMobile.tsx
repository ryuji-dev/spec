"use client";

import { useState } from "react";
import BottomTabBar from "@/app/main/_components/mobile/BottomTabBar";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import { PageHeroMobile } from "@/app/_components/PageHero";
import {
  BOARD_SORTS,
  BOARD_STATS_MOBILE,
  CM_CATEGORIES,
  CM_FEED,
  CM_HOT,
  CM_VERSE,
  type BoardSort,
} from "@/lib/board-data";
import CmAvatar from "../shared/CmAvatar";
import CmCatChip from "../shared/CmCatChip";
import HeatGauge from "../shared/HeatGauge";
import FeedCover from "../shared/FeedCover";

type Props = { deviceType?: "ios" | "android" };

const palette = FOREST_PALETTE;

/**
 * 자유게시판 모바일 — 디자인 원본 community.jsx 의 CommunityMobile 그대로.
 * 디바이스별 상단 패딩만 deviceType prop 으로 분기.
 */
export default function BoardMobile({ deviceType = "ios" }: Props) {
  const [activeCat, setActiveCat] = useState(0);
  const [sort, setSort] = useState<BoardSort>("recent");

  const filtered =
    activeCat === 0
      ? CM_FEED
      : CM_FEED.filter((p) => p.cat === CM_CATEGORIES[activeCat].ko);

  return (
    <div
      style={{
        background: palette.bg,
        color: palette.ink,
        minHeight: "100%",
        fontFamily: '"Noto Sans KR", system-ui',
        paddingBottom: 90,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          paddingTop: deviceType === "ios" ? 54 : 24,
          paddingBottom: 14,
          paddingLeft: 20,
          paddingRight: 20,
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 4 L6 10 L12 16"
                stroke={palette.ink}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div>
            <div
              style={{
                fontSize: 8.5,
                letterSpacing: "0.22em",
                color: palette.secondary,
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
              }}
            >
              SEOGYEONG · COMMUNITY
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: palette.ink,
                letterSpacing: "-0.02em",
                marginTop: 1,
              }}
            >
              자유게시판
            </div>
          </div>
        </div>
        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            padding: 4,
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="6" stroke={palette.ink} strokeWidth="1.5" fill="none" />
            <path d="M13 13 L17 17" stroke={palette.ink} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <PageHeroMobile
        kicker="COMMUNITY"
        title={
          <>
            자유게시판,
            <br />
            <em>오늘의 이야기를 나누다</em>
          </>
        }
      />

      {/* 말씀 카드 + 통계 — hero 아래 별도 섹션 */}
      <section
        style={{
          padding: "20px 20px 22px",
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            background: palette.ink,
            color: "#F5F1E8",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 8.5,
              letterSpacing: "0.24em",
              opacity: 0.5,
              fontFamily: "Inter, system-ui",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            VERSE OF THE DAY
          </div>
          <div
            style={{
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 13.5,
              fontWeight: 400,
              lineHeight: 1.55,
              letterSpacing: "-0.015em",
            }}
          >
            {CM_VERSE.text}
          </div>
          <div
            style={{
              fontSize: 10,
              opacity: 0.6,
              marginTop: 8,
              letterSpacing: "0.04em",
            }}
          >
            — {CM_VERSE.ref}
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            borderRadius: 4,
            padding: "12px 14px",
          }}
        >
          {BOARD_STATS_MOBILE.map((s, i) => (
            <div
              key={s.l}
              style={{
                paddingLeft: i === 0 ? 0 : 12,
                borderLeft: i === 0 ? "none" : `1px solid ${palette.line}`,
              }}
            >
              <div
                style={{
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 17,
                  fontWeight: 500,
                  color: palette.primary,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {s.k}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: palette.muted,
                  marginTop: 4,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOT */}
      <section style={{ padding: "22px 0 6px" }}>
        <div
          style={{
            padding: "0 20px",
            marginBottom: 12,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.2em",
              color: "#C75B3F",
              fontWeight: 700,
              fontFamily: "Inter, system-ui",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <svg width="11" height="13" viewBox="0 0 12 14" fill="none">
              <path
                d="M6 1 C8 4 10 6 10 9 a4 4 0 0 1 -8 0 C2 7 3.5 6 4.5 4 C5 5 5.5 5.5 6 5 C6 3.5 5.5 2.5 6 1 Z"
                fill="#C75B3F"
              />
            </svg>
            HOT THREADS
          </div>
          <a
            style={{
              color: palette.primary,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            전체 →
          </a>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            padding: "0 20px 8px",
            scrollbarWidth: "none",
          }}
        >
          {CM_HOT.map((p) => (
            <div
              key={p.id}
              style={{
                flex: "0 0 280px",
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 8,
                padding: "16px 16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <HeatGauge heat={p.heat} />
                <CmCatChip cat={p.cat} palette={palette} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: '"Noto Serif KR", serif',
                    fontSize: 16,
                    fontWeight: 500,
                    color: palette.ink,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.32,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {p.title}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: palette.muted,
                  lineHeight: 1.55,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {p.excerpt}
              </div>
              <div
                style={{
                  paddingTop: 10,
                  borderTop: `1px solid ${palette.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 10.5,
                  color: palette.muted,
                  fontFamily: "Inter, system-ui",
                }}
              >
                <span>댓글 {p.comments}</span>
                <span>♥ {p.likes}</span>
                <span>👁 {p.views.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 카테고리 sticky */}
      <section
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(251,248,241,0.95)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderTop: `1px solid ${palette.line}`,
          borderBottom: `1px solid ${palette.line}`,
          padding: "12px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            padding: "0 20px",
            scrollbarWidth: "none",
          }}
        >
          {CM_CATEGORIES.map((c, i) => {
            const active = activeCat === i;
            return (
              <button
                key={c.en}
                type="button"
                onClick={() => setActiveCat(i)}
                style={{
                  background: active ? palette.ink : palette.surface,
                  color: active ? "#fff" : palette.ink,
                  border: `1px solid ${active ? palette.ink : palette.line}`,
                  padding: "7px 13px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {c.ko}
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "Inter, system-ui",
                    opacity: active ? 0.8 : 0.55,
                  }}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 정렬 */}
      <div
        style={{
          padding: "14px 20px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 12, color: palette.muted }}>
          총{" "}
          <strong style={{ color: palette.ink, fontWeight: 700 }}>
            {filtered.length}
          </strong>
          건
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {BOARD_SORTS.map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setSort(o.v)}
              style={{
                background: "transparent",
                border: "none",
                padding: "4px 0",
                color: sort === o.v ? palette.ink : palette.muted,
                fontSize: 12,
                fontWeight: sort === o.v ? 700 : 500,
                cursor: "pointer",
                fontFamily: '"Noto Sans KR", system-ui',
                letterSpacing: "-0.01em",
                borderBottom:
                  sort === o.v
                    ? `2px solid ${palette.ink}`
                    : "2px solid transparent",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* 피드 */}
      <section style={{ padding: "12px 20px 30px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((p) => (
            <article
              key={p.id}
              style={{
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 10,
                padding: "14px 14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CmAvatar
                  init={p.avatar}
                  name={p.author}
                  palette={palette}
                  size={28}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: palette.ink,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {p.author}
                    <span
                      style={{
                        fontSize: 10.5,
                        color: palette.muted,
                        fontWeight: 500,
                        marginLeft: 5,
                      }}
                    >
                      · {p.church}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: palette.muted,
                      marginTop: 1,
                      fontFamily: "Inter, system-ui",
                    }}
                  >
                    {p.date}
                  </div>
                </div>
                <CmCatChip cat={p.cat} palette={palette} />
              </div>

              <div style={{ marginTop: 4 }}>
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontFamily: '"Noto Sans KR", system-ui',
                    fontSize: 14.5,
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
                  {p.title}
                </h3>
                <div
                  style={{
                    fontSize: 12,
                    color: palette.muted,
                    lineHeight: 1.55,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {p.excerpt}
                </div>
              </div>

              {p.image && (
                <div
                  style={{
                    height: 110,
                    borderRadius: 6,
                    overflow: "hidden",
                    background: palette.bg,
                    border: `1px solid ${palette.line}`,
                  }}
                >
                  <FeedCover kind={p.image} palette={palette} />
                </div>
              )}

              <div
                style={{
                  paddingTop: 10,
                  borderTop: `1px solid ${palette.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: palette.muted,
                  fontFamily: "Inter, system-ui",
                }}
              >
                {p.kind === "prayer" ? (
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
                    기도 {p.prayerCount}
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M6 10 C6 10 1.5 7 1.5 4 a2.5 2.5 0 0 1 4.5 -1.5 a2.5 2.5 0 0 1 4.5 1.5 C10.5 7 6 10 6 10 Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        fill="none"
                      />
                    </svg>
                    {p.likes}
                  </span>
                )}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 3 H10 V8.5 H6.5 L4 11 V8.5 H2 Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  댓글 {p.comments}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <ellipse
                      cx="6"
                      cy="6"
                      rx="5"
                      ry="3.2"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <circle cx="6" cy="6" r="1.4" fill="currentColor" />
                  </svg>
                  {p.views.toLocaleString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAB */}
      <button
        type="button"
        style={{
          position: "fixed",
          bottom: 110,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 999,
          background: palette.ink,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 30,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            d="M10 2 V18 M2 10 H18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <BottomTabBar />
    </div>
  );
}
