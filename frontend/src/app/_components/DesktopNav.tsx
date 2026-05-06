import Link from "next/link";
import { NAV_ITEMS } from "@/lib/main-page-data";
import styles from "./DesktopNav.module.css";

type Props = {
  variant?: "transparent" | "solid";
};

/**
 * 사이트 데스크톱 상단 네비.
 * - transparent: 메인페이지 히어로 위 오버레이 (흰 글자/투명 배경, absolute)
 * - solid: 라이트 페이지 상단 sticky (어두운 글자/반투명 흰 배경)
 */
export default function DesktopNav({ variant = "transparent" }: Props) {
  return (
    <div className={styles.nav} data-variant={variant}>
      <Link href="/main" className={styles.brand} aria-label="메인페이지로 이동">
        <div className={styles.brandMark}>
          <svg width="11" height="18" viewBox="0 0 12 20">
            <rect x="5" y="0" width="2" height="20" fill="currentColor" />
            <rect x="0" y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </div>
        <div className={styles.brandText}>
          <div className={styles.brandKo}>서경노회 교육위원회 웹진</div>
          <div className={styles.brandEn}>Seogyeong Presbytery Education Committee</div>
        </div>
      </Link>
      <div className={styles.menu}>
        {NAV_ITEMS.map((item) =>
          item.href ? (
            <Link key={item.label} href={item.href} className={styles.menuItem}>
              {item.label}
            </Link>
          ) : (
            <a key={item.label} className={styles.menuItem}>{item.label}</a>
          ),
        )}
      </div>
      <div className={styles.utils}>
        <button type="button" className={styles.searchBtn} aria-label="검색">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M13 13 L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" className={styles.loginBtn}>로그인</button>
      </div>
    </div>
  );
}
