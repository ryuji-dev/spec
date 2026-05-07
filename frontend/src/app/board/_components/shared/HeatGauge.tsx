type Props = {
  heat: number;
};

/**
 * HOT 게이지 — 불꽃 아이콘 + 수치.
 * 디자인 원본 community.jsx 의 HeatGauge 그대로.
 */
export default function HeatGauge({ heat }: Props) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "Inter, system-ui",
      }}
    >
      <svg width="11" height="13" viewBox="0 0 12 14" fill="none">
        <path
          d="M6 1 C8 4 10 6 10 9 a4 4 0 0 1 -8 0 C2 7 3.5 6 4.5 4 C5 5 5.5 5.5 6 5 C6 3.5 5.5 2.5 6 1 Z"
          fill="#C75B3F"
        />
      </svg>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#C75B3F",
          letterSpacing: "0.02em",
        }}
      >
        HOT {heat}
      </span>
    </div>
  );
}
