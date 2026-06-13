import type { HomeScheduleItem } from "@/server/services/home";
import styles from "./ScheduleList.module.css";

export default function ScheduleList({ items }: { items: HomeScheduleItem[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.list}>
        <div className={styles.row} data-last="true">
          <div className={styles.body}>
            <div className={styles.title}>예정된 일정이 없습니다.</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.list}>
      {items.map((s, i) => (
        <div key={s.id} className={styles.row} data-last={i === items.length - 1 ? "true" : "false"}>
          <div className={styles.dateBox}>
            <div className={styles.date}>{s.date}</div>
            <div className={styles.day}>{s.day}</div>
          </div>
          <div className={styles.body}>
            <div className={styles.title}>{s.title}</div>
            <div className={styles.loc}>{s.loc}</div>
          </div>
          <div className={styles.tag}>{s.tag}</div>
        </div>
      ))}
    </div>
  );
}
