import type { ReactNode } from "react";
import styles from "./PageHeroDesktop.module.css";

type Props = {
  kicker: string;
  title: ReactNode;
  lead?: string;
  rightAccent?: ReactNode;
  bgImage?: string;
};

export default function PageHeroDesktop({
  kicker,
  title,
  lead,
  rightAccent,
  bgImage,
}: Props) {
  return (
    <section className={styles.hero}>
      {bgImage ? (
        <div
          className={styles.bgImage}
          style={{ backgroundImage: `url(${bgImage})` }}
          aria-hidden
        />
      ) : null}
      <div className={styles.overlay} aria-hidden />
      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.kicker}>{kicker}</div>
          <h1 className={styles.title}>{title}</h1>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
        </div>
      </div>
      {rightAccent ? <div className={styles.rightAccent}>{rightAccent}</div> : null}
    </section>
  );
}
