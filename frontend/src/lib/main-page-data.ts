/**
 * 메인페이지 mock 데이터.
 * 백엔드 연동 전까지 사용. 디자인 원본 `_design/.../app.jsx`, `desktop.jsx` 와 동일한 내용.
 */

export type HeroSlide = {
  key: string;
  caption: string;
  date: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  { key: "wilderness-dawn", caption: "광야의 새벽", date: "2026.04" },
  { key: "green-pastures", caption: "푸른 초장으로", date: "2026.03" },
  { key: "still-waters", caption: "잔잔한 물가", date: "2026.02" },
  { key: "starry-night", caption: "별이 빛나는 밤", date: "2026.01" },
];

export type MenuItem = {
  key: string;
  en: string;
  title: string;
  sub: string;
  meta: string;
  href?: string;
};

export const MENU_ITEMS: MenuItem[] = [
  {
    key: "webzine",
    en: "WEBZINE",
    title: "신학원웹진",
    sub: "신학원 소식과 글 모음",
    meta: "최신 호 · 2026.04",
    href: "/webzine",
  },
  {
    key: "edu",
    en: "COMMITTEE",
    title: "교육위원회",
    sub: "위원회 소개 및 활동",
    meta: "2026년도 회기",
  },
  {
    key: "training",
    en: "TRAINING",
    title: "교역자수련회",
    sub: "봄·가을 정기 수련회",
    meta: "2026 상반기 · 신청중",
  },
  {
    key: "board",
    en: "BOARD",
    title: "자유게시판",
    sub: "교제와 나눔의 공간",
    meta: "오늘의 글 12개",
  },
  {
    key: "library",
    en: "LIBRARY",
    title: "자료공유",
    sub: "악보 · 설교 PPT · 교안",
    meta: "신규 24건",
  },
  {
    key: "church",
    en: "CHURCH",
    title: "한국교회",
    sub: "한국교회 소식과 자료",
    meta: "연합 자료 모음",
  },
];

export type ScheduleItem = {
  date: string;
  day: string;
  title: string;
  loc: string;
  tag: string;
};

export const SCHEDULE_ITEMS: ScheduleItem[] = [
  { date: "05.10", day: "주일", title: "제27회 성경고사 본선", loc: "서경교회 본당", tag: "대회" },
  { date: "05.24", day: "주일", title: "봄 교사 헌신예배", loc: "제일교회", tag: "예배" },
  { date: "06.06", day: "금", title: "여름 수련회 사전 모임", loc: "교육관 3층", tag: "모임" },
];

export type PhotoTileType =
  | "mountain"
  | "forest"
  | "meeting"
  | "book"
  | "music"
  | "camp";

export type PhotoTile = {
  id: number;
  title: string;
  date: string;
  tag: string;
  type: PhotoTileType;
};

export const PHOTO_TILES: PhotoTile[] = [
  { id: 1, title: "교사 헌신예배", date: "04.28", tag: "예배", type: "mountain" },
  { id: 2, title: "봄 야외수련회", date: "04.20", tag: "수련회", type: "forest" },
  { id: 3, title: "주일학교 교사회의", date: "04.15", tag: "회의", type: "meeting" },
  { id: 4, title: "성경고사 본선", date: "04.10", tag: "대회", type: "book" },
  { id: 5, title: "찬양제 리허설", date: "04.05", tag: "음악", type: "music" },
  { id: 6, title: "교육위원회 정기모임", date: "03.28", tag: "회의", type: "meeting" },
  { id: 7, title: "여름 캠프 사전답사", date: "03.22", tag: "답사", type: "camp" },
];

export const ANNOUNCEMENT_TEXT = "2026년 상반기 교사 수련회 신청이 시작되었습니다.";

export type NavItem = { label: string; href?: string };

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { label: "신학원웹진", href: "/webzine" },
  { label: "교육위원회", href: "/committee" },
  { label: "교역자수련회", href: "/training" },
  { label: "자유게시판" },
  { label: "자료공유" },
  { label: "한국교회" },
];

export type FooterColumn = { title: string; items: ReadonlyArray<string> };

export const FOOTER_COLUMNS: ReadonlyArray<FooterColumn> = [
  { title: "교육 사역", items: ["교사 수련회", "성경고사", "찬양제", "교사 헌신예배"] },
  { title: "자료실", items: ["설교 PPT", "주일학교 교안", "찬양 악보", "주보 양식"] },
  { title: "소통", items: ["공지사항", "사진첩", "문의하기", "제안 보내기"] },
];

export type BottomTab = { key: string; label: string };

export const BOTTOM_TABS: ReadonlyArray<BottomTab> = [
  { key: "home", label: "홈" },
  { key: "tent", label: "수련회" },
  { key: "book", label: "자료실" },
  { key: "photo", label: "사진첩" },
  { key: "menu", label: "메뉴" },
];
