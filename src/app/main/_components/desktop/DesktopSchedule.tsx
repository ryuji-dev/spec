import type { HomeScheduleItem } from "@/server/services/home";
import styles from "./DesktopSchedule.module.css";

export default function DesktopSchedule({ items }: { items: HomeScheduleItem[] }) {
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
          {items.length === 0 ? (
            <div className={styles.row}>
              <div className={styles.body}>
                <div className={styles.itemTitle}>예정된 일정이 없습니다.</div>
              </div>
            </div>
          ) : (
            items.map((s) => (
              <div key={s.id} className={styles.row}>
                <div className={styles.dateBox}>
                  <div className={styles.date}>{s.date}</div>
                  <div className={styles.day}>2026 · {s.dayLong}</div>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
