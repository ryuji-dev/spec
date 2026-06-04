import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { posts, comments, attachments, users } from "@/server/db/schema";
import {
  toTrainingPostView,
  TRAINING_CATEGORIES_KO,
  CATEGORY_EN,
  formatAuthor,
  formatDate,
  type TrainingRow,
} from "@/lib/training";
import type {
  TrainingPost,
  TrainingCategory,
} from "@/lib/training-data";

const SECTION = "training" as const;

// 목록 행 공통 SELECT (작성자 조인 + 댓글/첨부 카운트 서브쿼리)
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
      commentCount: sql<number>`(select count(*)::int from ${comments} c where c.post_id = ${posts.id})`,
      attachCount: sql<number>`(select count(*)::int from ${attachments} a where a.post_id = ${posts.id})`,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)));
}

export type TrainingListData = {
  pinned: TrainingPost | null;
  posts: TrainingPost[];
  categories: TrainingCategory[];
};

export async function getTrainingListData(): Promise<TrainingListData> {
  const now = new Date();
  const rows = await baseRows().orderBy(desc(posts.isPinned), desc(posts.createdAt));

  let pinned: TrainingPost | null = null;
  const list: TrainingPost[] = [];
  for (const r of rows) {
    const view = toTrainingPostView(r as TrainingRow, now);
    if (r.isPinned && !pinned) pinned = view;
    else list.push(view);
  }

  // 카테고리 카운트 ('전체' + 5개)
  const counts = await getDb()
    .select({ category: posts.category, n: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .groupBy(posts.category);
  const byCat = new Map(counts.map((c) => [c.category, c.n]));
  const total = counts.reduce((s, c) => s + c.n, 0);
  const categories: TrainingCategory[] = [
    { ko: "전체", en: "ALL", count: total },
    ...TRAINING_CATEGORIES_KO.map((ko) => ({
      ko,
      en: CATEGORY_EN[ko],
      count: byCat.get(ko) ?? 0,
    })),
  ];

  return { pinned, posts: list, categories };
}

export type TrainingDetail = {
  id: string;
  category: string | null;
  title: string;
  body: string | null;
  author: string;
  date: string;
  views: number;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
  comments: { id: string; authorId: string | null; author: string; date: string; body: string }[];
};

export async function getTrainingPost(id: string): Promise<TrainingDetail | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
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
  const r = rows[0];
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

  const cms = await db
    .select({
      id: comments.id,
      authorId: comments.authorId,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorTitle: users.title,
    })
    .from(comments)
    .leftJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.postId, id))
    .orderBy(comments.createdAt);

  return {
    id: r.id,
    category: r.category,
    title: r.title,
    body: r.body,
    author: formatAuthor(r.authorName, r.authorTitle),
    date: formatDate(r.createdAt),
    views: r.viewCount,
    attachments: atts.map((a) => ({ ...a, sizeBytes: Number(a.sizeBytes) })),
    comments: cms.map((c) => ({
      id: c.id,
      authorId: c.authorId,
      author: formatAuthor(c.authorName, c.authorTitle),
      date: formatDate(c.createdAt),
      body: c.body,
    })),
  };
}

export async function incrementTrainingView(id: string): Promise<void> {
  await getDb()
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)));
}

export type TrainingEditData = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  body: string | null;
  isPinned: boolean;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
};

export async function getTrainingPostForEdit(id: string): Promise<TrainingEditData | null> {
  const db = getDb();
  const [r] = await db
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
  return { ...r, attachments: atts.map((a) => ({ ...a, sizeBytes: Number(a.sizeBytes) })) };
}
