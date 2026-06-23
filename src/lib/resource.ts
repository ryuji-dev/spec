// 자료공유 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import { formatDate, formatBytes, formatAuthor } from "./format.ts";
import type {
  ResourceFile,
  ResourceFileType,
  ResourceFileCategory,
  ResourceCategoryEn,
  ResourcesSort,
} from "./resources-data";

// 상세 페이지가 @/lib/resource 경로로 import하던 호환 유지
export { formatDate, formatBytes } from "./format.ts";

export const RESOURCE_CATEGORY_EN: Record<ResourceFileCategory, ResourceCategoryEn> = {
  설교PPT: "SLIDES",
  악보: "SCORES",
  교안: "CURRICULUM",
  문서: "DOCS",
  영상: "VIDEO",
  디자인: "DESIGN",
};

const CATEGORY_TYPE: Record<ResourceFileCategory, ResourceFileType> = {
  설교PPT: "ppt",
  악보: "score",
  교안: "pdf",
  문서: "doc",
  영상: "video",
  디자인: "image",
};

export const RESOURCE_CATEGORIES_KO: ResourceFileCategory[] = [
  "설교PPT", "악보", "교안", "문서", "영상", "디자인",
];

export function categoryToType(cat: string | null): ResourceFileType {
  return cat && cat in CATEGORY_TYPE
    ? CATEGORY_TYPE[cat as ResourceFileCategory]
    : "doc";
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type ResourceRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  authorName: string | null;
  authorTitle: string | null;
  totalBytes: number;
};

export function toResourceFileView(row: ResourceRow, now: Date): ResourceFile {
  const cat = (row.category && row.category in CATEGORY_TYPE
    ? row.category
    : "문서") as ResourceFileCategory;
  return {
    id: row.id,
    type: categoryToType(cat),
    cat,
    title: row.title,
    sub: row.excerpt ?? "",
    size: formatBytes(row.totalBytes),
    date: formatDate(row.createdAt),
    downloads: row.viewCount,
    by: formatAuthor(row.authorName, row.authorTitle),
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}

// 자료실 목록 정렬 — recent는 입력 순서(서비스가 created_at desc로 제공) 유지,
// downloads/name만 복사본을 정렬(안정 정렬이라 동점은 최신순 유지).
export function sortResourceFiles(
  files: ResourceFile[],
  sort: ResourcesSort,
): ResourceFile[] {
  if (sort === "downloads") {
    return [...files].sort((a, b) => b.downloads - a.downloads);
  }
  if (sort === "name") {
    return [...files].sort((a, b) => a.title.localeCompare(b.title, "ko"));
  }
  return files;
}
