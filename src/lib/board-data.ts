/**
 * 자유게시판 공용 타입 + 정적 보조 데이터.
 * 게시글·카테고리는 server/services/board.ts 에서 실데이터로 제공한다.
 * 여기에는 타입 정의와 정적 데이터(HOT·태그·말씀·정렬 옵션)만 남긴다.
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
  lastReply?: { name: string; text: string; when: string };
};

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
