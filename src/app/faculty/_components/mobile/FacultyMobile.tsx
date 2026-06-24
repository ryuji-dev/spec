"use client";

import { useState } from "react";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import { PageHeroMobile } from "@/app/_components/PageHero";
import {
  type FacultyDept,
  type FacultyCover,
  type FacultyMember,
  type FacultyDeptItem,
  type FacultyQuote,
} from "@/lib/faculty-data";
import type { DeviceType } from "@/lib/device";
import { deptColor } from "../deptTone";
import FacultyPortrait from "../shared/FacultyPortrait";

const palette = FOREST_PALETTE;

type Props = {
  deviceType: DeviceType;
  cover: FacultyCover | null;
  members: FacultyMember[];
  depts: FacultyDeptItem[];
  quotes: FacultyQuote[];
};

const BOTTOM_TABS: ReadonlyArray<{ ko: string; en: string; active: boolean }> = [
  { ko: "홈", en: "HOME", active: false },
  { ko: "웹진", en: "ZINE", active: false },
  { ko: "커뮤니티", en: "BOARD", active: false },
  { ko: "교수", en: "FACULTY", active: true },
  { ko: "메뉴", en: "MORE", active: false },
];

/**
 * 신학원교수소개 모바일 — 디자인 원본 faculty.jsx 의 FacultyMobile 그대로.
 * 모바일 bottom tab 은 디자인 원본이 자체 변형(점 인디케이터 + ko/en 듀얼 라벨)을
 * 사용하므로 글로벌 BottomTabBar 재사용 대신 인라인으로 보존.
 */
export default function FacultyMobile({ deviceType, cover, members, depts, quotes }: Props) {
  const [activeDept, setActiveDept] = useState<FacultyDept>("all");

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
        fontFamily: '"Noto Sans KR", system-ui',
        paddingBottom: 90,
        position: "relative",
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
              SEOGYEONG · FACULTY
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
              신학원교수소개
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
        kicker="FACULTY · 가르치는 자리"
        title={
          <>
            신학원교수소개,
            <br />
            <em>책상의 깊이가 강단의 무게로</em>
          </>
        }
        rightAccent={"전임 14인 · 2026 봄학기"}
      />

      {/* Cover Story 모바일 */}
      {cover && (
      <section style={{ padding: "24px 20px", background: palette.surface }}>
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: -6,
              left: -6,
              right: 18,
              bottom: 18,
              background: palette.accent,
              opacity: 0.25,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "relative",
              aspectRatio: "4/5",
              overflow: "hidden",
              borderRadius: 2,
            }}
          >
            <FacultyPortrait
              tone="forest"
              palette={palette}
              init={cover.init}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              background: palette.ink,
              color: "#F5F1E8",
              padding: "6px 10px",
              fontSize: 8.5,
              letterSpacing: "0.24em",
              fontWeight: 700,
              fontFamily: "Inter, system-ui",
            }}
          >
            커버 스토리 · 2026 봄
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.28em",
              fontWeight: 600,
              color: palette.secondary,
              fontFamily: "Inter, system-ui",
              marginBottom: 8,
            }}
          >
            {cover.en}
          </div>
          <h2
            style={{
              margin: 0,
              marginBottom: 4,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 38,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: palette.ink,
            }}
          >
            {cover.name}
          </h2>
          <div
            style={{
              fontSize: 12.5,
              color: palette.muted,
              marginBottom: 16,
              letterSpacing: "-0.01em",
            }}
          >
            {cover.title} · {cover.yearsKo}
          </div>
          <blockquote
            style={{
              margin: 0,
              padding: "0 0 0 14px",
              borderLeft: `3px solid ${palette.primary}`,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.55,
              letterSpacing: "-0.02em",
              color: palette.ink,
            }}
          >
            “{cover.quote}”
          </blockquote>
        </div>
      </section>
      )}

      {/* 인용 스트립 */}
      <section
        style={{
          background: palette.ink,
          color: "#F5F1E8",
          padding: "24px 0",
        }}
      >
        <div
          style={{
            padding: "0 20px",
            marginBottom: 14,
            fontSize: 9.5,
            letterSpacing: "0.28em",
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
            opacity: 0.55,
          }}
        >
          VOICES · 한 학기의 한 줄
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            overflowX: "auto",
            padding: "0 20px 4px",
            scrollbarWidth: "none",
          }}
        >
          {quotes.map((q) => (
            <div
              key={q.name}
              style={{
                flex: "0 0 240px",
                padding: 16,
                border: `1px solid rgba(245,241,232,0.18)`,
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 36,
                  fontWeight: 500,
                  lineHeight: 1,
                  color: palette.accent,
                  opacity: 0.5,
                  marginBottom: 4,
                }}
              >
                “
              </div>
              <p
                style={{
                  margin: 0,
                  marginBottom: 12,
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  letterSpacing: "-0.02em",
                  fontStyle: "italic",
                }}
              >
                {q.q}
              </p>
              <div style={{ fontSize: 10, opacity: 0.6 }}>— {q.name} 교수</div>
            </div>
          ))}
        </div>
      </section>

      {/* 필터 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(251,248,241,0.94)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderBottom: `1px solid ${palette.line}`,
          padding: "14px 0",
        }}
      >
        <div
          style={{
            padding: "0 20px 8px",
            marginBottom: 4,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.24em",
              fontWeight: 700,
              color: palette.muted,
              fontFamily: "Inter, system-ui",
            }}
          >
            FACULTY DIRECTORY
          </div>
          <div
            style={{
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: palette.ink,
            }}
          >
            {filtered.length}명
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "0 20px 4px",
            scrollbarWidth: "none",
          }}
        >
          {depts.map((d) => {
            const active = activeDept === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDept(d.id)}
                style={{
                  flexShrink: 0,
                  background: active ? palette.ink : "transparent",
                  color: active ? "#fff" : palette.ink,
                  border: `1px solid ${active ? palette.ink : palette.line}`,
                  padding: "7px 13px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {d.ko}
                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: "Inter, system-ui",
                    fontWeight: 500,
                    opacity: active ? 0.8 : 0.5,
                  }}
                >
                  {d.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 교수 카드 — 모바일 */}
      <section
        style={{
          padding: "20px 20px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {filtered.map((p) => {
          const accent = deptColor(p.dept, palette);
          const deptEn = depts.find((d) => d.id === p.dept)?.en ?? "";
          return (
            <article
              key={p.id}
              style={{
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 2,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  aspectRatio: "5/3",
                  position: "relative",
                  background: palette.bg,
                }}
              >
                <FacultyPortrait
                  tone={p.tone}
                  palette={palette}
                  init={p.init}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: "rgba(255,255,255,0.92)",
                    padding: "4px 10px",
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    fontFamily: "Inter, system-ui",
                    color: accent,
                    borderRadius: 999,
                  }}
                >
                  {deptEn}
                </div>
              </div>
              <div
                style={{
                  padding: "18px 20px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.28em",
                      fontWeight: 600,
                      color: palette.muted,
                      fontFamily: "Inter, system-ui",
                      marginBottom: 4,
                    }}
                  >
                    {p.en}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: '"Noto Serif KR", serif',
                      fontSize: 26,
                      fontWeight: 500,
                      color: palette.ink,
                      letterSpacing: "-0.025em",
                      lineHeight: 1.1,
                    }}
                  >
                    {p.name}
                  </h3>
                  <div
                    style={{
                      fontSize: 12,
                      color: palette.muted,
                      marginTop: 4,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.title} · {p.field}
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    paddingLeft: 12,
                    borderLeft: `2px solid ${accent}`,
                    fontFamily: '"Noto Serif KR", serif',
                    fontSize: 13,
                    fontStyle: "italic",
                    fontWeight: 400,
                    lineHeight: 1.55,
                    color: palette.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  “{p.quote}”
                </p>
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
                  <span>
                    {p.years} YRS · {p.papers} WORKS
                  </span>
                  <span>{p.office}</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Bottom tab — 디자인 원본 자체 변형 (점 인디케이터 + ko/en 듀얼 라벨) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: 8,
          paddingBottom: deviceType === "ios" ? 28 : 14,
          background: palette.surface,
          borderTop: `1px solid ${palette.line}`,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {BOTTOM_TABS.map((t) => (
          <div
            key={t.en}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              color: t.active ? palette.primary : palette.muted,
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: t.active ? palette.primary : "transparent",
              }}
            />
            <div
              style={{
                fontSize: 10.5,
                fontWeight: t.active ? 700 : 500,
                letterSpacing: "-0.01em",
              }}
            >
              {t.ko}
            </div>
            <div
              style={{
                fontSize: 7,
                letterSpacing: "0.16em",
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
                opacity: 0.7,
              }}
            >
              {t.en}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
