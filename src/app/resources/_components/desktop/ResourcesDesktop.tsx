"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import {
  type ResourcesSort,
  type ResourcesView,
} from "@/lib/resources-data";
import type { ResourceFile, ResourceCategory, ResourceTopItem } from "@/lib/resources-data";
import { sortResourceFiles } from "@/lib/resource";
import ResourcesHeader from "./ResourcesHeader";
import CollectionsSection from "./CollectionsSection";
import FilterStrip from "./FilterStrip";
import FileGrid from "./FileGrid";
import FileList from "./FileList";
import ResourcesSidebar from "./ResourcesSidebar";
import ResourcesFooter from "./ResourcesFooter";

const palette = FOREST_PALETTE;

/**
 * 자료공유 데스크톱 — 디자인 원본 library.jsx 의 LibraryDesktop 그대로.
 * 글로벌 DesktopNav(solid)는 page 단에서 노출. 여기선 본문만.
 */
type Props = { files: ResourceFile[]; categories: ResourceCategory[]; top: ResourceTopItem[] };

export default function ResourcesDesktop({ files, categories, top }: Props) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);
  const [view, setView] = useState<ResourcesView>("grid");
  const [sort, setSort] = useState<ResourcesSort>("recent");

  const filtered =
    activeCat === 0 ? files : files.filter((f) => f.cat === categories[activeCat].ko);
  const sorted = sortResourceFiles(filtered, sort);

  return (
    <div
      style={{
        background: palette.bg,
        minHeight: "100%",
        color: palette.ink,
      }}
    >
      <ResourcesHeader palette={palette} />
      <CollectionsSection palette={palette} />

      <FilterStrip
        palette={palette}
        categories={categories}
        activeCat={activeCat}
        setActiveCat={setActiveCat}
        sort={sort}
        setSort={setSort}
        view={view}
        setView={setView}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: palette.muted,
                fontFamily: '"Noto Sans KR", system-ui',
              }}
            >
              총{" "}
              <strong style={{ color: palette.ink, fontWeight: 700 }}>
                {filtered.length}
              </strong>
              건
            </div>
          </div>

          {view === "grid" ? (
            <FileGrid
              files={sorted}
              palette={palette}
              onOpen={(id) => router.push(`/resources/${id}`)}
            />
          ) : (
            <FileList
              files={sorted}
              palette={palette}
              onOpen={(id) => router.push(`/resources/${id}`)}
            />
          )}
        </main>

        <ResourcesSidebar palette={palette} top={top} onUpload={() => router.push("/admin/resources/new")} />
      </div>

      <ResourcesFooter palette={palette} />
    </div>
  );
}
