// 자유게시판 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import { formatDate } from "./format.ts";
import type {
  FeedPost,
  BoardCategoryKo,
  BoardCategoryEn,
  BoardFeedKind,
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
    views: row.viewCount,
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}
