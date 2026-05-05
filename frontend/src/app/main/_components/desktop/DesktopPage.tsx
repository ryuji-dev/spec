import DesktopNav from "./DesktopNav";
import DesktopHero from "./DesktopHero";
import DesktopMenuGrid from "./DesktopMenuGrid";
import DesktopSchedule from "./DesktopSchedule";
import DesktopPhotoSection from "./DesktopPhotoSection";
import DesktopFooter from "./DesktopFooter";
import styles from "./DesktopPage.module.css";

/**
 * 데스크톱 페이지 — Phase 1: 정적 레이아웃.
 * 디자인 원본 `desktop.jsx` 의 섹션 순서 그대로.
 */
export default function DesktopPage() {
  return (
    <div className={styles.shell}>
      <div className={styles.heroWrap}>
        <DesktopNav />
        <DesktopHero />
      </div>
      <DesktopMenuGrid />
      <DesktopSchedule />
      <DesktopPhotoSection />
      <DesktopFooter />
    </div>
  );
}
