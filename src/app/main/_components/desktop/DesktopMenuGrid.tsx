import Link from "next/link";
import type { ReactNode } from "react";
import { MENU_ITEMS, type MenuItem } from "@/lib/main-page-data";
import MenuIcon from "../MenuIcons";
import styles from "./DesktopMenuGrid.module.css";

function CardShell({ item, children }: { item: MenuItem; children: ReactNode }) {
  return item.href ? (
    <Link href={item.href} className={styles.card}>
      {children}
    </Link>
  ) : (
    <div className={styles.card}>{children}</div>
  );
}

export default function DesktopMenuGrid() {
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>CORE · MENU</div>
          <h2 className={styles.title}>
            가르침의 도구를
            <br />
            <em>가까이에.</em>
          </h2>
        </div>
        <div className={styles.summary}>
          교사 수련, 행사 안내, 교육 자료, 활동 사진까지
          <br />한 곳에서 빠르게 만나보실 수 있습니다.
        </div>
      </div>
      <div className={styles.grid}>
        {MENU_ITEMS.map((m) => (
          <CardShell key={m.key} item={m}>
            <div className={styles.iconBox}>
              <MenuIcon menuKey={m.key} />
            </div>
            <div>
              <div className={styles.en}>{m.en}</div>
              <div className={styles.cardTitle}>{m.title}</div>
              <div className={styles.sub}>{m.sub}</div>
              <div className={styles.metaRow}>
                <span className={styles.metaLeft}>
                  <span className={styles.dot} />
                  {m.meta}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="var(--palette-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}
