import Link from "next/link";
import { ReactNode } from "react";
import styles from "./SectionHeader.module.css";

type Props = {
  kicker: string;
  title: ReactNode;
  action?: string;
  actionHref?: string;
};

export default function SectionHeader({ kicker, title, action, actionHref }: Props) {
  const arrow = (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
  return (
    <div className={styles.header}>
      <div>
        <div className={styles.kicker}>{kicker}</div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      {action &&
        (actionHref ? (
          <Link href={actionHref} className={styles.action} style={{ textDecoration: "none" }}>
            {action}
            {arrow}
          </Link>
        ) : (
          <button className={styles.action} type="button">
            {action}
            {arrow}
          </button>
        ))}
    </div>
  );
}
