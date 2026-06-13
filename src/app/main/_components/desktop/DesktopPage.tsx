import type { HomeData } from "@/server/services/home";
import DesktopNav from "@/app/_components/DesktopNav";
import DesktopHero from "./DesktopHero";
import DesktopMenuGrid from "./DesktopMenuGrid";
import DesktopSchedule from "./DesktopSchedule";
import DesktopPhotoSection from "./DesktopPhotoSection";
import DesktopFooter from "./DesktopFooter";
import styles from "./DesktopPage.module.css";

// 데스크톱 페이지. 디자인 원본 desktop.jsx 섹션 순서 그대로. 일정·사진은 실데이터(props).
export default function DesktopPage({ home }: { home: HomeData }) {
  return (
    <div className={styles.shell}>
      <div className={styles.heroWrap}>
        <DesktopNav />
        <DesktopHero />
      </div>
      <DesktopMenuGrid />
      <DesktopSchedule items={home.schedule} />
      <DesktopPhotoSection photos={home.photos} />
      <DesktopFooter />
    </div>
  );
}
