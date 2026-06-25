import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatAuthor } from "@/lib/format";
import {
  toResourceFileView,
  categoryToType,
  RESOURCE_CATEGORIES_KO,
  RESOURCE_CATEGORY_EN,
  formatDate,
  toCollectionView,
  type ResourceRow,
  type CollectionRow,
} from "@/lib/resource";
import type {
  ResourceFile,
  ResourceCategory,
  ResourceTopItem,
  ResourceCollection,
  CollectionCoverKind,
  CollectionBadge,
} from "@/lib/resources-data";

const SECTION = "resource" as const;

// PostgREST to-one 임베드가 배열로 올 수 있어 단일 객체로 정규화.
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type ResourceListData = {
  files: ResourceFile[];
  categories: ResourceCategory[];
  top: ResourceTopItem[];
  collections: ResourceCollection[];
};

export async function getResourceListData(): Promise<ResourceListData> {
  const now = new Date();
  const supabase = await createSupabaseServer();

  // attachments를 임베드해 size_bytes 합산(totalBytes)을 클라이언트에서 계산.
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, category, title, excerpt, view_count, created_at, author:profiles(name, title), attachments(size_bytes)",
    )
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const files: ResourceFile[] = rows.map((r) => {
    const author = one(r.author);
    const totalBytes = (r.attachments as { size_bytes: number }[]).reduce(
      (sum, a) => sum + (a.size_bytes ?? 0),
      0,
    );
    const row: ResourceRow = {
      id: r.id,
      category: r.category,
      title: r.title,
      excerpt: r.excerpt,
      viewCount: r.view_count,
      createdAt: new Date(r.created_at),
      authorName: author?.name ?? null,
      authorTitle: author?.title ?? null,
      totalBytes,
    };
    return toResourceFileView(row, now);
  });

  // 카테고리 집계 — 목록 쿼리 결과 재사용.
  const byCat = new Map<string, number>();
  for (const r of rows) {
    if (r.category) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  }
  const total = rows.length;
  const categories: ResourceCategory[] = [
    { ko: "전체", en: "ALL", count: total, icon: "all" },
    ...RESOURCE_CATEGORIES_KO.map((ko) => ({
      ko,
      en: RESOURCE_CATEGORY_EN[ko],
      count: byCat.get(ko) ?? 0,
      icon: categoryToType(ko),
    })),
  ];

  // 인기 자료 Top 5 — view_count 내림차순 정렬 후 상위 5개.
  const sorted = [...rows].sort((a, b) => b.view_count - a.view_count).slice(0, 5);
  const top: ResourceTopItem[] = sorted.map((p, i) => ({
    rank: i + 1,
    title: p.title,
    downloads: p.view_count,
    type: categoryToType(p.category),
  }));

  // 컬렉션 — 공개분 + 연결 자료(view_count)를 임베드해 items/downloads 파생.
  const { data: colData, error: colError } = await supabase
    .from("resource_collections")
    .select(
      "id, title, sub, cover, badge, tag, items:resource_collection_items(post:posts(view_count))",
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (colError) throw colError;
  const collections: ResourceCollection[] = (colData ?? []).map((c) => {
    const links = (c.items ?? []) as {
      post: { view_count: number } | { view_count: number }[] | null;
    }[];
    const posts = links
      .map((l) => one(l.post))
      .filter((p): p is { view_count: number } => p != null);
    const row: CollectionRow = {
      id: c.id,
      title: c.title,
      sub: c.sub,
      cover: c.cover as CollectionCoverKind,
      badge: (c.badge as CollectionBadge | null) ?? null,
      tag: c.tag,
      items: posts.length,
      downloads: posts.reduce((sum, p) => sum + (p.view_count ?? 0), 0),
    };
    return toCollectionView(row);
  });

  return { files, categories, top, collections };
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
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select(
      "id, category, title, excerpt, view_count, created_at, author:profiles(name, title)",
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

  const author = one(r.author);
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    sub: r.excerpt ?? "",
    by: formatAuthor(author?.name ?? null, author?.title ?? null),
    date: formatDate(new Date(r.created_at)),
    downloads: r.view_count,
    files: (atts ?? []).map((a) => ({
      id: a.id,
      name: a.original_name,
      sizeBytes: Number(a.size_bytes),
      mime: a.mime,
    })),
  };
}

export async function incrementResourceDownload(postId: string): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: postId });
}

export type CollectionAdminRow = {
  id: string;
  title: string;
  tag: string;
  cover: string;
  badge: string | null;
  isPublished: boolean;
  sortOrder: number;
  itemCount: number;
};

export async function listCollectionsForAdmin(): Promise<CollectionAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("resource_collections")
    .select(
      "id, title, tag, cover, badge, is_published, sort_order, resource_collection_items(count)",
    )
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => {
    const countRel = c.resource_collection_items as { count: number }[] | null;
    return {
      id: c.id,
      title: c.title,
      tag: c.tag,
      cover: c.cover,
      badge: c.badge,
      isPublished: c.is_published,
      sortOrder: c.sort_order,
      itemCount: countRel?.[0]?.count ?? 0,
    };
  });
}

export type CollectionEditData = {
  id: string;
  title: string;
  sub: string;
  cover: string;
  badge: string | null;
  tag: string;
  isPublished: boolean;
  sortOrder: number;
  postIds: string[];
};

export async function getCollectionForEdit(id: string): Promise<CollectionEditData | null> {
  const supabase = await createSupabaseServer();
  const { data: c } = await supabase
    .from("resource_collections")
    .select("id, title, sub, cover, badge, tag, is_published, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;
  const { data: items } = await supabase
    .from("resource_collection_items")
    .select("post_id")
    .eq("collection_id", id);
  return {
    id: c.id,
    title: c.title,
    sub: c.sub,
    cover: c.cover,
    badge: c.badge,
    tag: c.tag,
    isPublished: c.is_published,
    sortOrder: c.sort_order,
    postIds: (items ?? []).map((i) => i.post_id),
  };
}

export type ResourcePickerItem = { id: string; title: string; category: string | null };

export async function listResourcePostsForPicker(): Promise<ResourcePickerItem[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, title: p.title, category: p.category }));
}

export type ResourceEditData = {
  id: string;
  category: string | null;
  title: string;
  sub: string;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
};

export async function getResourcePostForEdit(id: string): Promise<ResourceEditData | null> {
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select("id, category, title, excerpt")
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
    sub: r.excerpt ?? "",
    attachments: (atts ?? []).map((a) => ({
      id: a.id,
      name: a.original_name,
      sizeBytes: Number(a.size_bytes),
      mime: a.mime,
    })),
  };
}

export type ResourceAdminRow = {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
  isPublished: boolean;
};

// admin 전용: resource 섹션 글(미공개 포함) 최신순.
export async function listResourcePostsForAdmin(): Promise<ResourceAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, created_at, is_published")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    createdAt: r.created_at,
    isPublished: r.is_published,
  }));
}
