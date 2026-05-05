"use client";

import { useEffect, useState } from "react";
import styles from "./MobileStickyHeader.module.css";

const SCROLL_THRESHOLD = 80;

/**
 * 모바일 상단 sticky 헤더 — 80px 이상 스크롤 시 페이드인.
 * 디자인 원본 `_design/.../app.jsx:1238-1294` (StickyHeader_DISABLED) 마크업·스타일을 그대로 옮겼다.
 * 원본은 모바일 프레임 내 absolute였으나 실제 페이지에서는 viewport-fixed 가 자연스러움.
 */
export default function MobileStickyHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.header} data-scrolled={scrolled ? "true" : "false"}>
      <div className={styles.brandRow}>
        <div className={styles.brandMark}>
          <svg width="10" height="16" viewBox="0 0 12 20">
            <rect x="5" y="0" width="2" height="20" fill="var(--palette-primary)" />
            <rect x="0" y="5" width="12" height="2" fill="var(--palette-primary)" />
          </svg>
        </div>
        <div className={styles.brandText}>
          <div className={styles.brandEn}>SEOGYEONG · WEBZINE</div>
          <div className={styles.brandKo}>서경노회 교육위원회 웹진</div>
        </div>
      </div>
      <button type="button" className={styles.searchBtn} aria-label="검색">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="8" cy="8" r="6" stroke="var(--palette-ink)" strokeWidth="1.5" fill="none" />
          <path d="M13 13 L17 17" stroke="var(--palette-ink)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
