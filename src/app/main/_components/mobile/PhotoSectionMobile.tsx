import { PHOTO_TILES, PhotoTile } from "@/lib/main-page-data";
import PhotoThumb from "../PhotoThumb";
import styles from "./PhotoSectionMobile.module.css";

/**
 * 모바일 사진 섹션 — Phase 1: gridStyle="feature" 만 구현 (large 1 + small 4).
 */
export default function PhotoSectionMobile() {
  const featured = PHOTO_TILES[0];
  const smalls = PHOTO_TILES.slice(1, 5);

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

function PhotoCard({ tile, size }: { tile: PhotoTile; size: "large" | "small" }) {
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
