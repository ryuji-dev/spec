"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
import CatLabel from "@/app/_components/shared/CatLabel";
import { PageHeroMobile } from "@/app/_components/PageHero";
import BottomTabBar from "@/app/main/_components/mobile/BottomTabBar";
import type {
  TrainingPost,
  TrainingCategory,
} from "@/lib/training-data";
import type { TrainingEventsData } from "@/server/services/training";
import CoverArt from "../shared/CoverArt";
import { catTone } from "../catTone";

const palette = FOREST_PALETTE;

type Props = {
  posts: TrainingPost[];
  categories: TrainingCategory[];
  events: TrainingEventsData;
};

export default function TrainingMobile({ posts, categories, events }: Props) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);
  const filtered =
    activeCat === 0
      ? posts
      : posts.filter((p) => p.cat === categories[activeCat].ko);
  const u = events.featured;
  const pct = u && u.capacity > 0 ? Math.round((u.registered / u.capacity) * 100) : 0;

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: palette.bg,
          paddingBottom: 80,
        }}
      >
        {/* 모바일 헤더 */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            padding: "20px 22px 18px",
            background: palette.surface,
            borderBottom: `1px solid ${palette.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
              }}
              aria-label="뒤로"
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
              교역자수련회
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              aria-label="검색"
              style={{
                background: "none",
                border: "none",
                padding: 6,
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <circle
                  cx="8"
                  cy="8"
                  r="5.5"
                  stroke={palette.ink}
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M12 12 L16 16"
                  stroke={palette.ink}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="더보기"
              style={{
                background: "none",
                border: "none",
                padding: 6,
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <circle cx="9" cy="3" r="1.5" fill={palette.ink} />
                <circle cx="9" cy="9" r="1.5" fill={palette.ink} />
                <circle cx="9" cy="15" r="1.5" fill={palette.ink} />
              </svg>
            </button>
          </div>
        </header>

        <PageHeroMobile
          kicker="EDUCATION · TRAINING"
          title={
            <>
              잠시 멈추어,
              <br />
              <em>다시 듣다</em>
            </>
          }
          rightAccent={"EST. 1998 · 47회째"}
        />

        {/* 카운트다운 + 신청 카드 */}
        {u && (
        <div style={{ padding: "8px 22px 0" }}>
          <article
            style={{
              background: palette.ink,
              color: "#F5F1E8",
              borderRadius: 16,
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    background: palette.accent,
                    color: palette.ink,
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "4px 8px",
                    borderRadius: 2,
                    letterSpacing: "0.1em",
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  NOW OPEN · {u.cat}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "Inter, system-ui",
                    opacity: 0.55,
                    letterSpacing: "0.16em",
                  }}
                >
                  NO. 47
                </span>
              </div>
              <h2
                style={{
                  margin: "4px 0 4px",
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25,
                }}
              >
                {u.title}
              </h2>
              <div
                style={{
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 14,
                  fontStyle: "italic",
                  fontWeight: 300,
                  color: palette.accent,
                  letterSpacing: "-0.01em",
                  marginBottom: 16,
                }}
              >
                “{u.subtitle}”
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  fontFamily: '"Noto Serif KR", serif',
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                    lineHeight: 0.95,
                    color: palette.accent,
                  }}
                >
                  D-{u.daysLeft}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    opacity: 0.55,
                    marginLeft: 8,
                    fontFamily: "Inter, system-ui",
                    letterSpacing: "0.04em",
                  }}
                >
                  {u.dates}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  { l: "PLACE", v: u.place },
                  { l: "FEE", v: u.fee },
                ].map((m) => (
                  <div
                    key={m.l}
                    style={{
                      padding: "10px 12px",
                      background: "rgba(245,241,232,0.06)",
                      border: "1px solid rgba(245,241,232,0.12)",
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8.5,
                        letterSpacing: "0.18em",
                        fontFamily: "Inter, system-ui",
                        fontWeight: 600,
                        opacity: 0.55,
                        marginBottom: 3,
                      }}
                    >
                      {m.l}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: '"Noto Sans KR", system-ui',
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {m.v}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10.5,
                    fontFamily: "Inter, system-ui",
                    letterSpacing: "0.04em",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ opacity: 0.65 }}>
                    {u.registered} / {u.capacity}명
                  </span>
                  <span
                    style={{ color: palette.accent, fontWeight: 600 }}
                  >
                    {pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "rgba(245,241,232,0.15)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: palette.accent,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                style={{
                  width: "100%",
                  background: palette.accent,
                  color: palette.ink,
                  border: "none",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: '"Noto Sans KR", system-ui',
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                지금 신청하기
                <svg width="11" height="11" viewBox="0 0 12 12">
                  <path
                    d="M3 6 H10 M7 3 L10 6 L7 9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </article>
        </div>
        )}

        {/* 강사진 (가로 스크롤) */}
        <div style={{ padding: "24px 0 0" }}>
          <div style={{ padding: "0 22px", marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.24em",
                color: palette.secondary,
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
                marginBottom: 4,
              }}
            >
              SPEAKERS
            </div>
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              이번 봄, 함께하실 분들
            </div>
          </div>
          <div
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: 10,
                padding: "0 22px",
              }}
            >
              {events.speakers.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    display: "inline-block",
                    width: 200,
                    whiteSpace: "normal",
                    background: i === 0 ? palette.primary : palette.surface,
                    color: i === 0 ? "#F5F1E8" : palette.ink,
                    border:
                      i === 0 ? "none" : `1px solid ${palette.line}`,
                    borderRadius: 12,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: i === 0 ? palette.accent : palette.bg,
                      color: i === 0 ? palette.ink : palette.primary,
                      fontFamily: '"Noto Serif KR", serif',
                      fontSize: 18,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    {s.init}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Noto Serif KR", serif',
                      fontSize: 17,
                      fontWeight: 500,
                      letterSpacing: "-0.02em",
                      marginBottom: 2,
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: i === 0 ? 0.6 : 0.55,
                      fontFamily: '"Noto Sans KR", system-ui',
                      marginBottom: 10,
                    }}
                  >
                    {s.affiliation}
                  </div>
                  <div
                    style={{
                      paddingTop: 10,
                      borderTop:
                        i === 0
                          ? "1px solid rgba(245,241,232,0.18)"
                          : `1px solid ${palette.line}`,
                      fontSize: 11.5,
                      fontWeight: 500,
                      fontFamily: '"Noto Sans KR", system-ui',
                      letterSpacing: "-0.01em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{s.role}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: i === 0 ? palette.accent : palette.primary,
                        fontFamily: "Inter, system-ui",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s.talks} TALKS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 일정 — DAY1만 펼침 */}
        <div style={{ padding: "24px 22px 0" }}>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.24em",
                color: palette.secondary,
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
                marginBottom: 4,
              }}
            >
              SCHEDULE
            </div>
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              3일의 흐름
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.schedule.map((d, i) => (
              <div
                key={d.day}
                style={{
                  background: palette.surface,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    paddingBottom: i === 0 ? 10 : 0,
                    marginBottom: i === 0 ? 10 : 0,
                    borderBottom:
                      i === 0 ? `1px solid ${palette.line}` : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        color: palette.secondary,
                        fontWeight: 600,
                        fontFamily: "Inter, system-ui",
                      }}
                    >
                      {d.day}
                    </span>
                    <span
                      style={{
                        fontFamily: '"Noto Serif KR", serif',
                        fontSize: 15,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {d.date}
                    </span>
                  </div>
                  {i !== 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        color: palette.muted,
                        fontFamily: '"Noto Sans KR", system-ui',
                      }}
                    >
                      {d.items.length}개 일정
                    </span>
                  )}
                </div>
                {i === 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {d.items.map((it, k) => (
                      <div
                        key={k}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "46px 1fr",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "Inter, system-ui",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: it.highlight
                              ? palette.primary
                              : palette.muted,
                          }}
                        >
                          {it.time}
                        </div>
                        <div
                          style={{
                            paddingLeft: 10,
                            borderLeft: `2px solid ${it.highlight ? palette.accent : palette.line}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: it.highlight ? 700 : 500,
                              color: palette.ink,
                              fontFamily: '"Noto Sans KR", system-ui',
                              letterSpacing: "-0.02em",
                              marginBottom: 2,
                            }}
                          >
                            {it.what}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: palette.muted,
                              fontFamily: '"Noto Sans KR", system-ui',
                            }}
                          >
                            {it.tag} · {it.place}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리 핀 (가로 스크롤) */}
        <div
          style={{
            padding: "24px 0 12px",
            overflowX: "auto",
            overflowY: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{ display: "inline-flex", gap: 6, padding: "0 22px" }}
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

        {/* 게시글 카드 (첫 1개) + 리스트 */}
        <div style={{ padding: "0 22px" }}>
          {filtered.slice(0, 1).map((p) => (
            <article
              key={p.id}
              onClick={() => router.push(`/training/${p.id}`)}
              style={{
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 12,
                padding: "18px 18px 16px",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <CatLabel
                  label={p.cat}
                  tone={catTone(p.cat, palette)}
                />
                {p.isNew && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      background: palette.accent,
                      color: palette.ink,
                      borderRadius: 2,
                      fontFamily: "Inter, system-ui",
                      letterSpacing: "0.12em",
                    }}
                  >
                    NEW
                  </span>
                )}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: '"Noto Sans KR", system-ui',
                  fontSize: 15.5,
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.4,
                  color: palette.ink,
                  marginBottom: 8,
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: palette.muted,
                  fontWeight: 300,
                  fontFamily: '"Noto Sans KR", system-ui',
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {p.excerpt}
              </p>
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: `1px solid ${palette.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 10.5,
                  color: palette.muted,
                  fontFamily: '"Noto Sans KR", system-ui',
                }}
              >
                <span>{p.author.split(" ").slice(0, 2).join(" ")}</span>
                <span
                  style={{
                    fontFamily: "Inter, system-ui",
                    letterSpacing: "0.02em",
                  }}
                >
                  {p.date} · {p.views.toLocaleString()} views
                </span>
              </div>
            </article>
          ))}
        </div>

        <div style={{ padding: "6px 22px 0" }}>
          {filtered.slice(1).map((p) => (
            <article
              key={p.id}
              onClick={() => router.push(`/training/${p.id}`)}
              style={{
                padding: "14px 0",
                borderBottom: `1px solid ${palette.line}`,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <CatLabel
                  label={p.cat}
                  tone={catTone(p.cat, palette)}
                />
                <span
                  style={{
                    fontSize: 10.5,
                    color: palette.muted,
                    fontFamily: "Inter, system-ui",
                    letterSpacing: "0.02em",
                  }}
                >
                  {p.date}
                </span>
                {p.isNew && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 5px",
                      background: palette.accent,
                      color: palette.ink,
                      borderRadius: 2,
                      fontFamily: "Inter, system-ui",
                    }}
                  >
                    N
                  </span>
                )}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: '"Noto Sans KR", system-ui',
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.4,
                  color: palette.ink,
                  marginBottom: 4,
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
                  fontSize: 10.5,
                  color: palette.muted,
                  fontFamily: '"Noto Sans KR", system-ui',
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{p.author.split(" ").slice(0, 2).join(" ")}</span>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 999,
                    background: palette.muted,
                  }}
                />
                <span style={{ fontFamily: "Inter, system-ui" }}>
                  조회 {p.views.toLocaleString()} · 댓글 {p.comments}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* 지난 수련회 가로 스크롤 */}
        <div style={{ padding: "24px 0 0" }}>
          <div style={{ padding: "0 22px", marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.24em",
                color: palette.secondary,
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
                marginBottom: 4,
              }}
            >
              ARCHIVE
            </div>
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              지난 수련회
            </div>
          </div>
          <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
            <div
              style={{ display: "inline-flex", gap: 10, padding: "0 22px" }}
            >
              {events.past.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "inline-block",
                    width: 200,
                    height: 240,
                    position: "relative",
                    borderRadius: 12,
                    overflow: "hidden",
                    whiteSpace: "normal",
                    background: palette.ink,
                  }}
                >
                  <div style={{ position: "absolute", inset: 0 }}>
                    <CoverArt kind={p.cover} palette={palette} />
                  </div>
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#F5F1E8",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(245,241,232,0.18)",
                        border: "1px solid rgba(245,241,232,0.25)",
                        backdropFilter: "blur(8px)",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "3px 7px",
                        borderRadius: 2,
                        letterSpacing: "0.12em",
                        fontFamily: "Inter, system-ui",
                        alignSelf: "flex-start",
                      }}
                    >
                      {p.season}
                    </span>
                    <div>
                      <div
                        style={{
                          fontFamily: '"Noto Serif KR", serif',
                          fontSize: 16,
                          fontWeight: 500,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.25,
                          marginBottom: 4,
                        }}
                      >
                        {p.title}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          opacity: 0.8,
                          fontFamily: "Inter, system-ui",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {p.participants} 참석 · {p.date}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 모바일 푸터 */}
        <div
          style={{
            marginTop: 32,
            padding: "24px 22px 32px",
            background: palette.ink,
            color: "#F5F1E8",
            fontFamily: '"Noto Sans KR", system-ui',
          }}
        >
          <div
            style={{
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 16,
              lineHeight: 1.4,
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            잠시 멈추어, 다시 듣는 자리.
          </div>
          <div
            style={{ fontSize: 10.5, opacity: 0.6, lineHeight: 1.7 }}
          >
            서경노회 교육위원회 · 02-000-0000
            <br />
            training@seogyeong.or.kr
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 9.5,
              opacity: 0.4,
              fontFamily: "Inter, system-ui",
              letterSpacing: "0.16em",
            }}
          >
            © 2026 SEOGYEONG
          </div>
        </div>
      </div>
      <BottomTabBar />
    </>
  );
}
