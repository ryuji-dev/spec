import type { Palette } from "@/app/_components/shared/palette";
import { type ResourceFileType, type ResourceTopItem } from "@/lib/resources-data";
import { fileTone } from "../fileTone";
import DownloadStat from "../shared/DownloadStat";

type Props = { palette: Palette; top: ResourceTopItem[]; onUpload?: () => void };

const FILE_TYPE_LEGEND: ReadonlyArray<ResourceFileType> = [
  "ppt",
  "pdf",
  "score",
  "doc",
  "video",
  "image",
];

/**
 * 자료공유 데스크톱 사이드바 — TOP DOWNLOADS / 업로드 가이드 / 파일타입 범례.
 * 디자인 원본 library.jsx 의 aside 영역 그대로.
 */
export default function ResourcesSidebar({ palette, top, onUpload }: Props) {
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <section>
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: "0.24em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
            marginBottom: 14,
          }}
        >
          TOP DOWNLOADS · 이번 달
        </div>
        <div
          style={{
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: 4,
            padding: "6px 18px",
          }}
        >
          {top.map((t, i) => {
            const ft = fileTone(t.type, palette);
            return (
              <div
                key={t.rank}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 0",
                  borderBottom:
                    i < top.length - 1
                      ? `1px solid ${palette.line}`
                      : "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Noto Serif KR", serif',
                    fontSize: 22,
                    fontWeight: 500,
                    color: i < 3 ? palette.primary : palette.muted,
                    letterSpacing: "-0.02em",
                    minWidth: 22,
                  }}
                >
                  {t.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: palette.ink,
                      lineHeight: 1.4,
                      letterSpacing: "-0.02em",
                      fontFamily: '"Noto Sans KR", system-ui',
                      marginBottom: 4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {t.title}
                  </div>
                  <DownloadStat count={t.downloads} palette={palette} size={10.5} />
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: ft.color,
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  {ft.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        style={{
          background: palette.ink,
          color: "#F5F1E8",
          padding: 28,
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.24em",
            opacity: 0.55,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
            marginBottom: 12,
          }}
        >
          UPLOAD GUIDELINE
        </div>
        <h4
          style={{
            margin: 0,
            marginBottom: 12,
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.35,
          }}
        >
          당신의 자료가
          <br />
          다음 사역의 출발이 됩니다
        </h4>
        <p
          style={{
            margin: 0,
            marginBottom: 18,
            fontSize: 12,
            lineHeight: 1.7,
            opacity: 0.7,
            fontFamily: '"Noto Sans KR", system-ui',
          }}
        >
          설교 PPT, 악보, 공과 — 형식과 분류만 맞춰 올려주시면 편집부에서 검수
          후 공유합니다.
        </p>
        <button
          type="button"
          onClick={onUpload}
          style={{
            background: "#F5F1E8",
            color: palette.ink,
            border: "none",
            padding: "10px 16px",
            borderRadius: 2,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: '"Noto Sans KR", system-ui',
            letterSpacing: "-0.01em",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 11 V4 M3 6.5 L6 3.5 L9 6.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="2"
              y1="1"
              x2="10"
              y2="1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          자료 업로드
        </button>
      </section>

      <section>
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: "0.24em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
            marginBottom: 14,
          }}
        >
          FILE TYPES
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FILE_TYPE_LEGEND.map((t) => {
            const ft = fileTone(t, palette);
            return (
              <div
                key={t}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: ft.soft,
                  padding: "6px 11px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  color: ft.color,
                  letterSpacing: "0.04em",
                  fontFamily: "Inter, system-ui",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: ft.color,
                  }}
                />
                {ft.label}
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
