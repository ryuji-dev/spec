import Link from "next/link";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import PhotoTileThumb from "@/app/main/_components/PhotoTileThumb";
import type { GalleryTile } from "@/server/services/gallery";
import styles from "./GalleryDesktop.module.css";

const C = {
  bg: "var(--palette-bg)",
  muted: "var(--palette-muted)",
};

export default function GalleryDesktop({ tiles }: { tiles: GalleryTile[] }) {
  return (
    <>
      <PageHeroDesktop kicker="PHOTOS" title="사진첩" lead="교육위원회의 활동을 사진으로 모았습니다." />
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 96px", background: C.bg }}>
        {tiles.length === 0 ? (
          <p style={{ color: C.muted, padding: "48px 0", textAlign: "center" }}>등록된 사진이 없습니다.</p>
        ) : (
          <div className={styles.grid}>
            {tiles.map((t) => (
              <Link key={t.postId} href={t.href} className={styles.card}>
                <div className={styles.thumb}>
                  <PhotoTileThumb imageId={t.imageId} type={t.type} idPrefix={`g-d-${t.postId}`} />
                </div>
                <div className={styles.caption}>
                  <div className={styles.tag}>{t.tag}</div>
                  <div className={styles.title}>{t.title}</div>
                  <div className={styles.date}>{t.date}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
