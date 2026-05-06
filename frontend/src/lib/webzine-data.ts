// 신학원웹진 mock 데이터 — 원본 _design/.../webzine.jsx 그대로 이식.
// 백엔드 연동 시 fetch로 교체 가능하도록 동일 형태로 export.

export type WebzinePalette = {
  bg: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  muted: string;
  line: string;
};

export type WebzineArticleCoverType =
  | "book"
  | "rural"
  | "book2"
  | "child"
  | "history"
  | "dialogue";

export type WebzineFeaturedCoverType = "wilderness";

export type WebzineFeatured = {
  issue: string;
  category: string;
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  date: string;
  read: string;
  cover: WebzineFeaturedCoverType;
};

export type WebzineArticle = {
  id: number;
  cat: string;
  tag: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  read: string;
  cover: WebzineArticleCoverType;
};

export type WebzineCategory = {
  en: string;
  ko: string;
  count: number;
};

export type WebzineBackIssue = {
  vol: string;
  issue: string;
  date: string;
  theme: string;
};

// 메인페이지의 forest 팔레트와 동일 (frontend/src/app/main/main.module.css)
export const WEBZINE_PALETTE: WebzinePalette = {
  bg: "#F5F1E8",
  surface: "#FBF8F1",
  primary: "#2D4A3E",
  secondary: "#7A8B6F",
  accent: "#C9A96E",
  ink: "#2A2520",
  muted: "#6B5F52",
  line: "rgba(42, 37, 32, 0.12)",
};

export const WZ_FEATURED: WebzineFeatured = {
  issue: "Vol. 24 · 2026 봄호",
  category: "COVER ESSAY",
  title: "광야로 보내심을\n다시 묵상하며",
  subtitle:
    "교사의 자리는 무엇으로 지탱되는가 — 출애굽기 3장의 부르심을 다시 읽다",
  author: "김도현 목사",
  authorRole: "서경신학원 학장",
  date: "2026.04.18",
  read: "12분",
  cover: "wilderness",
};

export const WZ_ARTICLES: WebzineArticle[] = [
  {
    id: 1,
    cat: "신학산책",
    tag: "THEOLOGY",
    title: "말씀을 가르친다는 것 — 칼뱅의 교사론 다시 읽기",
    excerpt:
      "제네바의 작은 강의실에서 시작된 가르침의 신학. 칼뱅이 교사를 어떻게 정의했는지, 그리고 오늘의 우리에게 그것이 어떤 자리로 다가오는지.",
    author: "이정훈 교수",
    date: "04.16",
    read: "8분",
    cover: "book",
  },
  {
    id: 2,
    cat: "현장에서",
    tag: "FIELD",
    title: "시골 작은 교회의 주일학교, 무엇이 가능한가",
    excerpt:
      "학생 일곱 명. 교사 두 명. 그러나 그 자리에서 일어나는 작은 사건들에 대하여.",
    author: "박서영 전도사",
    date: "04.12",
    read: "6분",
    cover: "rural",
  },
  {
    id: 3,
    cat: "북리뷰",
    tag: "REVIEW",
    title: "『가르치는 자의 영성』 — 파머의 오래된 질문",
    excerpt: "“우리는 누구인가” 라는 질문이 어떻게 가르침의 본질이 되는가.",
    author: "정민호 목사",
    date: "04.08",
    read: "5분",
    cover: "book2",
  },
  {
    id: 4,
    cat: "에세이",
    tag: "ESSAY",
    title: "아이의 한 마디가 나를 다시 세웁니다",
    excerpt:
      "교사로 십이 년. 그 사이 잊고 있었던 것을, 한 아이의 짧은 기도가 가르쳐 주었다.",
    author: "오은혜 집사",
    date: "04.05",
    read: "4분",
    cover: "child",
  },
  {
    id: 5,
    cat: "교회사",
    tag: "HISTORY",
    title: "한국교회 주일학교의 한 세기",
    excerpt: "1907년 평양에서 시작된 작은 모임이 오늘에 이르기까지의 길.",
    author: "윤재식 목사",
    date: "04.02",
    read: "10분",
    cover: "history",
  },
  {
    id: 6,
    cat: "대담",
    tag: "DIALOGUE",
    title: "두 세대의 교사, 같은 자리에서 만나다",
    excerpt: "삼십 년 전 주일학교 교사였던 어머니와, 오늘의 교사 딸이 마주 앉았다.",
    author: "편집부",
    date: "03.28",
    read: "15분",
    cover: "dialogue",
  },
];

export const WZ_CATEGORIES: WebzineCategory[] = [
  { en: "THEOLOGY", ko: "신학산책", count: 24 },
  { en: "FIELD", ko: "현장에서", count: 18 },
  { en: "REVIEW", ko: "북리뷰", count: 31 },
  { en: "ESSAY", ko: "에세이", count: 42 },
  { en: "HISTORY", ko: "교회사", count: 12 },
  { en: "DIALOGUE", ko: "대담", count: 9 },
];

export const WZ_BACK_ISSUES: WebzineBackIssue[] = [
  { vol: "Vol. 23", issue: "2026 신년호", date: "2026.01", theme: "다시, 처음의 자리에서" },
  { vol: "Vol. 22", issue: "2025 겨울호", date: "2025.10", theme: "어둠 속의 작은 등불" },
  { vol: "Vol. 21", issue: "2025 가을호", date: "2025.07", theme: "추수하는 자의 노래" },
  { vol: "Vol. 20", issue: "2025 여름호", date: "2025.04", theme: "광야에서 기도하다" },
];
