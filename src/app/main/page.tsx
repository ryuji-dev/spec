import styles from "./main.module.css";
import DesktopPage from "./_components/desktop/DesktopPage";
import MobilePage from "./_components/mobile/MobilePage";

/**
 * 서경노회 교육위원회 메인페이지 (mock 데이터, 인터랙션 포함)
 * 원본 디자인:
 *   _design/seogyeong-presbytery-education-committee/project/서경노회 교육위원회 메인페이지.html
 *   _design/.../app.jsx, desktop.jsx
 * 헌법 [7]: 마크업·디자인은 임의 변경 금지. 데이터/라우팅만 추가.
 */
export default function MainPage() {
  return (
    <div className={styles.root}>
      <div className={styles.desktopOnly}>
        <DesktopPage />
      </div>
      <div className={styles.mobileOnly}>
        <MobilePage />
      </div>
    </div>
  );
}
