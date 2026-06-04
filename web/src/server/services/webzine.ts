import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { posts, users } from "@/server/db/schema";
import {
  toWebzineArticleView,
  toWebzineFeaturedView,
  WEBZINE_CATEGORIES_KO,
  WZ_CATEGORY_EN,
  readingTime,
  formatAuthor,
  formatDate,
  type WebzineRow,
} from "@/lib/webzine";
import type {
  WebzineArticle,
  WebzineFeatured,
  WebzineCategory,
} from "@/lib/webzine-data";

const SECTION = "webzine" as const;

// 목록 행 공통 SELECT (작성자 조인 + 본문 길이)
function baseRows() {
  const db = getDb();
  return db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      isPinned: posts.isPinned,
      authorName: users.name,
      authorTitle: users.title,
      bodyLength: sql<number>`coalesce(length(${posts.body}),0)`,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)));
}

export type WebzineListData = {
  featured: WebzineFeatured | null;
  articles: WebzineArticle[];
  categories: WebzineCategory[];
};

export async function getWebzineListData(): Promise<WebzineListData> {
  const rows = await baseRows().orderBy(desc(posts.isPinned), desc(posts.createdAt));

  // 첫 isPinned 행을 featured로, 없으면 첫 행을. 나머지는 일반 기사로.
  let featuredRow: (typeof rows)[number] | null = null;
  for (const r of rows) {
    if (r.isPinned) {
      featuredRow = r;
      break;
    }
  }
  if (!featuredRow && rows.length > 0) featuredRow = rows[0];

  const featured = featuredRow
    ? toWebzineFeaturedView(featuredRow as WebzineRow)
    : null;
  const articles = rows
    .filter((r) => r !== featuredRow)
    .map((r) => toWebzineArticleView(r as WebzineRow));

  // 카테고리별 카운트 (WEBZINE_CATEGORIES_KO 순서)
  const counts = await getDb()
    .select({ category: posts.category, n: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .groupBy(posts.category);
  const byCat = new Map(counts.map((c) => [c.category, c.n]));
  const categories: WebzineCategory[] = WEBZINE_CATEGORIES_KO.map((ko) => ({
    ko,
    en: WZ_CATEGORY_EN[ko],
    count: byCat.get(ko) ?? 0,
  }));

  return { featured, articles, categories };
}

export type WebzineArticleDetail = {
  id: string;
  tag: string;
  cat: string;
  title: string;
  subtitle: string;
  body: string | null;
  author: string;
  authorRole: string;
  date: string;
  read: string;
  viewCount: number;
};

export async function getWebzineArticle(
  id: string,
): Promise<WebzineArticleDetail | null> {
  const db = getDb();
  const [r] = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      body: posts.body,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorTitle: users.title,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .limit(1);
  if (!r) return null;

  const cat = (
    r.category && r.category in WZ_CATEGORY_EN ? r.category : "에세이"
  ) as keyof typeof WZ_CATEGORY_EN;

  return {
    id: r.id,
    tag: WZ_CATEGORY_EN[cat],
    cat,
    title: r.title,
    subtitle: r.excerpt ?? "",
    body: r.body,
    author: formatAuthor(r.authorName, r.authorTitle),
    authorRole: r.authorTitle ?? "",
    date: formatDate(r.createdAt),
    read: readingTime(r.body?.length ?? 0),
    viewCount: r.viewCount,
  };
}

export async function incrementWebzineView(id: string): Promise<void> {
  await getDb()
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)));
}

export type WebzineEditData = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  body: string | null;
  isPinned: boolean;
};

export async function getWebzineArticleForEdit(
  id: string,
): Promise<WebzineEditData | null> {
  const [r] = await getDb()
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      body: posts.body,
      isPinned: posts.isPinned,
    })
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.section, SECTION)))
    .limit(1);
  return r ?? null;
}
