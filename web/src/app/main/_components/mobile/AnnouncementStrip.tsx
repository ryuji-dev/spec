import { ANNOUNCEMENT_TEXT } from "@/lib/main-page-data";
import styles from "./AnnouncementStrip.module.css";

export default function AnnouncementStrip() {
  return (
    <div className={styles.strip}>
      <div className={styles.tag}>NOTICE</div>
      <div className={styles.text}>{ANNOUNCEMENT_TEXT}</div>
      <svg width="14" height="14" viewBox="0 0 14 14" className={styles.arrow}>
        <path d="M3 3l8 4-8 4 2-4-2-4z" fill="#fff" />
      </svg>
    </div>
  );
}
