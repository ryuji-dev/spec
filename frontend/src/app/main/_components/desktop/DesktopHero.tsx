"use client";

import { useEffect, useState } from "react";
import { HERO_SLIDES } from "@/lib/main-page-data";
import { HERO_SLIDE_COMPONENTS } from "../HeroSlides";
import styles from "./DesktopHero.module.css";

const SLIDE_INTERVAL_MS = 5500;

/**
 * 데스크톱 히어로 — 자동 슬라이드(5.5초) + 켄번스 + 점 수동 전환.
 * 디자인 원본 `_design/.../desktop.jsx:4-22` 동작 그대로.
 */
export default function DesktopHero() {
  const [idx, setIdx] = useState(0);
  const total = HERO_SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [total]);

  return (
    <section className={styles.hero}>
      {HERO_SLIDE_COMPONENTS.map((Component, i) => (
        <div key={i} className={styles.slide} data-active={i === idx ? "true" : "false"}>
          <Component />
        </div>
      ))}
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.kicker}>EDUCATION · COMMUNITY · FAITH</div>
          <h1 className={styles.title}>
            가르치는 자의
            <br />
            <em>거룩한 부르심</em>
          </h1>
          <p className={styles.lead}>
            다음 세대를 세우는 교사들의 자리. 서경노회 교육위원회가 함께합니다.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn}>수련회 신청 →</button>
            <button type="button" className={styles.ghostBtn}>공지사항 보기</button>
          </div>
        </div>
      </div>

      <div className={styles.indicator}>
        <div className={styles.dots}>
          {HERO_SLIDES.map((_, i) => (
            <span
              key={i}
              className={styles.dot}
              data-active={i === idx ? "true" : "false"}
              role="button"
              tabIndex={0}
              aria-label={`슬라이드 ${i + 1}로 이동`}
              onClick={() => setIdx(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIdx(i);
                }
              }}
            />
          ))}
        </div>
        <div className={styles.counter}>
          {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
}
