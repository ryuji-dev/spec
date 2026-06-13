import styles from "./main.module.css";
import { getHomeData } from "@/server/services/home";
import DesktopPage from "./_components/desktop/DesktopPage";
import MobilePage from "./_components/mobile/MobilePage";

/**
 * 서경노회 교육위원회 메인페이지. 공지·일정·사진타일은 posts 실데이터(getHomeData),
 * 히어로·메뉴·푸터 등은 정적. 헌법 [7]: 마크업·디자인 불변, 데이터 출처만 연동.
 */
export default async function MainPage() {
  const home = await getHomeData();
  return (
    <div className={styles.root}>
      <div className={styles.desktopOnly}>
        <DesktopPage home={home} />
      </div>
      <div className={styles.mobileOnly}>
        <MobilePage home={home} />
      </div>
    </div>
  );
}
