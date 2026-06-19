"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Post, PostCategory, PopularPost, SideAuthor } from "@/lib/committee-data";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import PinnedCard from "./PinnedCard";
import PostCard from "./PostCard";
import PostListRow from "./PostListRow";
import PostTableRow from "./PostTableRow";
import Pagination from "./Pagination";
import Sidebar from "./Sidebar";
import CommitteeFooter from "./CommitteeFooter";

type ViewMode = "mixed" | "list";

/**
 * 교육위원회 게시판 데스크톱 본문.
 * 디자인 원본 board.jsx BoardDesktop. 카테고리 필터·뷰 토글·검색을 인터랙션으로 가짐.
 * 글로벌 DesktopNav(solid)을 함께 사용 — sticky 필터바는 nav 높이만큼 top offset.
 */
type Props = {
  pinned: Post | null;
  posts: Post[];
  categories: PostCategory[];
  popular: PopularPost[];
  authors: SideAuthor[];
};

export default function CommitteeDesktop({ pinned, posts, categories, popular, authors }: Props) {
  const router = useRouter();
  const palette = FOREST_PALETTE;
  const [activeCat, setActiveCat] = useState(0);
  const [view, setView] = useState<ViewMode>("mixed");

  const filtered =
    activeCat === 0
      ? posts
      : posts.filter((p) => p.cat === categories[activeCat].ko);

  return (
    <div style={{ background: palette.bg, minHeight: "100vh", color: palette.ink }}>
      <PageHeroDesktop
        kicker="EDUCATION COMMITTEE · BOARD"
        title={
          <>
            교육위원회
            <br />
            <em style={{ fontSize: 44 }}>나누고, 기록하고, 함께</em>
          </>
        }
      />

      {/* 스탯 + 새 글 작성 — hero 아래 별도 행 */}
      <div
        style={{
          padding: "24px 80px",
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
          fontFamily: '"Noto Sans KR", system-ui',
        }}
      >
        <div style={{ fontSize: 13, color: palette.muted, lineHeight: 1.6 }}>
          이번 달 새 글{" "}
          <strong style={{ color: palette.primary, fontWeight: 700 }}>
            {posts.filter((p) => p.isNew).length + 1}
          </strong>
          건 · 총 게시글{" "}
          <strong style={{ color: palette.ink, fontWeight: 700 }}>142</strong>건 ·
          작성자 <strong style={{ color: palette.ink, fontWeight: 700 }}>38</strong>명
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/committee/new")}
          style={{
            background: palette.ink,
            color: "#fff",
            border: "none",
            padding: "11px 22px",
            borderRadius: 2,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "-0.01em",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12">
            <path d="M6 1 V11 M1 6 H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          새 글 작성
        </button>
      </div>

      {/* 필터 바 — sticky. 글로벌 nav(solid, sticky) 아래에 위치하도록 top offset. */}
      <div
        style={{
          position: "sticky",
          top: 80,
          zIndex: 20,
          background: "rgba(251,248,241,0.92)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderBottom: `1px solid ${palette.line}`,
          padding: "14px 80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((c, i) => {
            const active = activeCat === i;
            return (
              <button
                key={c.en}
                type="button"
                onClick={() => setActiveCat(i)}
                style={{
                  background: active ? palette.ink : "transparent",
                  color: active ? "#fff" : palette.ink,
                  border: `1px solid ${active ? palette.ink : palette.line}`,
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 500,
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.18s ease",
                }}
              >
                {c.ko}
                <span
                  style={{
                    fontSize: 10.5,
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 검색 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              padding: "8px 12px",
              borderRadius: 999,
              width: 240,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" style={{ color: palette.muted }}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <path d="M9.5 9.5 L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              placeholder="제목, 본문, 작성자 검색"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 12.5,
                fontFamily: '"Noto Sans KR", system-ui',
                color: palette.ink,
                flex: 1,
                letterSpacing: "-0.01em",
              }}
            />
            <kbd
              style={{
                fontSize: 9.5,
                color: palette.muted,
                fontFamily: "Inter, system-ui",
                background: palette.bg,
                padding: "2px 6px",
                borderRadius: 3,
                border: `1px solid ${palette.line}`,
              }}
            >
              ⌘K
            </kbd>
          </div>
          {/* 뷰 토글 */}
          <div
            style={{
              display: "inline-flex",
              border: `1px solid ${palette.line}`,
              borderRadius: 4,
              overflow: "hidden",
              background: palette.surface,
            }}
          >
            {[
              { v: "mixed" as const, label: "카드" },
              { v: "list" as const, label: "리스트" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setView(o.v)}
                style={{
                  background: view === o.v ? palette.ink : "transparent",
                  color: view === o.v ? "#fff" : palette.muted,
                  border: "none",
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.01em",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 본문 — 2컬럼 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 56,
          padding: "40px 80px 80px",
        }}
      >
        <main>
          {/* 핀 게시물 */}
          {pinned && (
            <PinnedCard
              post={pinned}
              palette={palette}
              onOpen={() => router.push(`/committee/${pinned.id}`)}
            />
          )}

          {view === "mixed" && (
            <>
              {/* 상단 카드 — 2개 (최근 핵심) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                  marginTop: 32,
                }}
              >
                {filtered.slice(0, 2).map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    palette={palette}
                    onOpen={() => router.push(`/committee/${p.id}`)}
                  />
                ))}
              </div>

              {/* 리스트 — 나머지 */}
              <div style={{ marginTop: 32 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    paddingBottom: 14,
                    borderBottom: `2px solid ${palette.ink}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"Noto Sans KR", system-ui',
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    전체 글
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.muted,
                      fontFamily: "Inter, system-ui",
                      letterSpacing: "0.04em",
                    }}
                  >
                    SORT · 최신순 ↓
                  </div>
                </div>
                {filtered.slice(2).map((p) => (
                  <PostListRow
                    key={p.id}
                    post={p}
                    palette={palette}
                    onOpen={() => router.push(`/committee/${p.id}`)}
                  />
                ))}
              </div>
            </>
          )}

          {view === "list" && (
            <div style={{ marginTop: 28 }}>
              {/* 테이블 헤더 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 100px 1fr 180px 100px 90px",
                  padding: "12px 16px",
                  borderTop: `2px solid ${palette.ink}`,
                  borderBottom: `1px solid ${palette.line}`,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "Inter, system-ui",
                  letterSpacing: "0.12em",
                  color: palette.muted,
                }}
              >
                <div>NO.</div>
                <div>CATEGORY</div>
                <div>TITLE</div>
                <div>AUTHOR</div>
                <div>DATE</div>
                <div style={{ textAlign: "right" }}>VIEWS</div>
              </div>
              {filtered.map((p, i) => (
                <PostTableRow
                  key={p.id}
                  post={p}
                  palette={palette}
                  index={filtered.length - i}
                  onOpen={() => router.push(`/committee/${p.id}`)}
                />
              ))}
            </div>
          )}

          <Pagination palette={palette} />
        </main>

        <Sidebar palette={palette} popular={popular} authors={authors} />
      </div>

      <CommitteeFooter palette={palette} />
    </div>
  );
}
