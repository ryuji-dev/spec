import type { Palette } from "@/app/_components/shared/palette";

type Props = { palette: Palette };

// 디자인 원본 app.jsx 의 Footer 그대로.
export default function FacultyFooter({ palette }: Props) {
  return (
    <footer
      style={{
        marginTop: 48,
        background: palette.ink,
        color: "#F5F1E8",
        padding: "36px 24px 28px",
        fontFamily: '"Noto Sans KR", system-ui',
      }}
    >
      <div
        style={{
          fontFamily: '"Noto Serif KR", serif',
          fontSize: 18,
          marginBottom: 18,
          letterSpacing: "-0.02em",
          lineHeight: 1.4,
        }}
      >
        함께 가르치고
        <br />
        함께 자라는 자리.
      </div>
      <div
        style={{
          height: 1,
          background: "rgba(245,241,232,0.18)",
          margin: "20px 0",
        }}
      />
      <div style={{ fontSize: 10.5, lineHeight: 1.7, opacity: 0.65 }}>
        대한예수교장로회 서경노회 교육위원회
        <br />
        서울특별시 서대문구 충정로 00-00 · 02-000-0000
        <br />
        edu@seogyeong.or.kr
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 9,
          letterSpacing: "0.2em",
          opacity: 0.4,
          fontFamily: "Inter, system-ui",
        }}
      >
        © 2026 SEOGYEONG · ALL RIGHTS RESERVED
      </div>
    </footer>
  );
}
