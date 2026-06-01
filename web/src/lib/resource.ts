// 자료공유 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import type {
  ResourceFile,
  ResourceFileType,
  ResourceFileCategory,
  ResourceCategoryEn,
} from "./resources-data";

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

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// bytes → "12.4 MB" / "186 MB" / "843 KB"
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
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
  const name = row.authorName ?? "익명";
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
    by: row.authorTitle ? `${name} ${row.authorTitle}` : name,
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}
