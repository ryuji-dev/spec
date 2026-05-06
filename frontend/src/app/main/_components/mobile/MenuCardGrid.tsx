import Link from "next/link";
import type { ReactNode } from "react";
import { MENU_ITEMS, type MenuItem } from "@/lib/main-page-data";
import MenuIcon from "../MenuIcons";
import styles from "./MenuCardGrid.module.css";

function CardShell({ item, children }: { item: MenuItem; children: ReactNode }) {
  return item.href ? (
    <Link href={item.href} className={styles.card}>
      {children}
    </Link>
  ) : (
    <div className={styles.card}>{children}</div>
  );
}

/**
 * 모바일 메뉴 그리드 — Phase 1: layout="grid" (2x2 6칸) 만 구현.
 */
export default function MenuCardGrid() {
  return (
    <div className={styles.grid}>
      {MENU_ITEMS.map((m) => (
        <CardShell key={m.key} item={m}>
          <div className={styles.iconBox}>
            <MenuIcon menuKey={m.key} />
          </div>
          <div className={styles.body}>
            <div className={styles.en}>{m.en}</div>
            <div className={styles.title}>{m.title}</div>
            <div className={styles.sub}>{m.sub}</div>
            <div className={styles.metaRow}>
              <span className={styles.dot} />
              {m.meta}
            </div>
          </div>
        </CardShell>
      ))}
    </div>
  );
}
