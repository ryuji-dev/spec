/**
 * 메인페이지 정적 구조 데이터.
 * 히어로·메뉴·내비·푸터·탭 등 사이트 구조에 속하는 상수만 남겼다.
 * 일정·사진첩·공지 등 동적 섹션은 DB에서 가져온다(server/services/home.ts).
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
    key: "faculty",
    en: "FACULTY",
    title: "신학원교수소개",
    sub: "교수진 프로필과 사역",
    meta: "교수진 소개",
    href: "/faculty",
  },
];

export type PhotoTileType =
  | "mountain"
  | "forest"
  | "meeting"
  | "book"
  | "music"
  | "camp";

export type NavItem = { label: string; href?: string };

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { label: "신학원웹진", href: "/webzine" },
  { label: "교육위원회", href: "/committee" },
  { label: "교역자수련회", href: "/training" },
  { label: "자유게시판", href: "/board" },
  { label: "자료공유", href: "/resources" },
  { label: "신학원교수소개", href: "/faculty" },
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
