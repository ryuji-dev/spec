import { SCHEDULE_ITEMS } from "@/lib/main-page-data";
import styles from "./ScheduleList.module.css";

export default function ScheduleList() {
  return (
    <div className={styles.list}>
      {SCHEDULE_ITEMS.map((s, i) => (
        <div key={i} className={styles.row} data-last={i === SCHEDULE_ITEMS.length - 1 ? "true" : "false"}>
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
