// 교역자수련회 게시판 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import { formatDate, formatAuthor } from "./format.ts";
import type {
  TrainingPost,
  TrainingCategoryKo,
  TrainingCategoryEn,
} from "./training-data";

// 외부에서 @/lib/training 경로로 import하던 호환 유지
export { formatDate, formatAuthor } from "./format.ts";

// 한국어 카테고리 → 영문 라벨 (디자인 뷰모델 catEn 용)
export const CATEGORY_EN: Record<TrainingCategoryKo, TrainingCategoryEn> = {
  예정: "UPCOMING",
  신청: "OPEN",
  후기: "REVIEW",
  강의자료: "MATERIALS",
  "Q&A": "QNA",
};

export const TRAINING_CATEGORIES_KO: TrainingCategoryKo[] = [
  "예정",
  "신청",
  "후기",
  "강의자료",
  "Q&A",
];

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// 서비스가 만든 평면 행 → 디자인 TrainingPost 뷰모델
export type TrainingRow = {
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

export function toTrainingPostView(row: TrainingRow, now: Date): TrainingPost {
  const cat = (
    row.category && row.category in CATEGORY_EN ? row.category : "Q&A"
  ) as TrainingCategoryKo;
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
