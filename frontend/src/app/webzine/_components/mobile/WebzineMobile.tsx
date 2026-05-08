"use client";

import { useState } from "react";
import { PageHeroMobile } from "@/app/_components/PageHero";
import {
  WZ_ARTICLES,
  WZ_BACK_ISSUES,
  WZ_CATEGORIES,
  WZ_FEATURED,
  type WebzinePalette,
} from "@/lib/webzine-data";
import CoverArt from "../illustrations/CoverArt";
import CoverWilderness from "../illustrations/CoverWilderness";

type Props = {
  palette: WebzinePalette;
  deviceType: "ios" | "android";
};

export default function WebzineMobile({ palette }: Props) {
  const [cat, setCat] = useState("전체");

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        position: "relative",
        background: palette.bg,
        paddingBottom: 80,
      }}
    >
      <PageHeroMobile
        kicker="SEOGYEONG · WEBZINE"
        title="신학원웹진"
        lead="서경신학원과 노회의 글들을 한자리에. 신학의 사색과 현장의 목소리."
        rightAccent={
          <>
            <div style={{ fontSize: 13, fontFamily: '"Noto Serif KR", serif', fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 6 }}>
              {WZ_FEATURED.issue}
            </div>
            <div style={{ fontSize: 9, letterSpacing: "0.16em", opacity: 0.7 }}>EST. 2014</div>
          </>
        }
      />

      {/* 카테고리 가로 스크롤 */}
      <div
        style={{
          padding: "14px 0",
          background: palette.bg,
          borderBottom: `1px solid ${palette.line}`,
          overflowX: "auto",
          whiteSpace: "nowrap",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ display: "inline-flex", gap: 6, padding: "0 22px" }}>
          {["전체", ...WZ_CATEGORIES.map((c) => c.ko)].map((c, i) => {
            const active = cat === c;
            return (
              <button
                key={i}
                onClick={() => setCat(c)}
                style={{
                  background: active ? palette.ink : "transparent",
                  color: active ? palette.surface : palette.ink,
                  border: `1px solid ${active ? palette.ink : palette.line}`,
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontFamily: '"Noto Sans KR"',
                  fontWeight: active ? 600 : 500,
                  letterSpacing: "-0.02em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* 커버 피처 */}
      <div style={{ padding: "24px 22px 32px" }}>
        <div
          style={{
            height: 240,
            overflow: "hidden",
            borderRadius: 8,
            marginBottom: 18,
            position: "relative",
          }}
        >
          <CoverWilderness palette={palette} />
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: "rgba(255,255,255,0.95)",
              padding: "4px 10px",
              borderRadius: 1,
              fontSize: 9,
              letterSpacing: "0.18em",
              color: palette.ink,
              fontFamily: "Inter",
              fontWeight: 600,
            }}
          >
            {WZ_FEATURED.category}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter",
            marginBottom: 8,
          }}
        >
          이번 호 커버 에세이
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 26,
            fontWeight: 500,
            color: palette.ink,
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
            whiteSpace: "pre-line",
            textWrap: "balance",
          }}
        >
          {WZ_FEATURED.title}
        </h2>
        <p
          style={{
            marginTop: 12,
            marginBottom: 0,
            fontSize: 13,
            color: palette.muted,
            fontFamily: '"Noto Sans KR"',
            lineHeight: 1.7,
            fontWeight: 300,
            textWrap: "pretty",
          }}
        >
          {WZ_FEATURED.subtitle}
        </p>
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${palette.line}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: palette.primary,
              color: palette.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            김
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: '"Noto Sans KR"',
                fontSize: 12.5,
                fontWeight: 600,
                color: palette.ink,
                letterSpacing: "-0.02em",
              }}
            >
              {WZ_FEATURED.author}
            </div>
            <div
              style={{
                fontSize: 10,
                color: palette.muted,
                marginTop: 1,
                fontFamily: '"Noto Sans KR"',
              }}
            >
              {WZ_FEATURED.date} · {WZ_FEATURED.read}
            </div>
          </div>
          <button
            style={{
              background: palette.ink,
              color: palette.surface,
              border: "none",
              padding: "8px 14px",
              borderRadius: 2,
              fontSize: 11.5,
              fontFamily: '"Noto Sans KR"',
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            읽기 →
          </button>
        </div>
      </div>

      {/* 글 리스트 */}
      <div
        style={{
          padding: "24px 22px 0",
          borderTop: `1px solid ${palette.line}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: "0.24em",
                color: palette.secondary,
                fontWeight: 600,
                fontFamily: "Inter",
                marginBottom: 6,
              }}
            >
              LATEST
            </div>
            <h3
              style={{
                margin: 0,
                fontFamily: '"Noto Serif KR", serif',
                fontSize: 22,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: "-0.02em",
              }}
            >
              이번 호의 글
            </h3>
          </div>
          <span
            style={{
              fontSize: 11,
              color: palette.muted,
              fontFamily: "Inter",
              letterSpacing: "0.04em",
            }}
          >
            {WZ_ARTICLES.length} ARTICLES
          </span>
        </div>

        {/* 첫 글 — 큰 카드 */}
        <article style={{ marginBottom: 24 }}>
          <div
            style={{
              height: 180,
              overflow: "hidden",
              borderRadius: 6,
              marginBottom: 14,
              position: "relative",
            }}
          >
            <CoverArt type={WZ_ARTICLES[0].cover} palette={palette} />
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "rgba(255,255,255,0.95)",
                padding: "3px 8px",
                borderRadius: 1,
                fontSize: 9,
                letterSpacing: "0.14em",
                color: palette.ink,
                fontFamily: "Inter",
                fontWeight: 600,
              }}
            >
              {WZ_ARTICLES[0].tag}
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: palette.secondary,
              fontWeight: 600,
              fontFamily: "Inter",
              marginBottom: 8,
            }}
          >
            {WZ_ARTICLES[0].cat}
          </div>
          <h4
            style={{
              margin: 0,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 19,
              fontWeight: 500,
              color: palette.ink,
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              textWrap: "balance",
            }}
          >
            {WZ_ARTICLES[0].title}
          </h4>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              fontSize: 12.5,
              color: palette.muted,
              fontFamily: '"Noto Sans KR"',
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            {WZ_ARTICLES[0].excerpt}
          </p>
          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: palette.muted,
              fontFamily: '"Noto Sans KR"',
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 500, color: palette.ink }}>{WZ_ARTICLES[0].author}</span>
            <span style={{ fontFamily: "Inter" }}>2026.{WZ_ARTICLES[0].date} · {WZ_ARTICLES[0].read}</span>
          </div>
        </article>

        {/* 나머지 — 가로 리스트 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: `1px solid ${palette.line}`,
          }}
        >
          {WZ_ARTICLES.slice(1).map((a) => (
            <article
              key={a.id}
              style={{
                padding: "18px 0",
                borderBottom: `1px solid ${palette.line}`,
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRadius: 4,
                }}
              >
                <CoverArt type={a.cover} palette={palette} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.16em",
                    color: palette.secondary,
                    fontWeight: 600,
                    fontFamily: "Inter",
                    marginBottom: 5,
                  }}
                >
                  {a.cat}
                </div>
                <h4
                  style={{
                    margin: 0,
                    fontFamily: '"Noto Sans KR"',
                    fontSize: 14,
                    fontWeight: 600,
                    color: palette.ink,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.35,
                    textWrap: "balance",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {a.title}
                </h4>
                <p
                  style={{
                    marginTop: 6,
                    marginBottom: 0,
                    fontSize: 11.5,
                    color: palette.muted,
                    fontFamily: '"Noto Sans KR"',
                    lineHeight: 1.55,
                    fontWeight: 300,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {a.excerpt}
                </p>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 10,
                    color: palette.muted,
                    fontFamily: '"Noto Sans KR"',
                  }}
                >
                  <span style={{ color: palette.ink, fontWeight: 500 }}>{a.author}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ fontFamily: "Inter" }}>2026.{a.date}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ fontFamily: "Inter" }}>{a.read}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          style={{
            width: "100%",
            marginTop: 20,
            background: "transparent",
            border: `1px solid ${palette.ink}`,
            color: palette.ink,
            padding: "14px",
            borderRadius: 2,
            fontSize: 12.5,
            fontFamily: '"Noto Sans KR"',
            fontWeight: 500,
            letterSpacing: "-0.01em",
            cursor: "pointer",
          }}
        >
          지난 글 더 보기 →
        </button>
      </div>

      {/* 지난 호 */}
      <div style={{ padding: "40px 22px 24px" }}>
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: "0.24em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter",
            marginBottom: 6,
          }}
        >
          ARCHIVE
        </div>
        <h3
          style={{
            margin: 0,
            marginBottom: 18,
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 22,
            fontWeight: 500,
            color: palette.ink,
            letterSpacing: "-0.02em",
          }}
        >
          지난 호 다시 읽기
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {WZ_BACK_ISSUES.slice(0, 4).map((b, i) => (
            <div
              key={i}
              style={{
                padding: "16px 14px",
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  color: palette.secondary,
                  fontWeight: 600,
                  fontFamily: "Inter",
                }}
              >
                {b.vol}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: palette.ink,
                  fontFamily: '"Noto Sans KR"',
                  letterSpacing: "-0.02em",
                }}
              >
                {b.issue}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: '"Noto Serif KR", serif',
                  fontSize: 13,
                  color: palette.primary,
                  lineHeight: 1.35,
                  letterSpacing: "-0.02em",
                }}
              >
                {b.theme}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
