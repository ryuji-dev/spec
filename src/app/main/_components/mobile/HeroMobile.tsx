"use client";

import { useEffect, useState } from "react";
import type { HeroSlideView } from "@/lib/hero";
import { HERO_SLIDE_COMPONENTS } from "../HeroSlides";
import { HERO_SLIDES } from "@/lib/main-page-data";
import styles from "./HeroMobile.module.css";

const SLIDE_INTERVAL_MS = 5500;

/**
 * 모바일 히어로 — 자동 슬라이드(5.5초) + 켄번스 + 점 수동 전환.
 * 배경은 관리자 사진(slides)이 있으면 사진, 없으면 기본 SVG 아트로 폴백.
 */
export default function HeroMobile({ slides }: { slides: HeroSlideView[] }) {
  const usePhotos = slides.length > 0;
  const total = usePhotos ? slides.length : HERO_SLIDE_COMPONENTS.length;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [total]);

  const counter = `${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const caption = usePhotos ? counter : `${HERO_SLIDES[idx].date} · ${counter}`;

  return (
    <section className={styles.hero}>
      {usePhotos
        ? slides.map((s, i) => (
            <div key={i} className={styles.slide} data-active={i === idx ? "true" : "false"} data-origin={i % 2 === 0 ? "a" : "b"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.alt} className={styles.image} />
            </div>
          ))
        : HERO_SLIDE_COMPONENTS.map((Component, i) => (
            <div key={i} className={styles.slide} data-active={i === idx ? "true" : "false"} data-origin={i % 2 === 0 ? "a" : "b"}>
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
              {Array.from({ length: total }, (_, i) => (
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
            <div className={styles.caption}>{caption}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
