"use client";

import { useState } from "react";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import {
  CM_CATEGORIES,
  CM_FEED,
  type BoardSort,
} from "@/lib/board-data";
import BoardHeader from "./BoardHeader";
import HotSection from "./HotSection";
import CategoryStickyBar from "./CategoryStickyBar";
import Composer from "./Composer";
import FeedCard from "./FeedCard";
import BoardPagination from "./BoardPagination";
import {
  SideMembers,
  SideTags,
  SideGuide,
  SideCategories,
} from "./Sidebar";
import BoardFooter from "./BoardFooter";

const palette = FOREST_PALETTE;

/**
 * 자유게시판 데스크톱 — 디자인 원본 community.jsx 의 CommunityDesktop 그대로.
 * 글로벌 DesktopNav(solid)는 페이지 단에서 노출. 여기선 본문만.
 */
export default function BoardDesktop() {
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
        minHeight: "100%",
        color: palette.ink,
      }}
    >
      <BoardHeader palette={palette} />
      <HotSection palette={palette} />

      <CategoryStickyBar
        palette={palette}
        activeCat={activeCat}
        setActiveCat={setActiveCat}
        sort={sort}
        setSort={setSort}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 56,
          padding: "36px 80px 80px",
        }}
      >
        <main>
          <Composer palette={palette} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((p) => (
              <FeedCard key={p.id} post={p} palette={palette} />
            ))}
          </div>
          <BoardPagination palette={palette} />
        </main>

        <aside style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <SideMembers palette={palette} />
          <SideTags palette={palette} />
          <SideGuide palette={palette} />
          <SideCategories palette={palette} />
        </aside>
      </div>

      <BoardFooter palette={palette} />
    </div>
  );
}
