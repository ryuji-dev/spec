"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import type { TrainingPost, TrainingCategory } from "@/lib/training-data";
import type { TrainingEventsData } from "@/server/services/training";
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

type Props = {
  posts: TrainingPost[];
  categories: TrainingCategory[];
  events: TrainingEventsData;
};

export default function TrainingDesktop({ posts, categories, events }: Props) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);
  const filtered =
    activeCat === 0
      ? posts
      : posts.filter((p) => p.cat === categories[activeCat].ko);

  return (
    <div
      style={{
        background: palette.bg,
        minHeight: "100%",
        color: palette.ink,
      }}
    >
      <HeroSection />
      <UpcomingHero palette={palette} featured={events.featured} speakers={events.speakers} />
      <ScheduleSection palette={palette} schedule={events.schedule} />
      <SpeakersSection palette={palette} speakers={events.speakers} />
      <NextSection palette={palette} next={events.next} />
      <PastBento palette={palette} past={events.past} />

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
        categories={categories}
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
              <PostCard
                key={p.id}
                post={p}
                palette={palette}
                onOpen={() => router.push(`/training/${p.id}`)}
              />
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
              <PostListRow
                key={p.id}
                post={p}
                palette={palette}
                onOpen={() => router.push(`/training/${p.id}`)}
              />
            ))}
          </div>
          <Pagination palette={palette} />
        </main>

        <aside style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <SideRegister palette={palette} featured={events.featured} />
          <SideArchive palette={palette} archive={events.archive} />
          <SideContact palette={palette} />
        </aside>
      </div>

      <TrainingFooter palette={palette} />
    </div>
  );
}
