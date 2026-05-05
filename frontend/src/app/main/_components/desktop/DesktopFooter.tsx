import { FOOTER_COLUMNS } from "@/lib/main-page-data";
import styles from "./DesktopFooter.module.css";

export default function DesktopFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div>
          <div className={styles.headline}>
            함께 가르치고
            <br />
            함께 자라는 자리.
          </div>
          <div className={styles.address}>
            대한예수교장로회 서경노회 교육위원회
            <br />
            서울특별시 서대문구 충정로 00-00
            <br />
            02-000-0000 · edu@seogyeong.or.kr
          </div>
        </div>
        {FOOTER_COLUMNS.map((c) => (
          <div key={c.title}>
            <div className={styles.colTitle}>{c.title.toUpperCase()}</div>
            {c.items.map((item) => (
              <div key={item} className={styles.colItem}>{item}</div>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.divider} />
      <div className={styles.bottom}>
        <span>© 2026 SEOGYEONG PRESBYTERY · ALL RIGHTS RESERVED</span>
        <span>EDUCATION COMMITTEE</span>
      </div>
    </footer>
  );
}
