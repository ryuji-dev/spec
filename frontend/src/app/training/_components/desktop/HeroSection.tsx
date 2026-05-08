import { PageHeroDesktop } from "@/app/_components/PageHero";

export default function HeroSection() {
  return (
    <PageHeroDesktop
      kicker="EDUCATION COMMITTEE · TRAINING"
      title={
        <>
          교역자 수련회
          <br />
          <em style={{ fontSize: 44 }}>잠시 멈추어, 다시 듣다</em>
        </>
      }
      rightAccent={
        <div style={{ maxWidth: 320, textAlign: "right" }}>
          <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 12, opacity: 0.85, letterSpacing: "-0.01em" }}>
            서경노회는 매년 봄·가을 두 차례, 사역의 자리에서 잠시 떨어져
            다시 말씀 앞에 서는 시간을 마련합니다.
          </div>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", fontWeight: 600 }}>
            EST. 1998 · 47회째
          </div>
        </div>
      }
    />
  );
}
