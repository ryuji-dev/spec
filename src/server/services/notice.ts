import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatDate, formatAuthor } from "@/lib/format";

// PostgREST 임베드 to-one이 환경에 따라 배열로 올 수 있어 단일 객체로 정규화.
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const SECTION = "notice" as const;
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type NoticePost = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  views: number;
  isPinned: boolean;
  isNew: boolean;
};

export type NoticeListData = { pinned: NoticePost | null; posts: NoticePost[] };

export async function getNoticeListData(): Promise<NoticeListData> {
  const now = Date.now();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, view_count, created_at, is_pinned, author:profiles(name, title)")
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  let pinned: NoticePost | null = null;
  const posts: NoticePost[] = [];
  for (const r of data ?? []) {
    const a = one(r.author);
    const createdAt = new Date(r.created_at);
    const view: NoticePost = {
      id: r.id,
      title: r.title,
      excerpt: r.excerpt ?? "",
      author: formatAuthor(a?.name ?? null, a?.title ?? null),
      date: formatDate(createdAt),
      views: r.view_count,
      isPinned: r.is_pinned,
      isNew: now - createdAt.getTime() < NEW_WINDOW_MS,
    };
    if (r.is_pinned && !pinned) pinned = view;
    else posts.push(view);
  }
  return { pinned, posts };
}

export type NoticeDetail = {
  id: string;
  title: string;
  body: string | null;
  author: string;
  date: string;
  views: number;
};

export async function getNoticePost(id: string): Promise<NoticeDetail | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("posts")
    .select("id, title, body, view_count, created_at, author:profiles(name, title)")
    .eq("id", id)
    .eq("section", SECTION)
    .eq("is_published", true)
    .maybeSingle();
  if (!r) return null;
  const a = one(r.author);
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    author: formatAuthor(a?.name ?? null, a?.title ?? null),
    date: formatDate(new Date(r.created_at)),
    views: r.view_count,
  };
}

export async function incrementNoticeView(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: id });
}

export type NoticeEditData = {
  id: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  isPinned: boolean;
};

export async function getNoticePostForEdit(id: string): Promise<NoticeEditData | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("posts")
    .select("id, title, excerpt, body, is_pinned")
    .eq("id", id)
    .eq("section", SECTION)
    .maybeSingle();
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    isPinned: r.is_pinned,
  };
}
