import type { HomeData } from "@/server/services/home";
import type { HeroSlideView } from "@/lib/hero";
import HeroMobile from "./HeroMobile";
import MobileStickyHeader from "@/app/_components/MobileStickyHeader";
import AnnouncementStrip from "./AnnouncementStrip";
import SectionHeader from "./SectionHeader";
import MenuCardGrid from "./MenuCardGrid";
import ScheduleList from "./ScheduleList";
import PhotoSectionMobile from "./PhotoSectionMobile";
import FooterMobile from "./FooterMobile";
import BottomTabBar from "./BottomTabBar";
import styles from "./MobilePage.module.css";

// 모바일 페이지. 디자인 원본 app.jsx 섹션 순서 그대로. 공지·일정·사진은 실데이터(props).
export default function MobilePage({ home, heroSlides }: { home: HomeData; heroSlides: HeroSlideView[] }) {
  return (
    <div className={styles.shell}>
      <MobileStickyHeader />
      <HeroMobile slides={heroSlides} />
      <AnnouncementStrip text={home.announcement} />

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
      <ScheduleList items={home.schedule} />

      {/* 사진이 없으면 데스크톱과 동일하게 헤더까지 숨긴다. */}
      {home.photos.length > 0 && (
        <SectionHeader kicker="RECENT · PHOTOS" title="최근 활동 모음" action="사진첩" actionHref="/gallery" />
      )}
      <PhotoSectionMobile photos={home.photos} />

      <FooterMobile />
      <BottomTabBar />
    </div>
  );
}
