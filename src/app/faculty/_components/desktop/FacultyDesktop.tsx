"use client";

import { useState } from "react";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import type {
  FacultyMember,
  FacultyCover,
  FacultyDeptItem,
  FacultyDept,
  FacultyView,
  FacultyQuote,
  FacultyTimetableItem,
} from "@/lib/faculty-data";
import FeaturedHero from "./FeaturedHero";
import QuoteStrip from "./QuoteStrip";
import FilterStrip from "./FilterStrip";
import FacultyGrid from "./FacultyGrid";
import FacultyList from "./FacultyList";
import ScheduleSection from "./ScheduleSection";
import SeminaryCTA from "./SeminaryCTA";
import FacultyFooter from "./FacultyFooter";

const palette = FOREST_PALETTE;

/**
 * 신학원교수소개 데스크톱 — 디자인 원본 faculty.jsx 의 FacultyDesktop 그대로.
 * 글로벌 DesktopNav(solid)는 page 단에서 노출. 여기선 본문만.
 */
type Props = {
  cover: FacultyCover | null;
  members: FacultyMember[];
  depts: FacultyDeptItem[];
  quotes: FacultyQuote[];
  timetable: FacultyTimetableItem[];
};

export default function FacultyDesktop({ cover, members, depts, quotes, timetable }: Props) {
  const [activeDept, setActiveDept] = useState<FacultyDept>("all");
  const [view, setView] = useState<FacultyView>("grid");

  const filtered =
    activeDept === "all"
      ? members
      : members.filter((p) => p.dept === activeDept);

  return (
    <div
      style={{
        background: palette.bg,
        color: palette.ink,
        minHeight: "100%",
      }}
    >
      <FeaturedHero palette={palette} cover={cover} />
      <QuoteStrip palette={palette} quotes={quotes} />
      <FilterStrip
        palette={palette}
        depts={depts}
        activeDept={activeDept}
        setActiveDept={setActiveDept}
        view={view}
        setView={setView}
        filteredCount={filtered.length}
      />

      <section style={{ padding: "48px 80px 64px" }}>
        {view === "grid" ? (
          <FacultyGrid profs={filtered} palette={palette} />
        ) : (
          <FacultyList profs={filtered} palette={palette} />
        )}
      </section>

      <ScheduleSection palette={palette} timetable={timetable} />
      <SeminaryCTA palette={palette} />
      <FacultyFooter palette={palette} />
    </div>
  );
}
