import Link from "next/link";
import styles from "./AnnouncementStrip.module.css";

export default function AnnouncementStrip({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <Link href="/notice" className={styles.strip} style={{ textDecoration: "none" }}>
      <div className={styles.tag}>NOTICE</div>
      <div className={styles.text}>{text}</div>
      <svg width="14" height="14" viewBox="0 0 14 14" className={styles.arrow}>
        <path d="M3 3l8 4-8 4 2-4-2-4z" fill="#fff" />
      </svg>
    </Link>
  );
}
