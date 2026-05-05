import styles from "./FooterMobile.module.css";

export default function FooterMobile() {
  return (
    <footer className={styles.footer}>
      <div className={styles.headline}>
        함께 가르치고
        <br />
        함께 자라는 자리.
      </div>
      <div className={styles.divider} />
      <div className={styles.address}>
        대한예수교장로회 서경노회 교육위원회
        <br />
        서울특별시 서대문구 충정로 00-00 · 02-000-0000
        <br />
        edu@seogyeong.or.kr
      </div>
      <div className={styles.copy}>© 2026 SEOGYEONG · ALL RIGHTS RESERVED</div>
    </footer>
  );
}
