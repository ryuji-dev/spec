import type { HomePhotoItem } from "@/server/services/home";
import PhotoTileThumb from "../PhotoTileThumb";
import styles from "./DesktopPhotoSection.module.css";

export default function DesktopPhotoSection({ photos }: { photos: HomePhotoItem[] }) {
  if (photos.length === 0) return null;

  const [featured, ...rest] = photos;
  const middle = rest.slice(0, 2);
  const bottom = rest.slice(2, 6);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>RECENT · PHOTOS</div>
          <h2 className={styles.title}>최근 활동 모음</h2>
        </div>
        <button type="button" className={styles.allBtn}>전체 사진첩 →</button>
      </div>

      <div className={styles.featuredRow}>
        <div className={styles.featuredCard}>
          <PhotoTileThumb imageId={featured.imageId} type={featured.type} idPrefix={`d-feat-${featured.id}`} />
          <div className={styles.featuredCaption}>
            <div className={styles.featuredKicker}>FEATURED · {featured.tag}</div>
            <div className={styles.featuredTitle}>{featured.title}</div>
            <div className={styles.featuredDate}>2026.{featured.date}</div>
          </div>
        </div>
        {middle.map((t) => (
          <div key={t.id} className={styles.midCard}>
            <PhotoTileThumb imageId={t.imageId} type={t.type} idPrefix={`d-mid-${t.id}`} />
            <div className={styles.midCaption}>
              <div className={styles.midKicker}>{t.tag}</div>
              <div className={styles.midTitle}>{t.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.bottomGrid}>
        {bottom.map((t) => (
          <div key={t.id} className={styles.smallCard}>
            <PhotoTileThumb imageId={t.imageId} type={t.type} idPrefix={`d-sml-${t.id}`} />
            <div className={styles.smallCaption}>
              <div className={styles.smallTitle}>{t.title}</div>
              <div className={styles.smallDate}>2026.{t.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
