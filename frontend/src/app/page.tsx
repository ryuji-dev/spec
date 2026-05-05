import styles from "./page.module.css";
import ScrollToEnter from "./scroll-to-enter";

/**
 * 랜딩페이지 (서경노회 교육위원회 웹진)
 * 원본 디자인:
 *   _design/seogyeong-presbytery-education-committee/project/서경노회 교육위원회 랜딩페이지.html
 * 헌법 [7]: 마크업·디자인은 임의 변경 금지. 데이터/라우팅/인터랙션만 추가.
 * 메뉴 링크는 메인페이지(별도 PR)가 만들어지기 전까지 placeholder("/main")으로 둠.
 */
export default function LandingPage() {
  const MAIN_PAGE_HREF = "/main";

  return (
    <div className={styles.stage}>
      <ScrollToEnter href={MAIN_PAGE_HREF} />
      <div className={styles.bgPan} />
      <div className={styles.bgOverlay} />
      <div className={styles.bgGrain} />

      {/* 컨텐츠 */}
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>
              <svg width="12" height="20" viewBox="0 0 12 20">
                <rect x="5" y="0" width="2" height="20" fill="#fff" />
                <rect x="0" y="5" width="12" height="2" fill="#fff" />
              </svg>
            </div>
            <div className={styles.brandText}>
              <div className={styles.en}>SEOGYEONG · WEBZINE</div>
              <div className={styles.ko}>서경노회 교육위원회 웹진</div>
            </div>
          </div>
          <div className={styles.topMeta}>
            <div className={styles.ko}>교육 · 공동체 · 신앙</div>
          </div>
        </div>

        <div className={styles.center}>
          <div className={styles.label}>EDUCATION COMMITTEE WEBZINE</div>
          <h1>
            Seogyeong Presbytery
            <br />
            <em>Education Committee</em>
          </h1>
          <div className={styles.koTitle}>
            <b>서경노회 교육위원회 웹진</b>
          </div>

          <nav className={styles.menus}>
            <a href={MAIN_PAGE_HREF}>신학원웹진</a>
            <a href={MAIN_PAGE_HREF}>교육위원회</a>
            <a href={MAIN_PAGE_HREF}>교역자수련회</a>
            <a href={MAIN_PAGE_HREF}>자유게시판</a>
            <a href={MAIN_PAGE_HREF}>자료공유</a>
            <a href={MAIN_PAGE_HREF}>한국교회</a>
          </nav>
        </div>

        <div className={styles.bottom}>
          <div className={styles.scrollHint}>
            <span>SCROLL</span>
            <div className={styles.line} />
          </div>
          <a className={styles.enter} href={MAIN_PAGE_HREF}>
            <div className={styles.arr}>
              <span>ENTER</span>
              <svg width="40" height="10" viewBox="0 0 40 10">
                <line x1="0" y1="5" x2="36" y2="5" stroke="#fff" strokeWidth="1" />
                <path d="M30 1 L36 5 L30 9" stroke="#fff" strokeWidth="1" fill="none" />
              </svg>
            </div>
            <div className={styles.ko}>메인 페이지로 들어가기</div>
          </a>
        </div>
      </div>

      <div className={styles.copyright}>
        © 2026 SEOGYEONG PRESBYTERY EDUCATION COMMITTEE
      </div>
    </div>
  );
}
