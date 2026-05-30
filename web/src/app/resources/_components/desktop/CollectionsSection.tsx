import type { Palette } from "@/app/_components/shared/palette";
import { LB_COLLECTIONS } from "@/lib/resources-data";
import CollectionCover from "../shared/CollectionCover";
import LbCatLabel from "../shared/LbCatLabel";
import DownloadStat from "../shared/DownloadStat";
import DownloadBtn from "../shared/DownloadBtn";

type Props = { palette: Palette };

/**
 * 큐레이션 컬렉션 섹션 — 3장 그리드(첫 카드만 더 큼).
 * 원본 library.jsx 의 'FEATURED COLLECTIONS' 섹션 그대로.
 */
export default function CollectionsSection({ palette }: Props) {
  return (
    <section style={{ padding: "56px 80px 24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.24em",
              color: palette.secondary,
              fontWeight: 600,
              fontFamily: "Inter, system-ui",
              marginBottom: 8,
            }}
          >
            FEATURED COLLECTIONS
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 28,
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
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: '"Noto Sans KR", system-ui',
            cursor: "pointer",
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          전체 컬렉션 보기
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M3 1l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </a>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          gap: 18,
        }}
      >
        {LB_COLLECTIONS.map((c, i) => (
          <div
            key={c.id}
            style={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 4,
              overflow: "hidden",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: i === 0 ? 220 : 160,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <CollectionCover kind={c.cover} palette={palette} />
              {c.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: "#fff",
                    color: palette.ink,
                    padding: "4px 9px",
                    borderRadius: 2,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    fontFamily: "Inter, system-ui",
                  }}
                >
                  {c.badge}
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  background: "rgba(255,255,255,0.92)",
                  padding: "5px 10px",
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: palette.ink,
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.01em",
                }}
              >
                {c.items}개 자료
              </div>
            </div>
            <div style={{ padding: "18px 20px 20px" }}>
              <div style={{ marginBottom: 8 }}>
                <LbCatLabel cat={c.tag === "교안" ? "교안" : "문서"} palette={palette} />
              </div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: 6,
                  fontFamily: '"Noto Sans KR", system-ui',
                  fontSize: i === 0 ? 19 : 16,
                  fontWeight: 700,
                  color: palette.ink,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.3,
                }}
              >
                {c.title}
              </h3>
              <div
                style={{
                  fontSize: 12.5,
                  color: palette.muted,
                  lineHeight: 1.55,
                  fontFamily: '"Noto Sans KR", system-ui',
                }}
              >
                {c.sub}
              </div>
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: `1px solid ${palette.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <DownloadStat count={c.downloads} palette={palette} />
                <DownloadBtn
                  palette={palette}
                  variant="ghost"
                  size="sm"
                  label="모두 받기"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
