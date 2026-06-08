import type { Palette } from "@/app/_components/shared/palette";

type Props = { palette: Palette };

const FOOTER_GROUPS = [
  { t: "게시판", items: ["공지사항", "회의록", "수련회", "자료실", "나눔"] },
  { t: "교육위원회", items: ["위원회 소개", "연혁", "조직도", "연락처"] },
  { t: "신학원", items: ["신학원 안내", "웹진", "교수진", "입학 문의"] },
];

export default function CommitteeFooter({ palette }: Props) {
  return (
    <footer
      style={{
        marginTop: 40,
        background: palette.ink,
        color: "#F5F1E8",
        padding: "56px 80px 36px",
        fontFamily: '"Noto Sans KR", system-ui',
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 40,
          paddingBottom: 36,
          borderBottom: "1px solid rgba(245,241,232,0.18)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: '"Noto Serif KR", serif',
              fontSize: 22,
              marginBottom: 14,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
            }}
          >
            함께 가르치고
            <br />
            함께 자라는 자리.
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.7, opacity: 0.6 }}>
            대한예수교장로회 서경노회 교육위원회
            <br />
            서울특별시 서대문구 충정로 00-00 · 02-000-0000
            <br />
            edu@seogyeong.or.kr
          </div>
        </div>
        {FOOTER_GROUPS.map((g) => (
          <div key={g.t}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.24em",
                opacity: 0.7,
                fontWeight: 600,
                fontFamily: "Inter, system-ui",
                marginBottom: 14,
              }}
            >
              {g.t.toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.items.map((i) => (
                <div key={i} style={{ fontSize: 12.5, opacity: 0.85, cursor: "pointer" }}>
                  {i}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          letterSpacing: "0.18em",
          opacity: 0.4,
          fontFamily: "Inter, system-ui",
        }}
      >
        <span>© 2026 SEOGYEONG · ALL RIGHTS RESERVED</span>
        <span>PRIVACY · TERMS · COOKIES</span>
      </div>
    </footer>
  );
}
