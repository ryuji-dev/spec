// 자유게시판 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import { formatDate } from "./format.ts";
import type {
  FeedPost,
  BoardCategoryKo,
  BoardCategoryEn,
  BoardFeedKind,
  BoardSort,
  HotThread,
} from "./board-data";

type Cat = Exclude<BoardCategoryKo, "전체">;

export const BOARD_CATEGORY_EN: Record<Cat, BoardCategoryEn> = {
  나눔: "STORIES",
  "Q&A": "QUESTIONS",
  기도: "PRAYER",
  토론: "DISCUSS",
  소식: "NEWS",
};

export const BOARD_CATEGORIES_KO: Cat[] = ["나눔", "Q&A", "기도", "토론", "소식"];

const CATEGORY_KIND: Record<Cat, BoardFeedKind> = {
  나눔: "story",
  기도: "prayer",
  "Q&A": "question",
  토론: "discuss",
  소식: "news",
};

export function categoryToKind(cat: string | null): BoardFeedKind {
  return cat && cat in CATEGORY_KIND ? CATEGORY_KIND[cat as Cat] : "story";
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type BoardRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  authorName: string | null;
  authorChurch: string | null;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
};

export function toFeedPostView(row: BoardRow, now: Date): FeedPost {
  const cat = (row.category && row.category in CATEGORY_KIND ? row.category : "나눔") as Cat;
  const name = row.authorName ?? "익명";
  return {
    id: row.id,
    cat,
    kind: categoryToKind(cat),
    title: row.title,
    excerpt: row.excerpt ?? "",
    author: name,
    church: row.authorChurch ?? "",
    avatar: name.slice(0, 1),
    date: formatDate(row.createdAt),
    comments: row.commentCount,
    likes: row.likeCount,
    likedByMe: row.likedByMe,
    views: row.viewCount,
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}

// 자유게시판 목록 정렬 — recent는 입력 순서(서비스가 created_at desc로 제공) 유지,
// hot/comments만 복사본을 정렬(안정 정렬이라 동점은 최신순 유지).
export function sortFeedPosts(posts: FeedPost[], sort: BoardSort): FeedPost[] {
  if (sort === "hot") {
    return [...posts].sort((a, b) => b.likes - a.likes || b.views - a.views);
  }
  if (sort === "comments") {
    return [...posts].sort((a, b) => b.comments - a.comments || b.likes - a.likes);
  }
  return posts;
}

// 인기글 파생용 평면 행
export type HotRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  authorName: string | null;
  authorChurch: string | null;
  commentCount: number;
  likeCount: number;
};

// 참여 점수 가중치
export const HOT_WEIGHT = { comment: 10, like: 5 } as const;

export function hotScore(row: {
  viewCount: number;
  commentCount: number;
  likeCount: number;
}): number {
  return (
    row.viewCount +
    row.commentCount * HOT_WEIGHT.comment +
    row.likeCount * HOT_WEIGHT.like
  );
}

// 평면 행 → 인기글 뷰모델. heat는 최고 점수 대비 0~100 정규화.
export function toHotThreadView(
  row: HotRow,
  score: number,
  maxScore: number,
  lastReply?: { name: string; text: string; when: string },
): HotThread {
  const cat = (row.category && row.category in CATEGORY_KIND ? row.category : "나눔") as Cat;
  const name = row.authorName ?? "익명";
  return {
    id: row.id,
    cat,
    heat: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    title: row.title,
    excerpt: row.excerpt ?? "",
    author: name,
    church: row.authorChurch ?? "",
    avatar: name.slice(0, 1),
    date: formatDate(row.createdAt),
    comments: row.commentCount,
    likes: row.likeCount,
    views: row.viewCount,
    ...(lastReply ? { lastReply } : {}),
  };
}
