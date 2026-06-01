import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { posts, comments, attachments, users } from "@/server/db/schema";
import {
  toCommitteePostView,
  COMMITTEE_CATEGORIES_KO,
  CATEGORY_EN,
  type CommitteeRow,
} from "@/lib/committee";
import type {
  Post,
  PostCategory,
  PopularPost,
} from "@/lib/committee-data";

const SECTION = "committee" as const;

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

export type CommitteeListData = {
  pinned: Post | null;
  posts: Post[];
  categories: PostCategory[];
  popular: PopularPost[];
};

export async function getCommitteeListData(): Promise<CommitteeListData> {
  const now = new Date();
  const rows = await baseRows().orderBy(desc(posts.isPinned), desc(posts.createdAt));

  let pinned: Post | null = null;
  const list: Post[] = [];
  for (const r of rows) {
    const view = toCommitteePostView(r as CommitteeRow, now);
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
  const categories: PostCategory[] = [
    { ko: "전체", en: "ALL", count: total },
    ...COMMITTEE_CATEGORIES_KO.map((ko) => ({
      ko,
      en: CATEGORY_EN[ko],
      count: byCat.get(ko) ?? 0,
    })),
  ];

  // 인기글 — 조회수 상위 5
  const pop = await getDb()
    .select({ id: posts.id, title: posts.title, views: posts.viewCount })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .orderBy(desc(posts.viewCount))
    .limit(5);
  const popular: PopularPost[] = pop.map((p) => ({
    id: p.id,
    title: p.title,
    views: p.views,
  }));

  return { pinned, posts: list, categories, popular };
}
