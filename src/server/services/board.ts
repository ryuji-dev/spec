import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { formatDate, formatAuthor } from "@/lib/format";
import {
  toFeedPostView,
  categoryToKind,
  BOARD_CATEGORIES_KO,
  BOARD_CATEGORY_EN,
} from "@/lib/board";
import type { FeedPost, BoardCategory, ActiveMember } from "@/lib/board-data";

const SECTION = "board" as const;

export type BoardListData = {
  posts: FeedPost[];
  categories: BoardCategory[];
  members: ActiveMember[];
};

// PostgREST 임베드는 to-one도 환경에 따라 배열로 올 수 있어 단일 객체로 정규화.
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function getBoardListData(): Promise<BoardListData> {
  const now = new Date();
  const supabase = await createSupabaseServer();
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, category, title, excerpt, view_count, created_at, author_id, author:profiles(name, church), comments(count), post_likes(count)",
    )
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  // 내가 좋아요한 글 집합 (로그인 시)
  let likedSet = new Set<string>();
  if (user && rows.length > 0) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in(
        "post_id",
        rows.map((r) => r.id),
      );
    likedSet = new Set((likes ?? []).map((l) => l.post_id));
  }

  const list = rows.map((r) => {
    const author = one(r.author);
    return toFeedPostView(
      {
        id: r.id,
        category: r.category,
        title: r.title,
        excerpt: r.excerpt,
        viewCount: r.view_count,
        createdAt: new Date(r.created_at),
        authorName: author?.name ?? null,
        authorChurch: author?.church ?? null,
        commentCount: r.comments[0]?.count ?? 0,
        likeCount: r.post_likes[0]?.count ?? 0,
        likedByMe: likedSet.has(r.id),
      },
      now,
    );
  });

  // 카테고리 집계 — 목록 쿼리 결과 재사용
  const byCat = new Map<string, number>();
  for (const r of rows) {
    if (r.category) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  }
  const categories: BoardCategory[] = [
    { ko: "전체", en: "ALL", count: rows.length },
    ...BOARD_CATEGORIES_KO.map((ko) => ({ ko, en: BOARD_CATEGORY_EN[ko], count: byCat.get(ko) ?? 0 })),
  ];

  // 활발한 멤버 — 게시 글 전체(rows)에서 작성자별 글 수 집계, 상위 5명
  const memberAgg = new Map<string, { name: string; church: string | null; count: number }>();
  for (const r of rows) {
    if (!r.author_id) continue;
    const author = one(r.author);
    const prev = memberAgg.get(r.author_id);
    if (prev) {
      prev.count += 1;
    } else {
      memberAgg.set(r.author_id, {
        name: author?.name ?? "",
        church: author?.church ?? null,
        count: 1,
      });
    }
  }
  const members: ActiveMember[] = [...memberAgg.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((m) => ({
      name: m.name,
      church: m.church ?? "",
      posts: m.count,
      init: m.name.charAt(0),
    }));

  return { posts: list, categories, members };
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
  likedByMe: boolean;
  authorId: string | null;
  comments: { id: string; authorId: string | null; author: string; date: string; body: string }[];
};

export async function getBoardPost(id: string): Promise<BoardDetail | null> {
  const supabase = await createSupabaseServer();
  const user = await getCurrentUser();

  const { data: r } = await supabase
    .from("posts")
    .select(
      "id, category, title, body, view_count, created_at, author_id, author:profiles(name, church)",
    )
    .eq("id", id)
    .eq("section", SECTION)
    .eq("is_published", true)
    .maybeSingle();
  if (!r) return null;

  const { data: cms } = await supabase
    .from("comments")
    .select("id, author_id, body, created_at, author:profiles(name, title)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const { count: likes } = await supabase
    .from("post_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", id);

  let likedByMe = false;
  if (user) {
    const { data: liked } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .limit(1);
    likedByMe = (liked?.length ?? 0) > 0;
  }

  const author = one(r.author);
  return {
    id: r.id,
    category: r.category,
    kind: categoryToKind(r.category),
    title: r.title,
    body: r.body,
    author: author?.name ?? "익명",
    church: author?.church ?? "",
    date: formatDate(new Date(r.created_at)),
    views: r.view_count,
    likes: likes ?? 0,
    likedByMe,
    authorId: r.author_id,
    comments: (cms ?? []).map((c) => {
      const ca = one(c.author);
      return {
        id: c.id,
        authorId: c.author_id,
        author: formatAuthor(ca?.name ?? null, ca?.title ?? null),
        date: formatDate(new Date(c.created_at)),
        body: c.body,
      };
    }),
  };
}

export async function incrementBoardView(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: id });
}
