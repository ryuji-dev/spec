import type { Palette } from "@/app/_components/shared/palette";
import { CM_HOT } from "@/lib/board-data";
import HotThreadCard from "./HotThreadCard";

type Props = { palette: Palette };

/**
 * HOT 스레드 섹션 — 큰 카드 2열.
 * 디자인 원본 community.jsx CommunityDesktop 의 HOT 섹션.
 */
export default function HotSection({ palette }: Props) {
  return (
    <section style={{ padding: "48px 80px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.24em",
              color: "#C75B3F",
              fontWeight: 700,
              fontFamily: "Inter, system-ui",
              marginBottom: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="11" height="13" viewBox="0 0 12 14" fill="none">
              <path
                d="M6 1 C8 4 10 6 10 9 a4 4 0 0 1 -8 0 C2 7 3.5 6 4.5 4 C5 5 5.5 5.5 6 5 C6 3.5 5.5 2.5 6 1 Z"
                fill="#C75B3F"
              />
            </svg>
            HOT THREADS · 실시간 활발
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
            지금 함께 이야기하는 중
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
          전체 토론 보기
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
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        {CM_HOT.map((p) => (
          <HotThreadCard key={p.id} post={p} palette={palette} />
        ))}
      </div>
    </section>
  );
}
