/**
 * 자유게시판 mock 데이터.
 * 백엔드 연동 전까지 사용. 디자인 원본 `_design/.../community.jsx`의 CM_* 상수와 동일.
 */

export type BoardCategoryKo =
  | "전체"
  | "나눔"
  | "Q&A"
  | "기도"
  | "토론"
  | "소식";
export type BoardCategoryEn =
  | "ALL"
  | "STORIES"
  | "QUESTIONS"
  | "PRAYER"
  | "DISCUSS"
  | "NEWS";

export type BoardCategory = {
  ko: BoardCategoryKo;
  en: BoardCategoryEn;
  count: number;
  hint?: string;
};

export const CM_CATEGORIES: ReadonlyArray<BoardCategory> = [
  { ko: "전체", en: "ALL", count: 384 },
  { ko: "나눔", en: "STORIES", count: 124, hint: "일상의 작은 이야기" },
  { ko: "Q&A", en: "QUESTIONS", count: 86, hint: "궁금한 것을 묻다" },
  { ko: "기도", en: "PRAYER", count: 92, hint: "함께 기도하는 자리" },
  { ko: "토론", en: "DISCUSS", count: 42, hint: "진솔한 의견 나눔" },
  { ko: "소식", en: "NEWS", count: 40, hint: "교회·노회 소식" },
];

export type BoardImageKind = "sunset" | "worship" | "congrats";
export type BoardFeedKind = "story" | "prayer" | "question" | "discuss" | "news";

export type HotThread = {
  id: string;
  cat: Exclude<BoardCategoryKo, "전체">;
  heat: number;
  title: string;
  excerpt: string;
  author: string;
  church: string;
  avatar: string;
  date: string;
  comments: number;
  likes: number;
  views: number;
  reactions: Readonly<Record<string, number>>;
  lastReply: { name: string; text: string; when: string };
};

export const CM_HOT: ReadonlyArray<HotThread> = [
  {
    id: "101",
    cat: "토론",
    heat: 92,
    title: "주일학교 출석 감소, 우리 교회만의 문제일까요?",
    excerpt:
      "코로나 이후 회복이 더딘 부서가 많은 것 같습니다. 통계적으로 우리 노회 안에서는 어떤지, 또 회복 사례가 있다면 공유 부탁드립니다.",
    author: "김도현 목사",
    church: "서경중앙교회",
    avatar: "김",
    date: "4시간 전",
    comments: 47,
    likes: 128,
    views: 1843,
    reactions: { "🙏": 34, "💭": 22, "❤️": 18 },
    lastReply: {
      name: "이수민",
      text: "저희도 비슷한 고민이에요. 작년 가을부터 조금씩...",
      when: "12분 전",
    },
  },
  {
    id: "102",
    cat: "Q&A",
    heat: 78,
    title: "중고등부 큐티 교재, 요즘 뭐 쓰고 계신가요?",
    excerpt:
      "IVP 청소년 큐티가 절판되어서 새 교재를 찾고 있습니다. 학생들이 잘 따라오는 교재 추천해주세요.",
    author: "박혜진 전도사",
    church: "강서동산교회",
    avatar: "박",
    date: "7시간 전",
    comments: 31,
    likes: 64,
    views: 892,
    reactions: { "👀": 41, "🙋": 12 },
    lastReply: {
      name: "한경수",
      text: "CGN 청소년 큐티 같이 보고 있어요. 한번...",
      when: "38분 전",
    },
  },
];

export type FeedPost = {
  id: string;
  cat: Exclude<BoardCategoryKo, "전체">;
  kind: BoardFeedKind;
  title: string;
  excerpt: string;
  author: string;
  church: string;
  avatar: string;
  date: string;
  comments: number;
  likes: number;
  likedByMe?: boolean;
  views: number;
  image?: BoardImageKind;
  isNew?: boolean;
  prayerCount?: number;
  isAnswered?: boolean;
};

export const CM_FEED: ReadonlyArray<FeedPost> = [
  {
    id: "1",
    cat: "나눔",
    kind: "story",
    title: "아이가 처음으로 “저도 기도해도 돼요?”라고 물었던 날",
    excerpt:
      "6살 민준이가 예배 중에 조용히 손을 들었습니다. 가르치는 자리에서 가끔 마주치는 작은 순간들에 대한 이야기.",
    author: "오은혜 집사",
    church: "평안교회",
    avatar: "오",
    date: "2시간 전",
    comments: 41,
    likes: 156,
    views: 822,
    image: "sunset",
    isNew: true,
  },
  {
    id: "2",
    cat: "기도",
    kind: "prayer",
    title: "봄학기 새가족 한 분 한 분을 위해 기도 부탁드립니다",
    excerpt:
      "이번 학기에 처음 교회에 발걸음을 옮기신 7가정. 마음의 문이 활짝 열리도록 함께 기도해주세요.",
    author: "정민호 목사",
    church: "강서동산교회",
    avatar: "정",
    date: "3시간 전",
    comments: 28,
    likes: 94,
    views: 412,
    prayerCount: 156,
    isNew: true,
  },
  {
    id: "3",
    cat: "Q&A",
    kind: "question",
    title: "교사 헌신예배 — 어떤 형식이 좋을까요?",
    excerpt:
      "올해 처음 헌신예배를 기획하게 되었습니다. 다른 교회에서는 보통 어떻게 진행하시는지 사례 공유 부탁드려요.",
    author: "이수민 전도사",
    church: "은혜로교회",
    avatar: "이",
    date: "5시간 전",
    comments: 19,
    likes: 42,
    views: 634,
    isAnswered: true,
  },
  {
    id: "4",
    cat: "소식",
    kind: "news",
    title: "서경교회 청년부 봄 맞이 워십나잇 — 4월 27일",
    excerpt:
      "노회 청년들이 함께 모이는 워십나잇이 열립니다. 누구나 환영, 사전 신청 없이 오셔도 됩니다.",
    author: "편집부",
    church: "서경교회",
    avatar: "편",
    date: "어제",
    comments: 12,
    likes: 38,
    views: 1024,
    image: "worship",
  },
  {
    id: "5",
    cat: "나눔",
    kind: "story",
    title: "“선생님은 왜 교회 다녀요?” — 8살의 질문 앞에서",
    excerpt:
      "준비되지 않은 질문이 더 무겁게 다가올 때가 있습니다. 그 날의 답을 찾으며 적어 본 메모.",
    author: "김민서 집사",
    church: "서경중앙교회",
    avatar: "김",
    date: "어제",
    comments: 33,
    likes: 87,
    views: 567,
  },
  {
    id: "6",
    cat: "토론",
    kind: "discuss",
    title: "주일학교 부서 통합 — 작은 교회의 경험을 듣고 싶습니다",
    excerpt:
      "학생 수 감소로 부서 통합을 검토 중입니다. 통합 후의 장단점, 운영상 어려움을 솔직히 들어보고 싶어요.",
    author: "박세영 목사",
    church: "소망교회",
    avatar: "박",
    date: "2일 전",
    comments: 24,
    likes: 56,
    views: 712,
  },
  {
    id: "7",
    cat: "Q&A",
    kind: "question",
    title: "아동부 절기 행사, 부모 참여형으로 바꾸신 분 계신가요?",
    excerpt:
      "아이만 참여하던 부활절 행사를 가족 단위로 전환하려 합니다. 시도해 보신 분들의 후기 부탁드립니다.",
    author: "한지원 전도사",
    church: "평안교회",
    avatar: "한",
    date: "2일 전",
    comments: 16,
    likes: 31,
    views: 498,
  },
  {
    id: "8",
    cat: "소식",
    kind: "news",
    title: "제27회 성경고사 본선 진행 결과 — 우승: 강서동산교회",
    excerpt:
      "5월 17일에 진행된 본선에서 강서동산교회 중등팀이 첫 우승을 차지했습니다. 모든 참가자들 수고 많으셨습니다.",
    author: "편집부",
    church: "교육위원회",
    avatar: "편",
    date: "3일 전",
    comments: 28,
    likes: 142,
    views: 2104,
    image: "congrats",
  },
  {
    id: "9",
    cat: "기도",
    kind: "prayer",
    title: "입원 중이신 한경수 목사님을 위해 함께 기도해주세요",
    excerpt:
      "간단한 시술로 잠시 사역을 쉬고 계십니다. 빠른 회복과 평안을 위해 마음 모아주시면 감사하겠습니다.",
    author: "서기 박혜진 전도사",
    church: "서경교회",
    avatar: "박",
    date: "3일 전",
    comments: 8,
    likes: 0,
    views: 386,
    prayerCount: 287,
  },
  {
    id: "10",
    cat: "나눔",
    kind: "story",
    title: "12년 만에 다시 만난 옛 제자가 청년부 리더가 되어 있었습니다",
    excerpt:
      "작은 교회를 잠시 떠나 있다 돌아왔는데, 어릴 때 가르쳤던 아이가 어느새 청년부 리더로 서 있더군요.",
    author: "윤정희 권사",
    church: "소망교회",
    avatar: "윤",
    date: "4일 전",
    comments: 52,
    likes: 218,
    views: 1432,
  },
];

export type ActiveMember = {
  name: string;
  church: string;
  posts: number;
  init: string;
};


export type TrendingTag = {
  tag: string;
  count: number;
};

export const CM_TAGS: ReadonlyArray<TrendingTag> = [
  { tag: "주일학교", count: 84 },
  { tag: "큐티", count: 62 },
  { tag: "교사", count: 58 },
  { tag: "청년부", count: 47 },
  { tag: "예배", count: 41 },
  { tag: "수련회", count: 38 },
  { tag: "소그룹", count: 34 },
  { tag: "심방", count: 27 },
];

export const CM_VERSE = {
  ref: "시편 133:1",
  text: "보라 형제가 연합하여 동거함이 어찌 그리 선하고 아름다운고",
} as const;

export type BoardSort = "recent" | "hot" | "comments";

export const BOARD_SORTS: ReadonlyArray<{ v: BoardSort; label: string }> = [
  { v: "recent", label: "최신" },
  { v: "hot", label: "인기" },
  { v: "comments", label: "댓글많은" },
];

export type BoardStat = { k: string; l: string };

// 헤더 통계 실데이터 — server/services/board.ts 에서 집계해 주입.
export type BoardStats = {
  total: number;
  today: number;
  activeMembers: number;
};
