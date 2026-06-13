import type { HomePhotoItem } from "@/server/services/home";
import PhotoThumb from "../PhotoThumb";
import styles from "./PhotoSectionMobile.module.css";

// 모바일 사진 섹션 — feature 1 + small 4.
export default function PhotoSectionMobile({ photos }: { photos: HomePhotoItem[] }) {
  if (photos.length === 0) return null;
  const featured = photos[0];
  const smalls = photos.slice(1, 5);

  return (
    <div className={styles.wrap}>
      <PhotoCard tile={featured} size="large" />
      <div className={styles.smallGrid}>
        {smalls.map((t) => (
          <PhotoCard key={t.id} tile={t} size="small" />
        ))}
      </div>
    </div>
  );
}

function PhotoCard({ tile, size }: { tile: HomePhotoItem; size: "large" | "small" }) {
  return (
    <div className={styles.card}>
      <div className={styles.thumb} data-size={size}>
        <PhotoThumb type={tile.type} idPrefix={`m-${tile.id}-${size}`} />
        <div className={styles.tag}>{tile.tag}</div>
      </div>
      <div className={styles.body}>
        <div className={styles.title} data-size={size}>{tile.title}</div>
        <div className={styles.date}>2026.{tile.date}</div>
      </div>
    </div>
  );
}
