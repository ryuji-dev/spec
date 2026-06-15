import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { isoToKstDate } from "@/lib/datetime";
import {
  toCommitteePostView,
  COMMITTEE_CATEGORIES_KO,
  CATEGORY_EN,
  formatAuthor,
  formatDate,
  type CommitteeRow,
} from "@/lib/committee";
import type {
  Post,
  PostCategory,
  PopularPost,
} from "@/lib/committee-data";

const SECTION = "committee" as const;

// PostgREST 임베드는 to-one도 환경에 따라 배열로 올 수 있어 단일 객체로 정규화.
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type CommitteeListData = {
  pinned: Post | null;
  posts: Post[];
  categories: PostCategory[];
  popular: PopularPost[];
};

export async function getCommitteeListData(): Promise<CommitteeListData> {
  const now = new Date();
  const supabase = await createSupabaseServer();

  // 목록 쿼리 — 고정글 우선, 최신순. 댓글 수는 집계 임베드.
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, category, title, excerpt, view_count, created_at, is_pinned, author_id, author:profiles(name, title), comments(count)",
    )
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  // 첨부파일 카운트 — 목록 전체를 한 번에 집계
  const attachCountMap = new Map<string, number>();
  if (rows.length > 0) {
    const { data: attRows } = await supabase
      .from("attachments")
      .select("post_id")
      .in(
        "post_id",
        rows.map((r) => r.id),
      );
    for (const a of attRows ?? []) {
      attachCountMap.set(a.post_id, (attachCountMap.get(a.post_id) ?? 0) + 1);
    }
  }

  let pinned: Post | null = null;
  const list: Post[] = [];
  for (const r of rows) {
    const author = one(r.author);
    const row: CommitteeRow = {
      id: r.id,
      category: r.category,
      title: r.title,
      excerpt: r.excerpt,
      viewCount: r.view_count,
      createdAt: new Date(r.created_at),
      authorName: author?.name ?? null,
      authorTitle: author?.title ?? null,
      commentCount: r.comments[0]?.count ?? 0,
      attachCount: attachCountMap.get(r.id) ?? 0,
    };
    const view = toCommitteePostView(row, now);
    if (r.is_pinned && !pinned) pinned = view;
    else list.push(view);
  }

  // 카테고리 카운트 — 목록 쿼리 결과 재사용
  const byCat = new Map<string, number>();
  for (const r of rows) {
    if (r.category) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  }
  const total = rows.length;
  const categories: PostCategory[] = [
    { ko: "전체", en: "ALL", count: total },
    ...COMMITTEE_CATEGORIES_KO.map((ko) => ({
      ko,
      en: CATEGORY_EN[ko],
      count: byCat.get(ko) ?? 0,
    })),
  ];

  // 인기글 — 조회수 상위 5
  const { data: pop } = await supabase
    .from("posts")
    .select("id, title, view_count")
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("view_count", { ascending: false })
    .limit(5);
  const popular: PopularPost[] = (pop ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    views: p.view_count,
  }));

  return { pinned, posts: list, categories, popular };
}

export type CommitteeDetail = {
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

export async function getCommitteePost(id: string): Promise<CommitteeDetail | null> {
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select(
      "id, category, title, body, view_count, created_at, author:profiles(name, title)",
    )
    .eq("id", id)
    .eq("section", SECTION)
    .eq("is_published", true)
    .maybeSingle();
  if (!r) return null;

  const { data: atts } = await supabase
    .from("attachments")
    .select("id, original_name, size_bytes, mime")
    .eq("post_id", id);

  const { data: cms } = await supabase
    .from("comments")
    .select("id, author_id, body, created_at, author:profiles(name, title)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const author = one(r.author);
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    body: r.body,
    author: formatAuthor(author?.name ?? null, author?.title ?? null),
    date: formatDate(new Date(r.created_at)),
    views: r.view_count,
    attachments: (atts ?? []).map((a) => ({
      id: a.id,
      name: a.original_name,
      sizeBytes: a.size_bytes,
      mime: a.mime,
    })),
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

export async function incrementCommitteeView(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: id });
}

export type CommitteeEditData = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  body: string | null;
  isPinned: boolean;
  eventDate: string | null;
  location: string | null;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
};

export async function getCommitteePostForEdit(id: string): Promise<CommitteeEditData | null> {
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select("id, category, title, excerpt, body, is_pinned, event_date, meta")
    .eq("id", id)
    .eq("section", SECTION)
    .maybeSingle();
  if (!r) return null;

  const { data: atts } = await supabase
    .from("attachments")
    .select("id, original_name, size_bytes, mime")
    .eq("post_id", id);

  return {
    id: r.id,
    category: r.category,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    isPinned: r.is_pinned,
    eventDate: r.event_date ? isoToKstDate(r.event_date) : null,
    location:
      r.meta && typeof r.meta === "object" && !Array.isArray(r.meta)
        ? ((r.meta as Record<string, unknown>).location as string | undefined) ?? null
        : null,
    attachments: (atts ?? []).map((a) => ({
      id: a.id,
      name: a.original_name,
      sizeBytes: a.size_bytes,
      mime: a.mime,
    })),
  };
}
