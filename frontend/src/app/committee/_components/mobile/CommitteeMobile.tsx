"use client";

import { useState } from "react";
import {
  BD_CATEGORIES,
  BD_PINNED,
  BD_POPULAR,
  BD_POSTS,
  BD_TAGS,
} from "@/lib/committee-data";
import BottomTabBar from "@/app/main/_components/mobile/BottomTabBar";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import PostCardMobile from "./PostCardMobile";
import PostListMobile from "./PostListMobile";

/**
 * 교육위원회 게시판 모바일 본문.
 * 디자인 원본 board.jsx BoardMobile.
 * 자체 sticky 헤더 + 가로 스크롤 카테고리 핀 + 카드/리스트 혼합.
 */
export default function CommitteeMobile() {
  const palette = FOREST_PALETTE;
  const [activeCat, setActiveCat] = useState(0);

  const filtered =
    activeCat === 0
      ? BD_POSTS
      : BD_POSTS.filter((p) => p.cat === BD_CATEGORIES[activeCat].ko);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.bg,
        paddingBottom: 80,
        position: "relative",
      }}
    >
      {/* 모바일 상단 헤더 */}
      <header
        style={{
          padding: "20px 22px 18px",
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}
            aria-label="뒤로 가기"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                d="M11 3 L5 9 L11 15"
                stroke={palette.ink}
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            style={{
              fontFamily: '"Noto Sans KR", system-ui',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            교육위원회
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            style={{ background: "none", border: "none", padding: 6, cursor: "pointer" }}
            aria-label="검색"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <circle cx="8" cy="8" r="5.5" stroke={palette.ink} strokeWidth="1.5" fill="none" />
              <path d="M12 12 L16 16" stroke={palette.ink} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            style={{ background: "none", border: "none", padding: 6, cursor: "pointer" }}
            aria-label="더 보기"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <circle cx="9" cy="3" r="1.5" fill={palette.ink} />
              <circle cx="9" cy="9" r="1.5" fill={palette.ink} />
              <circle cx="9" cy="15" r="1.5" fill={palette.ink} />
            </svg>
          </button>
        </div>
      </header>

      {/* 페이지 타이틀 */}
      <div style={{ padding: "28px 22px 16px" }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.28em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
            marginBottom: 8,
          }}
        >
          EDUCATION · BOARD
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif',
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1.18,
          }}
        >
          나누고, 기록하고,
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 300, color: palette.primary }}>함께</em>
        </h1>
        <div
          style={{
            marginTop: 14,
            fontSize: 11.5,
            color: palette.muted,
            fontFamily: '"Noto Sans KR", system-ui',
          }}
        >
          총 142건 · 이번 달 새 글 4건
        </div>
      </div>

      {/* 카테고리 핀 — 가로 스크롤 */}
      <div
        style={{
          padding: "4px 0 14px",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "inline-flex", gap: 6, padding: "0 22px" }}>
          {BD_CATEGORIES.map((c, i) => {
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
                  padding: "8px 13px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  fontFamily: '"Noto Sans KR", system-ui',
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
                    fontWeight: 500,
                    opacity: active ? 0.8 : 0.55,
                  }}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 핀 카드 (mobile) */}
      <div style={{ padding: "4px 22px 0" }}>
        <article
          style={{
            background: palette.ink,
            color: "#F5F1E8",
            borderRadius: 14,
            padding: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: 999,
              background: `radial-gradient(circle, ${palette.accent}33 0%, transparent 65%)`,
            }}
          />
          <div style={{ position: "relative" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: palette.accent,
                color: palette.ink,
                fontSize: 9,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 2,
                letterSpacing: "0.1em",
                fontFamily: "Inter, system-ui",
              }}
            >
              <span style={{ width: 4, height: 4, borderRadius: 999, background: palette.ink }} />
              PINNED · 공지
            </span>
            <h2
              style={{
                margin: "14px 0 10px",
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 21,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.3,
              }}
            >
              {BD_PINNED.title}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                lineHeight: 1.65,
                opacity: 0.8,
                fontWeight: 300,
                fontFamily: '"Noto Sans KR", system-ui',
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {BD_PINNED.excerpt}
            </p>
            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 10.5,
                opacity: 0.75,
                fontFamily: "Inter, system-ui",
                letterSpacing: "0.02em",
              }}
            >
              <span>{BD_PINNED.author}</span>
              <span>
                {BD_PINNED.date} · {BD_PINNED.views.toLocaleString()} views
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* 게시글 카드 — 첫 글 강조 */}
      <div
        style={{
          padding: "24px 22px 0",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: '"Noto Sans KR", system-ui',
            letterSpacing: "-0.01em",
            paddingBottom: 8,
            borderBottom: `2px solid ${palette.ink}`,
            flex: 1,
          }}
        >
          최근 글
        </div>
        <span
          style={{
            fontSize: 10.5,
            color: palette.muted,
            fontFamily: "Inter, system-ui",
            letterSpacing: "0.02em",
          }}
        >
          최신순 ↓
        </span>
      </div>

      <div
        style={{
          padding: "0 22px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {filtered.slice(0, 1).map((p) => (
          <PostCardMobile key={p.id} post={p} palette={palette} />
        ))}
      </div>

      {/* 리스트 */}
      <div style={{ padding: "8px 22px 32px" }}>
        {filtered.slice(1).map((p) => (
          <PostListMobile key={p.id} post={p} palette={palette} />
        ))}
      </div>

      {/* 사이드 — 인기글 (모바일) */}
      <div style={{ padding: "12px 22px 0" }}>
        <div
          style={{
            padding: "20px 18px",
            background: palette.surface,
            borderRadius: 14,
            border: `1px solid ${palette.line}`,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.24em",
              color: palette.secondary,
              fontWeight: 600,
              fontFamily: "Inter, system-ui",
              marginBottom: 4,
            }}
          >
            POPULAR · 이번 주
          </div>
          <div
            style={{
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 17,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            많이 읽힌 글
          </div>
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {BD_POPULAR.slice(0, 4).map((p, i) => (
              <li
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "24px 1fr",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Noto Serif KR", serif',
                    fontSize: 18,
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
                      fontSize: 12.5,
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
                      fontSize: 10,
                      color: palette.muted,
                      marginTop: 3,
                      fontFamily: "Inter, system-ui",
                    }}
                  >
                    {p.views.toLocaleString()} views
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 태그 모바일 */}
      <div style={{ padding: "20px 22px 0" }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.24em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
            marginBottom: 10,
          }}
        >
          TAGS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {BD_TAGS.map((t, i) => (
            <span
              key={t}
              style={{
                fontSize: 11,
                background: i % 3 === 0 ? palette.ink : palette.surface,
                color: i % 3 === 0 ? "#fff" : palette.ink,
                padding: "5px 10px",
                borderRadius: 999,
                border: i % 3 === 0 ? "none" : `1px solid ${palette.line}`,
                fontFamily: '"Noto Sans KR", system-ui',
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* 글쓰기 FAB */}
      <button
        type="button"
        aria-label="새 글 작성"
        style={{
          position: "fixed",
          bottom: 100,
          right: 18,
          background: palette.ink,
          color: "#fff",
          border: "none",
          width: 52,
          height: 52,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          cursor: "pointer",
          zIndex: 25,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            d="M3 12 L3 15 L6 15 L14 7 L11 4 Z"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M11 4 L14 7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* 바텀 탭바 — 메인 페이지 컴포넌트 재사용 */}
      <BottomTabBar />
    </div>
  );
}
