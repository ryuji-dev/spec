import { HERO_SLIDE_COMPONENTS } from "../HeroSlides";
import { HERO_SLIDES } from "@/lib/main-page-data";
import styles from "./HeroMobile.module.css";

/**
 * 모바일 히어로 — Phase 1: 첫 슬라이드 정지. 자동 루프/켄번스는 Phase 2.
 */
export default function HeroMobile() {
  const idx = 0;
  const total = HERO_SLIDES.length;

  return (
    <section className={styles.hero}>
      {HERO_SLIDE_COMPONENTS.map((Component, i) => (
        <div key={i} className={styles.slide} data-active={i === idx ? "true" : "false"}>
          <Component />
        </div>
      ))}

      <div className={styles.overlay} />
      <div className={styles.grain} />

      <div className={styles.content}>
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>
            <svg width="11" height="18" viewBox="0 0 12 20" fill="none">
              <rect x="5" y="0" width="2" height="20" fill="#fff" />
              <rect x="0" y="5" width="12" height="2" fill="#fff" />
            </svg>
          </div>
          <div className={styles.brandText}>
            <div className={styles.brandKo}>서경노회 교육위원회 웹진</div>
            <div className={styles.brandEn}>Seogyeong Presbytery Education Committee</div>
          </div>
        </div>

        <div className={styles.welcome}>
          <div className={styles.kicker}>EDUCATION · COMMUNITY · FAITH</div>
          <h1 className={styles.title}>
            가르치는 자의
            <br />
            <em className={styles.titleEm}>거룩한 부르심</em>
          </h1>
          <p className={styles.lead}>
            다음 세대를 세우는 교사들의 자리.
            <br />
            서경노회 교육위원회가 함께합니다.
          </p>

          <div className={styles.indicatorRow}>
            <div className={styles.dots}>
              {HERO_SLIDES.map((_, i) => (
                <span key={i} className={styles.dot} data-active={i === idx ? "true" : "false"} />
              ))}
            </div>
            <div className={styles.caption}>
              {HERO_SLIDES[idx].date} · {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
