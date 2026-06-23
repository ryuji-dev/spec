// 신학원웹진 게시판 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import { formatDate, formatAuthor } from "./format.ts";
import type {
  WebzineArticle,
  WebzineFeatured,
  WebzineArticleCoverType,
  WebzineBackIssue,
} from "./webzine-data";

// 외부에서 @/lib/webzine 경로로 import하던 호환 유지
export { formatDate, formatAuthor } from "./format.ts";

export const WEBZINE_CATEGORIES_KO = [
  "신학산책",
  "현장에서",
  "북리뷰",
  "에세이",
  "교회사",
  "대담",
] as const;

export type WebzineCategoryKo = (typeof WEBZINE_CATEGORIES_KO)[number];

// 한국어 카테고리 → 영문 태그 (디자인 뷰모델 tag 용)
export const WZ_CATEGORY_EN: Record<WebzineCategoryKo, string> = {
  신학산책: "THEOLOGY",
  현장에서: "FIELD",
  북리뷰: "REVIEW",
  에세이: "ESSAY",
  교회사: "HISTORY",
  대담: "DIALOGUE",
};

// 한국어 카테고리 → 일러스트 커버 종류
export const WZ_CATEGORY_COVER: Record<WebzineCategoryKo, WebzineArticleCoverType> = {
  신학산책: "book",
  현장에서: "rural",
  북리뷰: "book2",
  에세이: "child",
  교회사: "history",
  대담: "dialogue",
};

// 본문 길이(문자 수) → 예상 읽기 시간. 분당 약 350자 기준, 최소 1분.
export function readingTime(len: number): string {
  return `${Math.max(1, Math.round(len / 350))}분`;
}

// 정적 현재호 라벨 — featured 뷰모델 issue 용
export const CURRENT_ISSUE = "Vol. 24 · 2026 봄호";

// 서비스가 만든 평면 행
export type WebzineRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  isPinned: boolean;
  authorName: string | null;
  authorTitle: string | null;
  bodyLength: number;
};

// 유효 카테고리면 그대로, 아니면 "에세이" 폴백
function resolveCategory(category: string | null): WebzineCategoryKo {
  return (
    category && category in WZ_CATEGORY_EN ? category : "에세이"
  ) as WebzineCategoryKo;
}

// 평면 행 → 디자인 WebzineArticle 뷰모델
export function toWebzineArticleView(row: WebzineRow): WebzineArticle {
  const cat = resolveCategory(row.category);
  return {
    id: row.id,
    cat,
    tag: WZ_CATEGORY_EN[cat],
    title: row.title,
    excerpt: row.excerpt ?? "",
    author: formatAuthor(row.authorName, row.authorTitle),
    date: formatDate(row.createdAt),
    read: readingTime(row.bodyLength),
    cover: WZ_CATEGORY_COVER[cat],
  };
}

// 평면 행 → 디자인 WebzineFeatured 뷰모델 (커버 essay)
export function toWebzineFeaturedView(row: WebzineRow): WebzineFeatured {
  const cat = resolveCategory(row.category);
  return {
    id: row.id,
    issue: CURRENT_ISSUE,
    category: WZ_CATEGORY_EN[cat],
    title: row.title,
    subtitle: row.excerpt ?? "",
    author: formatAuthor(row.authorName, row.authorTitle),
    authorRole: row.authorTitle ?? "",
    date: formatDate(row.createdAt),
    read: readingTime(row.bodyLength),
    cover: "wilderness",
  };
}

// 평면 행 → "지난 호" 카드 뷰모델("지난 글"로 재해석).
// vol=EN 태그, issue=한글 카테고리, theme=제목, date=작성일.
export function toWebzineBackIssueView(row: WebzineRow): WebzineBackIssue {
  const cat = resolveCategory(row.category);
  return {
    id: row.id,
    vol: WZ_CATEGORY_EN[cat],
    issue: cat,
    theme: row.title,
    date: formatDate(row.createdAt),
  };
}
