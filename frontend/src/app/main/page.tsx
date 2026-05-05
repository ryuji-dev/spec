import styles from "./main.module.css";
import DesktopPage from "./_components/desktop/DesktopPage";
import MobilePage from "./_components/mobile/MobilePage";

/**
 * 서경노회 교육위원회 메인페이지 (Phase 1 — 정적 레이아웃 + mock 데이터)
 * 원본 디자인:
 *   _design/seogyeong-presbytery-education-committee/project/서경노회 교육위원회 메인페이지.html
 *   _design/.../app.jsx, desktop.jsx
 * 헌법 [7]: 마크업·디자인은 임의 변경 금지. 데이터/라우팅만 추가.
 *
 * 범위 외 (Phase 2 PR): 히어로 자동슬라이드/켄번스, 바텀탭 인터랙션, 헤더 스크롤 효과.
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
