import styles from "./auth.module.css";

// 십자가 마크 + 국/영문 명칭. 원본 BrandLockup(dark variant) 그대로.
export default function BrandLockup() {
  return (
    <span className={styles.lockup}>
      <span className={styles.mark}>
        <svg width="12.8" height="20.8" viewBox="0 0 12 20" fill="none" aria-hidden="true">
          <rect x="5" y="0" width="2" height="20" fill="#fff" />
          <rect x="0" y="5" width="12" height="2" fill="#fff" />
        </svg>
      </span>
      <span style={{ lineHeight: 1.2, minWidth: 0 }}>
        <span className={styles.lockupKo}>서경노회 교육위원회</span>
        <span className={styles.lockupEn}>
          Seogyeong Presbytery Education Committee
        </span>
      </span>
    </span>
  );
}
