import { SCHEDULE_ITEMS } from "@/lib/main-page-data";
import styles from "./DesktopSchedule.module.css";

export default function DesktopSchedule() {
  return (
    <div className={styles.section}>
      <div className={styles.grid}>
        <div>
          <div className={styles.kicker}>UPCOMING · DATES</div>
          <h2 className={styles.title}>
            다가오는
            <br />
            일정
          </h2>
          <div className={styles.summary}>
            교사 수련회, 연합 행사, 정기 모임 등<br />주요 일정을 한 눈에 확인하세요.
          </div>
        </div>
        <div>
          {SCHEDULE_ITEMS.map((s, i) => (
            <div key={i} className={styles.row}>
              <div className={styles.dateBox}>
                <div className={styles.date}>{s.date}</div>
                <div className={styles.day}>2026 · {s.day}요일</div>
              </div>
              <div className={styles.body}>
                <div className={styles.itemTitle}>{s.title}</div>
                <div className={styles.loc}>{s.loc}</div>
              </div>
              <div className={styles.tag}>{s.tag}</div>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M5 3l5 5-5 5" stroke="var(--palette-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
