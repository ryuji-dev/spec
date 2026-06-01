import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { posts, attachments, users } from "@/server/db/schema";
import {
  toResourceFileView,
  categoryToType,
  RESOURCE_CATEGORIES_KO,
  RESOURCE_CATEGORY_EN,
  formatDate,
  type ResourceRow,
} from "@/lib/resource";
import type {
  ResourceFile,
  ResourceCategory,
  ResourceTopItem,
} from "@/lib/resources-data";

const SECTION = "resource" as const;

export type ResourceListData = {
  files: ResourceFile[];
  categories: ResourceCategory[];
  top: ResourceTopItem[];
};

export async function getResourceListData(): Promise<ResourceListData> {
  const now = new Date();
  const db = getDb();

  const rows = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorTitle: users.title,
      totalBytes: sql<number>`coalesce((select sum(a.size_bytes) from ${attachments} a where a.post_id = ${posts.id}),0)::bigint`,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .orderBy(desc(posts.createdAt));
  const files = rows.map((r) =>
    toResourceFileView({ ...r, totalBytes: Number(r.totalBytes) } as ResourceRow, now),
  );

  const counts = await db
    .select({ category: posts.category, n: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .groupBy(posts.category);
  const byCat = new Map(counts.map((c) => [c.category, c.n]));
  const total = counts.reduce((s, c) => s + c.n, 0);
  const categories: ResourceCategory[] = [
    { ko: "전체", en: "ALL", count: total, icon: "all" },
    ...RESOURCE_CATEGORIES_KO.map((ko) => ({
      ko,
      en: RESOURCE_CATEGORY_EN[ko],
      count: byCat.get(ko) ?? 0,
      icon: categoryToType(ko),
    })),
  ];

  const pop = await db
    .select({ title: posts.title, downloads: posts.viewCount, category: posts.category })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .orderBy(desc(posts.viewCount))
    .limit(5);
  const top: ResourceTopItem[] = pop.map((p, i) => ({
    rank: i + 1,
    title: p.title,
    downloads: p.downloads,
    type: categoryToType(p.category),
  }));

  return { files, categories, top };
}

export type ResourceDetail = {
  id: string;
  category: string | null;
  title: string;
  sub: string;
  by: string;
  date: string;
  downloads: number;
  files: { id: string; name: string; sizeBytes: number; mime: string }[];
};

export async function getResourcePost(id: string): Promise<ResourceDetail | null> {
  const db = getDb();
  const [r] = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
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
  const atts = await db
    .select({
      id: attachments.id,
      name: attachments.originalName,
      sizeBytes: attachments.sizeBytes,
      mime: attachments.mime,
    })
    .from(attachments)
    .where(eq(attachments.postId, id));
  const name = r.authorName ?? "익명";
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    sub: r.excerpt ?? "",
    by: r.authorTitle ? `${name} ${r.authorTitle}` : name,
    date: formatDate(r.createdAt),
    downloads: r.viewCount,
    files: atts.map((a) => ({ ...a, sizeBytes: Number(a.sizeBytes) })),
  };
}

export async function incrementResourceDownload(postId: string): Promise<void> {
  await getDb()
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(and(eq(posts.id, postId), eq(posts.section, SECTION)));
}
