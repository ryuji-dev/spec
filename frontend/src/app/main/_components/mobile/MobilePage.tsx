import HeroMobile from "./HeroMobile";
import MobileStickyHeader from "./MobileStickyHeader";
import AnnouncementStrip from "./AnnouncementStrip";
import SectionHeader from "./SectionHeader";
import MenuCardGrid from "./MenuCardGrid";
import ScheduleList from "./ScheduleList";
import PhotoSectionMobile from "./PhotoSectionMobile";
import FooterMobile from "./FooterMobile";
import BottomTabBar from "./BottomTabBar";
import styles from "./MobilePage.module.css";

/**
 * 모바일 페이지. 디자인 원본 `app.jsx:47-96` 섹션 순서를 그대로 따른다.
 */
export default function MobilePage() {
  return (
    <div className={styles.shell}>
      <MobileStickyHeader />
      <HeroMobile />
      <AnnouncementStrip />

      <SectionHeader
        kicker="CORE · MENU"
        title={
          <>
            가르침의 도구를
            <br />
            <em>가까이에.</em>
          </>
        }
      />
      <MenuCardGrid />

      <SectionHeader kicker="UPCOMING" title="다가오는 일정" action="전체보기" />
      <ScheduleList />

      <SectionHeader kicker="RECENT · PHOTOS" title="최근 활동 모음" action="사진첩" />
      <PhotoSectionMobile />

      <FooterMobile />
      <BottomTabBar />
    </div>
  );
}
