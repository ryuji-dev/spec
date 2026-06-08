import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatDate, formatAuthor } from "@/lib/format";
import {
  toTrainingPostView,
  TRAINING_CATEGORIES_KO,
  CATEGORY_EN,
  type TrainingRow,
} from "@/lib/training";
import type { TrainingPost, TrainingCategory } from "@/lib/training-data";

const SECTION = "training" as const;

// PostgREST 임베드는 to-one도 환경에 따라 배열로 올 수 있어 단일 객체로 정규화.
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type TrainingListData = {
  pinned: TrainingPost | null;
  posts: TrainingPost[];
  categories: TrainingCategory[];
};

export async function getTrainingListData(): Promise<TrainingListData> {
  const now = new Date();
  const supabase = await createSupabaseServer();

  // 목록 쿼리: 작성자 임베드 + 댓글 카운트 + 첨부 카운트
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, category, title, excerpt, view_count, created_at, is_pinned, author:profiles(name, title), comments(count), attachments(count)",
    )
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  let pinned: TrainingPost | null = null;
  const list: TrainingPost[] = [];
  for (const r of rows) {
    const author = one(r.author);
    const row: TrainingRow = {
      id: r.id,
      category: r.category,
      title: r.title,
      excerpt: r.excerpt,
      viewCount: r.view_count,
      createdAt: new Date(r.created_at),
      authorName: author?.name ?? null,
      authorTitle: author?.title ?? null,
      commentCount: r.comments[0]?.count ?? 0,
      attachCount: r.attachments[0]?.count ?? 0,
    };
    const view = toTrainingPostView(row, now);
    if (r.is_pinned && !pinned) pinned = view;
    else list.push(view);
  }

  // 카테고리 카운트 집계 — 목록 쿼리 결과 재사용
  const byCat = new Map<string, number>();
  for (const r of rows) {
    if (r.category) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  }
  const total = rows.length;
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
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select("id, category, title, body, view_count, created_at, author:profiles(name, title)")
    .eq("id", id)
    .eq("section", SECTION)
    .eq("is_published", true)
    .maybeSingle();
  if (!r) return null;

  // 첨부 파일 조회
  const { data: atts } = await supabase
    .from("attachments")
    .select("id, original_name, size_bytes, mime")
    .eq("post_id", id);

  // 댓글 + 작성자 조회
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
      sizeBytes: Number(a.size_bytes),
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

export async function incrementTrainingView(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: id });
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
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select("id, category, title, excerpt, body, is_pinned")
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
    attachments: (atts ?? []).map((a) => ({
      id: a.id,
      name: a.original_name,
      sizeBytes: Number(a.size_bytes),
      mime: a.mime,
    })),
  };
}
