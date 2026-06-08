// 교육위원회 게시판 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import { formatDate, formatAuthor } from "./format.ts";
import type {
  Post,
  PostCategoryKo,
  PostCategoryEn,
} from "./committee-data";

// 외부에서 @/lib/committee 경로로 import하던 호환 유지
export { formatDate, formatAuthor } from "./format.ts";

// 한국어 카테고리 → 영문 라벨 (디자인 뷰모델 catEn 용)
export const CATEGORY_EN: Record<PostCategoryKo, PostCategoryEn> = {
  공지: "NOTICE",
  회의록: "MINUTES",
  수련회: "TRAINING",
  자료실: "LIBRARY",
  나눔: "SHARE",
};

export const COMMITTEE_CATEGORIES_KO: PostCategoryKo[] = [
  "공지",
  "회의록",
  "수련회",
  "자료실",
  "나눔",
];

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// 서비스가 만든 평면 행 → 디자인 Post 뷰모델
export type CommitteeRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  authorName: string | null;
  authorTitle: string | null;
  commentCount: number;
  attachCount: number;
};

export function toCommitteePostView(row: CommitteeRow, now: Date): Post {
  const cat = (
    row.category && row.category in CATEGORY_EN ? row.category : "나눔"
  ) as PostCategoryKo;
  const name = row.authorName ?? "익명";
  return {
    id: row.id,
    cat,
    catEn: CATEGORY_EN[cat],
    title: row.title,
    excerpt: row.excerpt ?? "",
    author: formatAuthor(row.authorName, row.authorTitle),
    authorInit: name.slice(0, 1),
    date: formatDate(row.createdAt),
    views: row.viewCount,
    comments: row.commentCount,
    attach: row.attachCount > 0 ? row.attachCount : undefined,
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}
