/**
 * 자료공유 mock 데이터.
 * 백엔드 연동 전까지 사용. 디자인 원본 `_design/.../library.jsx`의 LB_* 상수와 동일.
 */

export type ResourceFileType =
  | "ppt"
  | "pdf"
  | "score"
  | "doc"
  | "video"
  | "image";

export type ResourceCategoryKo =
  | "전체"
  | "설교PPT"
  | "악보"
  | "교안"
  | "문서"
  | "영상"
  | "디자인";

export type ResourceCategoryEn =
  | "ALL"
  | "SLIDES"
  | "SCORES"
  | "CURRICULUM"
  | "DOCS"
  | "VIDEO"
  | "DESIGN";

export type ResourceCategoryIcon = "all" | ResourceFileType;

export type ResourceCategory = {
  ko: ResourceCategoryKo;
  en: ResourceCategoryEn;
  count: number;
  icon: ResourceCategoryIcon;
};

export const LB_CATEGORIES: ReadonlyArray<ResourceCategory> = [
  { ko: "전체", en: "ALL", count: 286, icon: "all" },
  { ko: "설교PPT", en: "SLIDES", count: 64, icon: "ppt" },
  { ko: "악보", en: "SCORES", count: 48, icon: "score" },
  { ko: "교안", en: "CURRICULUM", count: 92, icon: "pdf" },
  { ko: "문서", en: "DOCS", count: 42, icon: "doc" },
  { ko: "영상", en: "VIDEO", count: 18, icon: "video" },
  { ko: "디자인", en: "DESIGN", count: 22, icon: "image" },
];

export type ResourceFileCategory = Exclude<ResourceCategoryKo, "전체">;

export type ResourceFile = {
  id: string;
  type: ResourceFileType;
  cat: ResourceFileCategory;
  title: string;
  sub: string;
  size: string;
  date: string;
  downloads: number;
  by: string;
  isNew?: boolean;
};

export const LB_FILES: ReadonlyArray<ResourceFile> = [
  {
    id: "1",
    type: "ppt",
    cat: "설교PPT",
    title: "봄 부흥회 둘째 날 — 다시, 광야로 (PPT)",
    sub: "40슬라이드 · 16:9 · 본문 막 1:12-13 · 한경수 목사",
    size: "12.4 MB",
    date: "2026.04.18",
    downloads: 142,
    by: "편집부",
    isNew: true,
  },
  {
    id: "2",
    type: "pdf",
    cat: "교안",
    title: "주일학교 봄학기 초등부 공과 (1-13과)",
    sub: "인쇄용 · A4 · 흑백/컬러 2종 포함 · 학생용 + 교사용",
    size: "8.7 MB",
    date: "2026.04.16",
    downloads: 384,
    by: "교육부 이수민 전도사",
    isNew: true,
  },
  {
    id: "3",
    type: "score",
    cat: "악보",
    title: "“주의 인자하심이” — 4부 합창 + 피아노 (PDF + 음원)",
    sub: "원곡 G장조 · 변조 F/A♭ 2종 · MR 2분 38초",
    size: "24.1 MB",
    date: "2026.04.14",
    downloads: 612,
    by: "찬양팀",
  },
  {
    id: "4",
    type: "doc",
    cat: "문서",
    title: "교사 양육 매뉴얼 v3 — 신임 교사 6주 과정",
    sub: "한글 + PDF 2종 · 각 주차별 콘티 · 평가지 포함",
    size: "3.2 MB",
    date: "2026.04.12",
    downloads: 218,
    by: "교사대학 운영팀",
  },
  {
    id: "5",
    type: "video",
    cat: "영상",
    title: "제27회 성경고사 본선 — 진행 가이드 영상",
    sub: "4분 22초 · 1080p · 자막 포함",
    size: "142 MB",
    date: "2026.04.08",
    downloads: 96,
    by: "미디어팀 김도현 목사",
  },
  {
    id: "6",
    type: "image",
    cat: "디자인",
    title: "여름 수련회 포스터 · SNS 카드 (Ai · PNG · PSD)",
    sub: "인쇄용 + 인스타 1080² + 스토리 9:16 일괄",
    size: "186 MB",
    date: "2026.04.05",
    downloads: 174,
    by: "디자인팀 오은혜 집사",
  },
  {
    id: "7",
    type: "pdf",
    cat: "교안",
    title: "청년부 큐티 가이드 — 출애굽기 13주 일정",
    sub: "주일 묵상 + 평일 큐티 + 소그룹 토론 질문",
    size: "2.8 MB",
    date: "2026.04.02",
    downloads: 246,
    by: "청년부 박혜진 전도사",
  },
  {
    id: "8",
    type: "ppt",
    cat: "설교PPT",
    title: "교사 헌신예배 설교 PPT — 가르치는 자의 자리",
    sub: "32슬라이드 · 박세영 목사 · 본문 마 28:19-20",
    size: "9.6 MB",
    date: "2026.03.30",
    downloads: 318,
    by: "편집부",
  },
];

export type CollectionCoverKind = "spring" | "easter" | "teacher";
export type CollectionBadge = "NEW" | "HOT";

export type ResourceCollection = {
  id: string;
  title: string;
  sub: string;
  items: number;
  downloads: number;
  cover: CollectionCoverKind;
  badge?: CollectionBadge;
  /** 표시용 태그. 카테고리(`ResourceFileCategory`)를 포함하지만 '예배'·'교사' 같은 큐레이션 태그도 들어옴. */
  tag: string;
};

export const LB_COLLECTIONS: ReadonlyArray<ResourceCollection> = [
  {
    id: "spring-2026",
    title: "2026 봄학기 공과 모음",
    sub: "유년 · 초등 · 중고등 · 청년 4개 학년 일괄",
    items: 12,
    downloads: 2840,
    cover: "spring",
    badge: "NEW",
    tag: "교안",
  },
  {
    id: "easter-worship",
    title: "부활절 연합 예배 패키지",
    sub: "설교 PPT · 콘티 · 악보 · 영상 매뉴얼",
    items: 8,
    downloads: 1623,
    cover: "easter",
    badge: "HOT",
    tag: "예배",
  },
  {
    id: "teacher-essentials",
    title: "교사 필수 자료 50선",
    sub: "교사 헌신예배 · 교사대학 · 양육 가이드",
    items: 50,
    downloads: 4128,
    cover: "teacher",
    tag: "교사",
  },
];

export type ResourceTopItem = {
  rank: number;
  title: string;
  downloads: number;
  type: ResourceFileType;
};

export type ResourcesSort = "recent" | "downloads" | "name";
export type ResourcesView = "grid" | "list";

export const RESOURCES_SORTS: ReadonlyArray<{
  v: ResourcesSort;
  label: string;
}> = [
  { v: "recent", label: "최신순" },
  { v: "downloads", label: "다운로드순" },
  { v: "name", label: "이름순" },
];

export const LB_TOP: ReadonlyArray<ResourceTopItem> = [
  {
    rank: 1,
    title: "주일학교 봄학기 공과 PDF 일괄 다운로드",
    downloads: 2104,
    type: "pdf",
  },
  {
    rank: 2,
    title: "교사 헌신예배 설교문 모음 (2020-2025)",
    downloads: 1432,
    type: "doc",
  },
  {
    rank: 3,
    title: "“주의 인자하심이” 4부 합창 악보+MR",
    downloads: 612,
    type: "score",
  },
  {
    rank: 4,
    title: "봄 부흥회 둘째 날 PPT — 한경수 목사",
    downloads: 142,
    type: "ppt",
  },
  {
    rank: 5,
    title: "여름 수련회 포스터 SNS 카드 일괄",
    downloads: 174,
    type: "image",
  },
];
