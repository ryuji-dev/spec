import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { posts, comments, users } from "@/server/db/schema";
import { formatDate, formatAuthor } from "@/lib/format";
import {
  toFeedPostView,
  categoryToKind,
  BOARD_CATEGORIES_KO,
  BOARD_CATEGORY_EN,
  type BoardRow,
} from "@/lib/board";
import type { FeedPost, BoardCategory } from "@/lib/board-data";

const SECTION = "board" as const;

export type BoardListData = {
  posts: FeedPost[];
  categories: BoardCategory[];
};

export async function getBoardListData(): Promise<BoardListData> {
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
      authorChurch: users.church,
      commentCount: sql<number>`(select count(*)::int from ${comments} c where c.post_id = ${posts.id})`,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .orderBy(desc(posts.createdAt));
  const list = rows.map((r) => toFeedPostView({ ...r, likeCount: 0 } as BoardRow, now));

  const counts = await db
    .select({ category: posts.category, n: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .groupBy(posts.category);
  const byCat = new Map(counts.map((c) => [c.category, c.n]));
  const total = counts.reduce((s, c) => s + c.n, 0);
  const categories: BoardCategory[] = [
    { ko: "전체", en: "ALL", count: total },
    ...BOARD_CATEGORIES_KO.map((ko) => ({ ko, en: BOARD_CATEGORY_EN[ko], count: byCat.get(ko) ?? 0 })),
  ];

  return { posts: list, categories };
}

export type BoardDetail = {
  id: string;
  category: string | null;
  kind: string;
  title: string;
  body: string | null;
  author: string;
  church: string;
  date: string;
  views: number;
  likes: number;
  authorId: string | null;
  comments: { id: string; authorId: string | null; author: string; date: string; body: string }[];
};

export async function getBoardPost(id: string): Promise<BoardDetail | null> {
  const db = getDb();
  const [r] = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      body: posts.body,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.name,
      authorChurch: users.church,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .limit(1);
  if (!r) return null;
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
    kind: categoryToKind(r.category),
    title: r.title,
    body: r.body,
    author: r.authorName ?? "익명",
    church: r.authorChurch ?? "",
    date: formatDate(r.createdAt),
    views: r.viewCount,
    likes: 0,
    authorId: r.authorId,
    comments: cms.map((c) => ({
      id: c.id,
      authorId: c.authorId,
      author: formatAuthor(c.authorName, c.authorTitle),
      date: formatDate(c.createdAt),
      body: c.body,
    })),
  };
}

export async function incrementBoardView(id: string): Promise<void> {
  await getDb()
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)));
}
