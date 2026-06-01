"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomTabBar from "@/app/main/_components/mobile/BottomTabBar";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import { PageHeroMobile } from "@/app/_components/PageHero";
import { LB_COLLECTIONS } from "@/lib/resources-data";
import type {
  ResourceFile,
  ResourceCategory,
  ResourceTopItem,
} from "@/lib/resources-data";
import CollectionCover from "../shared/CollectionCover";
import FileIcon from "../shared/FileIcon";
import LbCatLabel from "../shared/LbCatLabel";
import DownloadStat from "../shared/DownloadStat";

type Props = {
  deviceType?: "ios" | "android";
  files: ResourceFile[];
  categories: ResourceCategory[];
  top: ResourceTopItem[];
};

const palette = FOREST_PALETTE;

const STATS = [
  { k: "286", l: "전체" },
  { k: "24", l: "신규" },
  { k: "12.4K", l: "다운로드" },
];

/**
 * 자료공유 모바일 — 디자인 원본 library.jsx 의 LibraryMobile 그대로.
 * 디바이스별 상단 패딩만 deviceType prop 으로 분기.
 */
export default function ResourcesMobile({
  deviceType = "ios",
  files,
  categories,
}: Props) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);

  const filtered =
    activeCat === 0
      ? files
      : files.filter((f) => f.cat === categories[activeCat].ko);

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
              SEOGYEONG · LIBRARY
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
              자료실
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
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke={palette.ink}
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M13 13 L17 17"
              stroke={palette.ink}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <PageHeroMobile
        kicker="RESOURCE LIBRARY"
        title={
          <>
            자료를 함께,
            <br />
            <em>사역의 무게를 나누다</em>
          </>
        }
      />

      {/* 통계 + 검색 — hero 아래 별도 섹션 */}
      <section
        style={{
          padding: "20px 20px 22px",
          background: palette.surface,
          borderBottom: `1px solid ${palette.line}`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 0,
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            borderRadius: 4,
            padding: "14px 16px",
          }}
        >
          {STATS.map((s, i) => (
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
                  fontSize: 19,
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
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            padding: "11px 14px",
            borderRadius: 999,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" style={{ color: palette.muted }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
            <path d="M9.5 9.5 L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 12, color: palette.muted, letterSpacing: "-0.01em", flex: 1 }}>
            설교 본문, 곡명, 학년 검색
          </span>
        </div>
      </section>

      {/* 컬렉션 — horizontal scroll */}
      <section style={{ padding: "24px 0 12px" }}>
        <div
          style={{
            padding: "0 20px",
            marginBottom: 14,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
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
                marginBottom: 6,
              }}
            >
              FEATURED
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 19,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: "-0.02em",
              }}
            >
              큐레이션 묶음
            </h2>
          </div>
          <a
            style={{
              color: palette.primary,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
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
          {LB_COLLECTIONS.map((c) => (
            <div
              key={c.id}
              style={{
                flex: "0 0 240px",
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div style={{ height: 110, position: "relative" }}>
                <CollectionCover kind={c.cover} palette={palette} />
                {c.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "#fff",
                      color: palette.ink,
                      padding: "3px 7px",
                      borderRadius: 2,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      fontFamily: "Inter, system-ui",
                    }}
                  >
                    {c.badge}
                  </div>
                )}
              </div>
              <div style={{ padding: "14px 16px 16px" }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: palette.ink,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.35,
                    marginBottom: 4,
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: palette.muted,
                    lineHeight: 1.5,
                    marginBottom: 12,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {c.sub}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 10.5,
                    color: palette.muted,
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  <span>{c.items}개 자료</span>
                  <DownloadStat
                    count={c.downloads}
                    palette={palette}
                    size={10.5}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 카테고리 chip */}
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
          {categories.map((c, i) => {
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

      {/* 파일 리스트 */}
      <section style={{ padding: "20px 20px 30px" }}>
        <div style={{ fontSize: 12, color: palette.muted, marginBottom: 14 }}>
          총{" "}
          <strong style={{ color: palette.ink, fontWeight: 700 }}>
            {filtered.length}
          </strong>
          건
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((f) => (
            <article
              key={f.id}
              onClick={() => router.push(`/resources/${f.id}`)}
              style={{
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 10,
                padding: "14px 14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  <FileIcon type={f.type} palette={palette} size={42} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 5,
                    }}
                  >
                    <LbCatLabel cat={f.cat} palette={palette} />
                    {f.isNew && (
                      <span
                        style={{
                          fontSize: 9,
                          color: palette.primary,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          fontFamily: "Inter, system-ui",
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      marginBottom: 4,
                      fontSize: 14,
                      fontWeight: 700,
                      color: palette.ink,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {f.title}
                  </h3>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: palette.muted,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {f.sub}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: `1px solid ${palette.line}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 10.5,
                    color: palette.muted,
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  <span>{f.size}</span>
                  <span>·</span>
                  <span>{f.date}</span>
                  <span>·</span>
                  <DownloadStat
                    count={f.downloads}
                    palette={palette}
                    size={10.5}
                  />
                </div>
                <button
                  type="button"
                  style={{
                    background: palette.ink,
                    color: "#fff",
                    border: "none",
                    padding: "7px 12px",
                    borderRadius: 2,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: '"Noto Sans KR", system-ui',
                    letterSpacing: "-0.01em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 1 V8 M3 5.5 L6 8.5 L9 5.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="2"
                      y1="11"
                      x2="10"
                      y2="11"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  받기
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BottomTabBar />
    </div>
  );
}
