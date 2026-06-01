/**
 * 교육위원회 게시판 mock 데이터.
 * 백엔드 연동 전까지 사용. 디자인 원본 `_design/.../board.jsx` BD_* 상수와 동일.
 */

export type PostCategoryKo = "공지" | "회의록" | "수련회" | "자료실" | "나눔";
export type PostCategoryEn =
  | "NOTICE"
  | "MINUTES"
  | "TRAINING"
  | "LIBRARY"
  | "SHARE";

export type Post = {
  id: string;
  cat: PostCategoryKo;
  catEn: PostCategoryEn;
  title: string;
  excerpt: string;
  author: string;
  authorInit: string;
  date: string;
  views: number;
  comments: number;
  attach?: number;
  isNew?: boolean;
};

export const BD_PINNED: Post = {
  id: "0",
  cat: "공지",
  catEn: "NOTICE",
  title: "2026년 상반기 교육위원회 정기총회 안내",
  excerpt:
    "오는 5월 24일 주일 오후 2시, 서경교회 본당에서 2026년 상반기 정기총회를 개최합니다. 안건과 일정, 참석 절차를 자세히 안내드립니다.",
  author: "교육위원장 한경수 목사",
  authorInit: "한",
  date: "2026.04.20",
  views: 1248,
  comments: 14,
  isNew: true,
};

export const BD_POSTS: Post[] = [
  {
    id: "1",
    cat: "회의록",
    catEn: "MINUTES",
    title: "제 4차 임원회의 회의록 (2026.04.18)",
    excerpt: "교사 수련회 일정 확정, 성경고사 본선 진행 안내, 하반기 사업 계획 1차 검토.",
    author: "서기 박혜진 전도사",
    authorInit: "박",
    date: "2026.04.19",
    views: 312,
    comments: 6,
    attach: 2,
    isNew: true,
  },
  {
    id: "2",
    cat: "수련회",
    catEn: "TRAINING",
    title: "2026 봄 교사 수련회 — 사전 신청 마감 안내",
    excerpt: "4월 30일까지 각 교회별 명단을 제출해주시기 바랍니다. 신청 양식과 숙소 배정 기준 첨부.",
    author: "총무 김도현 목사",
    authorInit: "김",
    date: "2026.04.17",
    views: 894,
    comments: 23,
    attach: 3,
    isNew: true,
  },
  {
    id: "3",
    cat: "자료실",
    catEn: "LIBRARY",
    title: "주일학교 봄학기 공과 PDF 일괄 다운로드",
    excerpt: "유년부·초등부·중고등부 3개 학년 공과를 한 번에 받으실 수 있습니다. 인쇄 가이드 포함.",
    author: "자료팀 이수민 전도사",
    authorInit: "이",
    date: "2026.04.15",
    views: 2104,
    comments: 31,
    attach: 5,
  },
  {
    id: "4",
    cat: "공지",
    catEn: "NOTICE",
    title: "제27회 성경고사 본선 진행 일정 변경 안내",
    excerpt: "본선 일정이 5월 10일 주일에서 5월 17일 주일 오후 3시로 변경되었습니다.",
    author: "교육위원장 한경수 목사",
    authorInit: "한",
    date: "2026.04.12",
    views: 1056,
    comments: 8,
  },
  {
    id: "5",
    cat: "나눔",
    catEn: "SHARE",
    title: "주일학교 부서 운영, 작은 교회의 한 사례",
    excerpt: "학생 9명의 작은 교회에서 1년간 시도해 본 통합 운영 사례를 나눕니다. 함께 고민해주세요.",
    author: "강서동산교회 정민호 목사",
    authorInit: "정",
    date: "2026.04.10",
    views: 542,
    comments: 17,
  },
  {
    id: "6",
    cat: "회의록",
    catEn: "MINUTES",
    title: "제 3차 임원회의 회의록 (2026.04.04)",
    excerpt: "봄 수련회 장소 최종 확정, 강사 섭외 진행 보고, 예산 1차 심의.",
    author: "서기 박혜진 전도사",
    authorInit: "박",
    date: "2026.04.05",
    views: 287,
    comments: 3,
    attach: 1,
  },
  {
    id: "7",
    cat: "자료실",
    catEn: "LIBRARY",
    title: "교사 헌신예배 설교문 모음 (2020 - 2025)",
    excerpt: "지난 6년간 교사 헌신예배에서 선포된 설교 18편을 한 권으로 묶었습니다.",
    author: "편집부",
    authorInit: "편",
    date: "2026.04.02",
    views: 1432,
    comments: 22,
    attach: 1,
  },
  {
    id: "8",
    cat: "나눔",
    catEn: "SHARE",
    title: "아이가 처음 “기도해도 돼요?”라고 물었던 날",
    excerpt: "교사의 자리에서 가끔 문득 마주치는 작은 순간들에 대하여.",
    author: "오은혜 집사",
    authorInit: "오",
    date: "2026.03.30",
    views: 822,
    comments: 41,
  },
  {
    id: "9",
    cat: "공지",
    catEn: "NOTICE",
    title: "여름 수련회 사전 답사 동행 신청",
    excerpt: "6월 6일(금) 강원도 평창. 답사에 동행하실 위원을 모집합니다.",
    author: "총무 김도현 목사",
    authorInit: "김",
    date: "2026.03.28",
    views: 478,
    comments: 12,
  },
  {
    id: "10",
    cat: "수련회",
    catEn: "TRAINING",
    title: "봄 수련회 강사 — 이정훈 교수 인터뷰 미리보기",
    excerpt: "“가르침은 결국 한 사람의 자리에서 시작됩니다.” 수련회 키노트의 첫 단락을 미리 공유합니다.",
    author: "편집부",
    authorInit: "편",
    date: "2026.03.25",
    views: 663,
    comments: 9,
  },
];

export type PostCategory = {
  ko: PostCategoryKo | "전체";
  en: PostCategoryEn | "ALL";
  count: number;
};

export const BD_CATEGORIES: PostCategory[] = [
  { ko: "전체", en: "ALL", count: 142 },
  { ko: "공지", en: "NOTICE", count: 28 },
  { ko: "회의록", en: "MINUTES", count: 24 },
  { ko: "수련회", en: "TRAINING", count: 19 },
  { ko: "자료실", en: "LIBRARY", count: 36 },
  { ko: "나눔", en: "SHARE", count: 35 },
];

export type PopularPost = { id: string; title: string; views: number };

export const BD_POPULAR: PopularPost[] = [
  { id: "11", title: "주일학교 봄학기 공과 PDF 일괄 다운로드", views: 2104 },
  { id: "12", title: "교사 헌신예배 설교문 모음 (2020-2025)", views: 1432 },
  { id: "13", title: "2026년 상반기 정기총회 안내", views: 1248 },
  { id: "14", title: "성경고사 본선 일정 변경 안내", views: 1056 },
  { id: "15", title: "봄 교사 수련회 사전 신청", views: 894 },
];

export const BD_TAGS: ReadonlyArray<string> = [
  "#수련회",
  "#주일학교",
  "#성경고사",
  "#교사",
  "#공과",
  "#설교문",
  "#예배",
  "#커리큘럼",
  "#대담",
  "#나눔",
];

export type SideAuthor = {
  name: string;
  role: string;
  init: string;
  posts: number;
};

export const SIDE_AUTHORS: SideAuthor[] = [
  { name: "한경수 목사", role: "교육위원장", init: "한", posts: 18 },
  { name: "김도현 목사", role: "총무", init: "김", posts: 14 },
  { name: "박혜진 전도사", role: "서기", init: "박", posts: 12 },
  { name: "이수민 전도사", role: "자료팀", init: "이", posts: 9 },
];
