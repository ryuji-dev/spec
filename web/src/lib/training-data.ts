/**
 * 교역자수련회 게시판 mock 데이터.
 * 백엔드 연동 전까지 사용. 디자인 원본 `_design/.../training.jsx` TR_* 상수와 동일.
 */

export type TrainingCategoryKo = "예정" | "신청" | "후기" | "강의자료" | "Q&A";
export type TrainingCategoryEn =
  | "UPCOMING"
  | "OPEN"
  | "REVIEW"
  | "MATERIALS"
  | "QNA";

export type CoverKind =
  | "mountain-dawn"
  | "autumn"
  | "youth"
  | "desert"
  | "pine"
  | "lake"
  | "field";

export type UpcomingTraining = {
  id: string;
  badge: string;
  cat: string;
  title: string;
  subtitle: string;
  theme: string;
  dates: string;
  daysLeft: number;
  place: string;
  speakers: ReadonlyArray<string>;
  registered: number;
  capacity: number;
  deadline: string;
  fee: string;
  cover: CoverKind;
};

export const TR_UPCOMING: UpcomingTraining = {
  id: "spring-2026",
  badge: "신청 접수 중",
  cat: "봄 정기",
  title: "2026 봄 교역자 수련회",
  subtitle: "말씀 앞에 다시 서다",
  theme: "“너희는 가만히 있어 내가 하나님 됨을 알지어다” (시 46:10)",
  dates: "2026.05.18 — 05.20",
  daysLeft: 11,
  place: "강원도 평창 · 알펜시아 컨벤션",
  speakers: ["이정훈 교수", "박세영 목사", "김명숙 사모"],
  registered: 87,
  capacity: 120,
  deadline: "2026.05.05",
  fee: "180,000원",
  cover: "mountain-dawn",
};

export type NextTraining = {
  id: string;
  badge: string;
  cat: string;
  title: string;
  dates: string;
  place: string;
  note: string;
  cover: CoverKind;
};

export const TR_NEXT: ReadonlyArray<NextTraining> = [
  {
    id: "autumn-2026",
    badge: "사전 예고",
    cat: "가을 정기",
    title: "2026 가을 교역자 수련회",
    dates: "2026.10.13 — 10.15",
    place: "충남 보령 · 천주교피정의집",
    note: "주제 · 강사 7월 중 공지 예정",
    cover: "autumn",
  },
  {
    id: "youth-2026",
    badge: "특별 세미나",
    cat: "청년사역",
    title: "청년부 사역자 1박 모임",
    dates: "2026.06.21 — 06.22",
    place: "서울 양화진 게스트하우스",
    note: "청년부 담당 교역자 한정 · 25명",
    cover: "youth",
  },
];

export type PastTraining = {
  id: number;
  season: string;
  title: string;
  date: string;
  participants: number;
  cover: CoverKind;
  kind: "big" | "tall" | "wide" | "small";
};

export const TR_PAST: ReadonlyArray<PastTraining> = [
  {
    id: 1,
    season: "2025 가을",
    title: "광야의 은혜를 기억하다",
    date: "2025.10.07",
    participants: 104,
    cover: "desert",
    kind: "big",
  },
  {
    id: 2,
    season: "2025 봄",
    title: "다시, 처음의 자리에서",
    date: "2025.05.13",
    participants: 96,
    cover: "pine",
    kind: "tall",
  },
  {
    id: 3,
    season: "2024 가을",
    title: "깊은 데로 가서",
    date: "2024.10.15",
    participants: 88,
    cover: "lake",
    kind: "wide",
  },
  {
    id: 4,
    season: "2024 봄",
    title: "말씀의 사람으로",
    date: "2024.05.21",
    participants: 92,
    cover: "field",
    kind: "small",
  },
];

export type TrainingCategory = {
  ko: TrainingCategoryKo | "전체";
  en: TrainingCategoryEn | "ALL";
  count: number;
};

export const TR_CATEGORIES: ReadonlyArray<TrainingCategory> = [
  { ko: "전체", en: "ALL", count: 38 },
  { ko: "예정", en: "UPCOMING", count: 3 },
  { ko: "신청", en: "OPEN", count: 1 },
  { ko: "후기", en: "REVIEW", count: 14 },
  { ko: "강의자료", en: "MATERIALS", count: 18 },
  { ko: "Q&A", en: "QNA", count: 22 },
];

export type TrainingPost = {
  id: string;
  cat: TrainingCategoryKo;
  catEn: TrainingCategoryEn;
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

export const TR_BOARD: ReadonlyArray<TrainingPost> = [
  {
    id: "11",
    cat: "강의자료",
    catEn: "MATERIALS",
    title: "2025 가을 수련회 — 이정훈 교수 강의안 PDF (3편 일괄)",
    excerpt:
      "“광야 신학” 1·2·3강 강의안과 후속 토론자료를 한 번에 받으실 수 있습니다.",
    author: "편집부 김도현 목사",
    authorInit: "김",
    date: "2026.04.18",
    views: 1842,
    comments: 12,
    attach: 4,
    isNew: true,
  },
  {
    id: "12",
    cat: "신청",
    catEn: "OPEN",
    title: "2026 봄 수련회 신청 — 변경/취소 절차 안내",
    excerpt:
      "5월 5일까지 변경 가능, 그 이후 취소 시 회비의 50%만 환불됩니다. 양식 첨부.",
    author: "총무 박혜진 전도사",
    authorInit: "박",
    date: "2026.04.16",
    views: 1024,
    comments: 8,
    attach: 1,
    isNew: true,
  },
  {
    id: "13",
    cat: "후기",
    catEn: "REVIEW",
    title: "광야 한복판에서, 다시 일어설 힘을 받다",
    excerpt:
      "2025 가을 수련회 둘째 날 새벽기도. 그 자리에서 마주한 한 시간을 돌아봅니다.",
    author: "강서동산교회 정민호 목사",
    authorInit: "정",
    date: "2026.04.10",
    views: 712,
    comments: 24,
  },
  {
    id: "14",
    cat: "Q&A",
    catEn: "QNA",
    title: "봄 수련회 — 가족 동반(아이 포함) 가능한가요?",
    excerpt:
      "미취학 자녀 두 명과 함께 참석 고려 중입니다. 별도 보육 운영 여부 문의드립니다.",
    author: "서대문교회 임선영 사모",
    authorInit: "임",
    date: "2026.04.09",
    views: 388,
    comments: 6,
  },
  {
    id: "15",
    cat: "강의자료",
    catEn: "MATERIALS",
    title: "2025 봄 수련회 — 박세영 목사 설교 영상 (4편)",
    excerpt:
      "“다시, 처음의 자리에서” 4편의 강의 영상을 비공개 링크로 공유드립니다.",
    author: "미디어팀 이수민 전도사",
    authorInit: "이",
    date: "2026.04.04",
    views: 1463,
    comments: 15,
    attach: 4,
  },
  {
    id: "16",
    cat: "후기",
    catEn: "REVIEW",
    title: "40대 후반의 목사로 다시 듣게 된 ‘부르심’",
    excerpt: "말씀 앞에서 익숙함이 무뎌졌던 시간들. 수련회의 작은 침묵 속에서.",
    author: "대치순복음교회 한경수 목사",
    authorInit: "한",
    date: "2026.03.30",
    views: 921,
    comments: 31,
  },
  {
    id: "17",
    cat: "Q&A",
    catEn: "QNA",
    title: "단체 차량 운행 — 서울역 픽업 가능 여부",
    excerpt: "서울역에서 출발하는 단체 차량이 운행되는지, 시간표는 어떻게 되는지요.",
    author: "신촌교회 오은혜 집사",
    authorInit: "오",
    date: "2026.03.28",
    views: 245,
    comments: 4,
  },
];

export type TrainingSpeaker = {
  name: string;
  role: string;
  init: string;
  talks: number;
  affiliation: string;
};

export const TR_SPEAKERS: ReadonlyArray<TrainingSpeaker> = [
  {
    name: "이정훈 교수",
    role: "키노트 · 광야 신학",
    init: "이",
    talks: 3,
    affiliation: "장로회신학대학교",
  },
  {
    name: "박세영 목사",
    role: "말씀 강해 · 시편 46",
    init: "박",
    talks: 2,
    affiliation: "광림감리교회",
  },
  {
    name: "김명숙 사모",
    role: "대담 · 사역자의 가정",
    init: "김",
    talks: 1,
    affiliation: "한신대학교",
  },
];

export type ScheduleItem = {
  time: string;
  what: string;
  place: string;
  tag: string;
  highlight?: boolean;
};

export type ScheduleDay = {
  day: string;
  date: string;
  items: ReadonlyArray<ScheduleItem>;
};

export const TR_SCHEDULE: ReadonlyArray<ScheduleDay> = [
  {
    day: "DAY 1",
    date: "5.18 (월)",
    items: [
      { time: "14:00", what: "등록 및 입소", place: "컨벤션 로비", tag: "체크인" },
      { time: "17:00", what: "저녁 식사", place: "대식당", tag: "식사" },
      {
        time: "19:30",
        what: "개회예배 · 키노트 1강",
        place: "본관 채플",
        tag: "예배",
        highlight: true,
      },
      { time: "21:30", what: "소그룹 첫 만남", place: "세미나실 A·B·C·D", tag: "교제" },
    ],
  },
  {
    day: "DAY 2",
    date: "5.19 (화)",
    items: [
      { time: "06:00", what: "새벽기도", place: "본관 채플", tag: "기도" },
      {
        time: "09:30",
        what: "말씀 강해 1",
        place: "본관 채플",
        tag: "강의",
        highlight: true,
      },
      { time: "11:00", what: "소그룹 나눔", place: "세미나실", tag: "교제" },
      { time: "14:00", what: "대담 · “사역자의 가정”", place: "컨벤션 홀", tag: "대담" },
      { time: "16:00", what: "자유 산책 · 묵상", place: "평창 자락길", tag: "쉼" },
      {
        time: "19:30",
        what: "말씀 강해 2 · 키노트 2강",
        place: "본관 채플",
        tag: "예배",
        highlight: true,
      },
    ],
  },
  {
    day: "DAY 3",
    date: "5.20 (수)",
    items: [
      { time: "06:30", what: "새벽기도 · 합심기도", place: "본관 채플", tag: "기도" },
      {
        time: "09:30",
        what: "키노트 3강 · 결단",
        place: "본관 채플",
        tag: "예배",
        highlight: true,
      },
      { time: "11:30", what: "폐회 및 파송", place: "본관 채플", tag: "예배" },
      { time: "12:30", what: "점심 · 해산", place: "대식당", tag: "식사" },
    ],
  },
];

export type ArchiveYear = {
  y: string;
  items: ReadonlyArray<string>;
};

export const TR_ARCHIVE: ReadonlyArray<ArchiveYear> = [
  { y: "2025", items: ["가을 · 광야의 은혜를 기억하다", "봄 · 다시, 처음의 자리에서"] },
  { y: "2024", items: ["가을 · 깊은 데로 가서", "봄 · 말씀의 사람으로"] },
  { y: "2023", items: ["가을 · 작은 자의 길", "봄 · 함께 부르심"] },
];
