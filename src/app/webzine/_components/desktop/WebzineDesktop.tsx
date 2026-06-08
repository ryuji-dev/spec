"use client";

import { useRouter } from "next/navigation";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import {
  WZ_BACK_ISSUES,
  type WebzinePalette,
  type WebzineFeatured,
  type WebzineArticle,
  type WebzineCategory,
} from "@/lib/webzine-data";
import { CURRENT_ISSUE } from "@/lib/webzine";
import CoverArt from "../illustrations/CoverArt";
import CoverWilderness from "../illustrations/CoverWilderness";

type Props = {
  palette: WebzinePalette;
  featured: WebzineFeatured | null;
  articles: WebzineArticle[];
  categories: WebzineCategory[];
};

export default function WebzineDesktop({ palette, featured, articles, categories }: Props) {
  const router = useRouter();
  return (
    <div style={{ background: palette.bg, minHeight: "100%" }}>
      <PageHeroDesktop
        kicker="SEOGYEONG · WEBZINE"
        title="신학원웹진"
        lead="서경신학원과 노회의 글들을 한자리에 모읍니다. 신학의 사색, 현장의 목소리, 그리고 가르침의 자리에서 길어 올린 작은 이야기들."
        rightAccent={
          <>
            <div style={{ fontSize: 10, letterSpacing: "0.24em", marginBottom: 8, opacity: 0.85 }}>
              CURRENT ISSUE
            </div>
            <div
              style={{
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 22,
                letterSpacing: "-0.02em",
                fontWeight: 500,
              }}
            >
              {featured?.issue ?? CURRENT_ISSUE}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, letterSpacing: "0.1em", opacity: 0.7 }}>
              EST. 2014 · 봄·여름·가을·겨울 · 연 4회
            </div>
          </>
        }
      />

      {/* 카테고리 nav */}
      <div
        style={{
          padding: "20px 80px",
          background: palette.bg,
          borderBottom: `1px solid ${palette.line}`,
          display: "flex",
          alignItems: "center",
          gap: 32,
          fontFamily: '"Noto Sans KR"',
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.24em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter",
          }}
        >
          CATEGORY
        </span>
        <div style={{ display: "flex", gap: 24, flex: 1 }}>
          <a style={{ fontSize: 13, color: palette.ink, fontWeight: 600, letterSpacing: "-0.02em", cursor: "pointer" }}>전체</a>
          {categories.map((c) => (
            <a
              key={c.en}
              style={{
                fontSize: 13,
                color: palette.muted,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                cursor: "pointer",
                display: "flex",
                alignItems: "baseline",
                gap: 4,
              }}
            >
              {c.ko}
              <span style={{ fontSize: 9, color: palette.secondary, fontFamily: "Inter" }}>{c.count}</span>
            </a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: palette.muted }}>
          <span>최신순</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ opacity: 0.6 }}>인기순</span>
        </div>
      </div>

      {/* 커버 피처 */}
      {featured && (
        <div style={{ padding: "64px 80px 48px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 1fr",
              gap: 56,
              alignItems: "stretch",
            }}
          >
            <div style={{ height: 520, overflow: "hidden" }}>
              <CoverWilderness palette={palette} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.28em",
                  color: palette.secondary,
                  fontWeight: 600,
                  fontFamily: "Inter",
                  marginBottom: 16,
                }}
              >
                {featured.category} · 이번 호 커버 에세이
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 52,
                  fontWeight: 500,
                  color: palette.ink,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15,
                  whiteSpace: "pre-line",
                }}
              >
                {featured.title}
              </h2>
              <p
                style={{
                  marginTop: 24,
                  fontSize: 16,
                  color: palette.muted,
                  fontFamily: '"Noto Sans KR"',
                  lineHeight: 1.7,
                  fontWeight: 300,
                  maxWidth: 480,
                }}
              >
                {featured.subtitle}
              </p>
              <div
                style={{
                  marginTop: 36,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  paddingTop: 24,
                  borderTop: `1px solid ${palette.line}`,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: palette.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: palette.surface,
                    fontFamily: '"Noto Serif KR", serif',
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  {featured.author.slice(0, 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: '"Noto Sans KR"',
                      fontSize: 14,
                      fontWeight: 600,
                      color: palette.ink,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {featured.author}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.muted,
                      marginTop: 2,
                      fontFamily: '"Noto Sans KR"',
                    }}
                  >
                    {featured.authorRole} · {featured.date} · {featured.read} 읽기
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/webzine/${featured.id}`)}
                  style={{
                    background: palette.ink,
                    color: palette.surface,
                    border: "none",
                    padding: "12px 22px",
                    borderRadius: 2,
                    fontSize: 12.5,
                    fontFamily: '"Noto Sans KR"',
                    fontWeight: 500,
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                  }}
                >
                  전문 읽기 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 글 목록 — 매거진 그리드 */}
      <div
        style={{
          padding: "40px 80px 80px",
          borderTop: `1px solid ${palette.line}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.28em",
                color: palette.secondary,
                fontWeight: 600,
                fontFamily: "Inter",
                marginBottom: 10,
              }}
            >
              LATEST · ARTICLES
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 36,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: "-0.02em",
              }}
            >
              이번 호의 글들
            </h2>
          </div>
          <div style={{ fontSize: 13, color: palette.muted, fontFamily: '"Noto Sans KR"' }}>
            총 <span style={{ color: palette.primary, fontWeight: 600 }}>{articles.length}</span>편 ·
            <span style={{ marginLeft: 6, fontFamily: "Inter" }}>2026.04 업데이트</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
          {articles.map((a) => (
            <article
              key={a.id}
              onClick={() => router.push(`/webzine/${a.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div
                style={{
                  height: 220,
                  overflow: "hidden",
                  background: palette.surface,
                  marginBottom: 20,
                  position: "relative",
                }}
              >
                <CoverArt type={a.cover} palette={palette} />
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    background: "rgba(255,255,255,0.95)",
                    padding: "4px 10px",
                    borderRadius: 1,
                    fontSize: 9.5,
                    letterSpacing: "0.16em",
                    color: palette.ink,
                    fontFamily: "Inter",
                    fontWeight: 600,
                  }}
                >
                  {a.tag}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  color: palette.secondary,
                  fontWeight: 600,
                  fontFamily: "Inter",
                  marginBottom: 10,
                }}
              >
                {a.cat.toUpperCase()} · {a.cat}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 22,
                  fontWeight: 500,
                  color: palette.ink,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  textWrap: "balance",
                }}
              >
                {a.title}
              </h3>
              <p
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  fontSize: 13.5,
                  color: palette.muted,
                  fontFamily: '"Noto Sans KR"',
                  lineHeight: 1.65,
                  fontWeight: 300,
                  textWrap: "pretty",
                }}
              >
                {a.excerpt}
              </p>
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: `1px solid ${palette.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  color: palette.muted,
                  fontFamily: '"Noto Sans KR"',
                }}
              >
                <span style={{ fontWeight: 500, color: palette.ink }}>{a.author}</span>
                <span style={{ fontFamily: "Inter", letterSpacing: "0.04em" }}>{a.date} · {a.read}</span>
              </div>
            </article>
          ))}
        </div>

        {/* 더보기 */}
        <div
          style={{
            marginTop: 64,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ height: 1, flex: 1, maxWidth: 200, background: palette.line }} />
          <button
            style={{
              background: "transparent",
              border: `1px solid ${palette.ink}`,
              color: palette.ink,
              padding: "14px 36px",
              borderRadius: 2,
              fontSize: 13,
              fontFamily: '"Noto Sans KR"',
              fontWeight: 500,
              letterSpacing: "-0.01em",
              cursor: "pointer",
            }}
          >
            지난 글 더 보기 →
          </button>
          <div style={{ height: 1, flex: 1, maxWidth: 200, background: palette.line }} />
        </div>
      </div>

      {/* 지난 호 아카이브 */}
      <div
        style={{
          padding: "72px 80px",
          background: palette.surface,
          borderTop: `1px solid ${palette.line}`,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 56 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.28em",
                color: palette.secondary,
                fontWeight: 600,
                fontFamily: "Inter",
                marginBottom: 12,
              }}
            >
              ARCHIVE
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 36,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              지난 호
              <br />
              <em style={{ fontStyle: "italic", fontWeight: 300 }}>다시 읽기.</em>
            </h2>
            <p
              style={{
                marginTop: 18,
                fontSize: 13.5,
                color: palette.muted,
                fontFamily: '"Noto Sans KR"',
                lineHeight: 1.7,
                fontWeight: 300,
              }}
            >
              2014년 창간 이후 발행된 23개의 호. 그동안의 글들을 분기별로 모아두었습니다.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {WZ_BACK_ISSUES.map((b, i) => (
              <div
                key={i}
                style={{
                  padding: "24px 26px",
                  background: palette.bg,
                  border: `1px solid ${palette.line}`,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 28,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      color: palette.secondary,
                      fontWeight: 600,
                      fontFamily: "Inter",
                    }}
                  >
                    {b.vol}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: '"Noto Sans KR"',
                      fontSize: 14.5,
                      fontWeight: 600,
                      color: palette.ink,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {b.issue}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: '"Noto Serif KR", serif',
                      fontSize: 17,
                      color: palette.primary,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.35,
                      marginBottom: 14,
                    }}
                  >
                    {b.theme}
                  </div>
                  <div
                    style={{
                      paddingTop: 12,
                      borderTop: `1px solid ${palette.line}`,
                      fontSize: 11,
                      color: palette.muted,
                      fontFamily: "Inter",
                      letterSpacing: "0.06em",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{b.date}</span>
                    <span>VIEW →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
