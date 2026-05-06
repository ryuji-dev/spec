import Image from "next/image";
import styles from "./FooterMobile.module.css";

export default function FooterMobile() {
  return (
    <footer className={styles.footer}>
      <Image
        src="/signature-seogyeong.png"
        alt="대한예수교장로회 서경노회"
        width={1600}
        height={398}
        className={styles.signature}
        sizes="220px"
      />
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
