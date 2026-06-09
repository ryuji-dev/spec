import type { ReactNode } from "react";
import styles from "./auth.module.css";

// 좌측 사진 히어로 + 우측 폼(children)의 스플릿 스크린. 원본 AuthScreen/AuthHero 구조.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.grid}>
      <div className={styles.hero}>
        <div className={styles.heroImg} />
        <div className={styles.heroGrad} />
        <div className={styles.heroDots} />
        <div className={styles.heroContent}>
          <div className={styles.heroKicker}>서경노회 · 교육위원회</div>
          <div>
            <div className={styles.heroEyebrow}>EDUCATION · COMMUNITY · FAITH</div>
            <h2 className={styles.heroTitle}>
              가르치는 자의
              <br />
              <em>거룩한 부르심</em>
            </h2>
            <div className={styles.heroQuoteWrap}>
              <p className={styles.heroQuote}>
                보라 형제가 연합하여 동거함이
                <br />
                어찌 그리 선하고 아름다운고
              </p>
              <p className={styles.heroCite}>— 시편 133:1</p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.formSide}>
        <div className={styles.formPanel} />
        <div className={styles.formInner}>{children}</div>
      </div>
    </div>
  );
}
