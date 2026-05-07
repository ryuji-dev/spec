"use client";

import { useState } from "react";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import { TR_BOARD, TR_CATEGORIES } from "@/lib/training-data";
import HeroSection from "./HeroSection";
import UpcomingHero from "./UpcomingHero";
import ScheduleSection from "./ScheduleSection";
import SpeakersSection from "./SpeakersSection";
import NextSection from "./NextSection";
import PastBento from "./PastBento";
import FilterBar from "./FilterBar";
import PostCard from "./PostCard";
import PostListRow from "./PostListRow";
import Pagination from "./Pagination";
import { SideRegister, SideArchive, SideContact } from "./Sidebar";
import TrainingFooter from "./TrainingFooter";
import SectionEyebrow from "../shared/SectionEyebrow";

const palette = FOREST_PALETTE;

export default function TrainingDesktop() {
  const [activeCat, setActiveCat] = useState(0);
  const filtered =
    activeCat === 0
      ? TR_BOARD
      : TR_BOARD.filter((p) => p.cat === TR_CATEGORIES[activeCat].ko);

  return (
    <div
      style={{
        background: palette.bg,
        minHeight: "100%",
        color: palette.ink,
      }}
    >
      <HeroSection palette={palette} />
      <UpcomingHero palette={palette} />
      <ScheduleSection palette={palette} />
      <SpeakersSection palette={palette} />
      <NextSection palette={palette} />
      <PastBento palette={palette} />

      <section style={{ padding: "80px 80px 0" }}>
        <SectionEyebrow
          palette={palette}
          en="BOARD · 자료실"
          ko="후기, 자료, 묻고 답하기"
          desc="지난 수련회의 강의안과 영상, 참여하신 분들의 후기, 그리고 다가올 수련회에 대한 질문을 한 곳에서."
        />
      </section>

      <FilterBar
        palette={palette}
        active={activeCat}
        setActive={setActiveCat}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 56,
          padding: "40px 80px 80px",
        }}
      >
        <main>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
            }}
          >
            {filtered.slice(0, 2).map((p) => (
              <PostCard key={p.id} post={p} palette={palette} />
            ))}
          </div>
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
              <PostListRow key={p.id} post={p} palette={palette} />
            ))}
          </div>
          <Pagination palette={palette} />
        </main>

        <aside style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <SideRegister palette={palette} />
          <SideArchive palette={palette} />
          <SideContact palette={palette} />
        </aside>
      </div>

      <TrainingFooter palette={palette} />
    </div>
  );
}
