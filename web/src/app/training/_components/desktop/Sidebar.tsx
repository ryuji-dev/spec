import type { Palette } from "@/app/_components/shared/palette";
import { TR_UPCOMING, TR_ARCHIVE } from "@/lib/training-data";

type Props = { palette: Palette };

export function SideRegister({ palette }: Props) {
  const u = TR_UPCOMING;
  const pct = Math.round((u.registered / u.capacity) * 100);
  return (
    <div
      style={{
        background: palette.primary,
        color: "#F5F1E8",
        borderRadius: 14,
        padding: "24px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: 999,
          background: `radial-gradient(circle, ${palette.accent}33 0%, transparent 65%)`,
        }}
      />
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: "0.24em",
            fontFamily: "Inter, system-ui",
            fontWeight: 600,
            opacity: 0.7,
            marginBottom: 10,
          }}
        >
          QUICK REGISTER
        </div>
        <div
          style={{
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            marginBottom: 14,
          }}
        >
          봄 수련회 신청
          <br />
          <em
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              color: palette.accent,
            }}
          >
            D-{u.daysLeft}
          </em>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                opacity: 0.7,
                fontFamily: "Inter, system-ui",
                letterSpacing: "0.06em",
              }}
            >
              {u.registered} / {u.capacity}
            </span>
            <span
              style={{
                fontSize: 10.5,
                color: palette.accent,
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
              }}
            >
              {pct}%
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: "rgba(245,241,232,0.18)",
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
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: '"Noto Sans KR", system-ui',
            cursor: "pointer",
          }}
        >
          지금 신청하기
        </button>
        <div
          style={{
            marginTop: 10,
            fontSize: 10.5,
            opacity: 0.55,
            lineHeight: 1.5,
            fontFamily: '"Noto Sans KR", system-ui',
          }}
        >
          마감: {u.deadline} 자정 · 회비 {u.fee}
        </div>
      </div>
    </div>
  );
}

export function SideArchive({ palette }: Props) {
  return (
    <div>
      <div
        style={{
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: `2px solid ${palette.ink}`,
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: "0.24em",
            color: palette.secondary,
            fontWeight: 600,
            fontFamily: "Inter, system-ui",
          }}
        >
          ARCHIVE
        </div>
        <div
          style={{
            fontFamily: '"Noto Serif KR", serif',
            fontSize: 19,
            fontWeight: 500,
            marginTop: 4,
            letterSpacing: "-0.02em",
          }}
        >
          회차 아카이브
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {TR_ARCHIVE.map((g) => (
          <div key={g.y}>
            <div
              style={{
                fontFamily: "Inter, system-ui",
                fontSize: 11,
                fontWeight: 600,
                color: palette.primary,
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              {g.y}
            </div>
            {g.items.map((it) => (
              <div
                key={it}
                style={{
                  fontSize: 12.5,
                  color: palette.ink,
                  fontFamily: '"Noto Sans KR", system-ui',
                  letterSpacing: "-0.01em",
                  padding: "6px 0",
                  borderBottom: `1px dashed ${palette.line}`,
                  cursor: "pointer",
                }}
              >
                {it}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SideContact({ palette }: Props) {
  return (
    <div
      style={{
        padding: "20px 18px",
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 14,
      }}
    >
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
        CONTACT
      </div>
      <div
        style={{
          fontFamily: '"Noto Serif KR", serif',
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          marginBottom: 14,
        }}
      >
        수련회 문의
      </div>
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.7,
          color: palette.ink,
          fontWeight: 500,
          fontFamily: '"Noto Sans KR", system-ui',
          letterSpacing: "-0.01em",
        }}
      >
        총무 박혜진 전도사
        <br />
        <span style={{ color: palette.muted, fontWeight: 400 }}>
          02-000-0000 (내선 12)
        </span>
        <br />
        <span
          style={{
            color: palette.primary,
            fontFamily: "Inter, system-ui",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          training@seogyeong.or.kr
        </span>
      </div>
    </div>
  );
}
