import Link from "next/link";
import { PageHeroMobile } from "@/app/_components/PageHero";
import PhotoTileThumb from "@/app/main/_components/PhotoTileThumb";
import BottomTabBar from "@/app/main/_components/mobile/BottomTabBar";
import type { GalleryTile } from "@/server/services/gallery";
import styles from "./GalleryMobile.module.css";

const C = {
  bg: "var(--palette-bg)",
  muted: "var(--palette-muted)",
};

export default function GalleryMobile({ tiles }: { tiles: GalleryTile[] }) {
  return (
    <>
      <PageHeroMobile kicker="PHOTOS" title="사진첩" lead="교육위원회의 활동 사진." />
      <main style={{ padding: "24px 20px 80px", background: C.bg, minHeight: "60vh" }}>
        {tiles.length === 0 ? (
          <p style={{ color: C.muted, padding: "40px 0", textAlign: "center" }}>등록된 사진이 없습니다.</p>
        ) : (
          <div className={styles.grid}>
            {tiles.map((t) => (
              <Link key={t.postId} href={t.href} className={styles.card}>
                <div className={styles.thumb}>
                  <PhotoTileThumb imageId={t.imageId} type={t.type} idPrefix={`g-m-${t.postId}`} />
                </div>
                <div className={styles.title}>{t.title}</div>
                <div className={styles.date}>{t.date}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomTabBar />
    </>
  );
}
