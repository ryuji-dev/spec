import Link from "next/link";
import type { ContentStat } from "@/server/services/admin-stats";
import styles from "./ui.module.css";

export default function StatCard({ stat }: { stat: ContentStat }) {
  const hasDraft = stat.unpublished >= 1;
  return (
    <Link href={stat.href} className={styles.card} style={{ textDecoration: "none" }}>
      <div className={styles.statLabel}>{stat.label}</div>
      <div className={styles.statValue}>
        {stat.total}
        <span className={styles.statUnit}> 건</span>
      </div>
      <div className={`${styles.statDraft} ${hasDraft ? styles.statDraftActive : ""}`}>
        미공개 {stat.unpublished}
      </div>
    </Link>
  );
}
