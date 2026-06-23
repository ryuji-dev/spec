import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import {
  toWebzineArticleView,
  toWebzineFeaturedView,
  toWebzineBackIssueView,
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
  WebzineBackIssue,
} from "@/lib/webzine-data";

const SECTION = "webzine" as const;

// PostgREST to-one 임베드는 환경에 따라 배열로 올 수 있어 단일 객체로 정규화.
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type WebzineListData = {
  featured: WebzineFeatured | null;
  articles: WebzineArticle[];
  categories: WebzineCategory[];
  backIssues: WebzineBackIssue[];
};

export async function getWebzineListData(): Promise<WebzineListData> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, category, title, excerpt, view_count, created_at, is_pinned, body, author:profiles(name, title)",
    )
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  // 첫 is_pinned 행을 featured로, 없으면 첫 행을. 나머지는 일반 기사로.
  let featuredRow: (typeof rows)[number] | null = null;
  for (const r of rows) {
    if (r.is_pinned) {
      featuredRow = r;
      break;
    }
  }
  if (!featuredRow && rows.length > 0) featuredRow = rows[0];

  // Supabase 행 → WebzineRow 변환 헬퍼
  function toWebzineRow(r: (typeof rows)[number]): WebzineRow {
    const author = one(r.author);
    return {
      id: r.id,
      category: r.category,
      title: r.title,
      excerpt: r.excerpt,
      viewCount: r.view_count,
      createdAt: new Date(r.created_at),
      isPinned: r.is_pinned,
      authorName: author?.name ?? null,
      authorTitle: author?.title ?? null,
      // 본문 길이 기반 읽기시간 계산용 — body 직접 select 후 JS에서 산출
      bodyLength: r.body?.length ?? 0,
    };
  }

  const featured = featuredRow
    ? toWebzineFeaturedView(toWebzineRow(featuredRow))
    : null;
  const articles = rows
    .filter((r) => r !== featuredRow)
    .map((r) => toWebzineArticleView(toWebzineRow(r)));

  // 카테고리별 카운트 집계 — 목록 쿼리 결과 재사용
  const byCat = new Map<string, number>();
  for (const r of rows) {
    if (r.category) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  }
  const categories: WebzineCategory[] = WEBZINE_CATEGORIES_KO.map((ko) => ({
    ko,
    en: WZ_CATEGORY_EN[ko],
    count: byCat.get(ko) ?? 0,
  }));

  // "지난 호" = 조회수 상위 4편(동점 시 최신). 이미 조회한 rows 재사용.
  const backIssues: WebzineBackIssue[] = [...rows]
    .sort(
      (a, b) =>
        b.view_count - a.view_count ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 4)
    .map((r) => toWebzineBackIssueView(toWebzineRow(r)));

  return { featured, articles, categories, backIssues };
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
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select(
      "id, category, title, excerpt, body, view_count, created_at, author:profiles(name, title)",
    )
    .eq("id", id)
    .eq("section", SECTION)
    .eq("is_published", true)
    .maybeSingle();
  if (!r) return null;

  const author = one(r.author);
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
    author: formatAuthor(author?.name ?? null, author?.title ?? null),
    authorRole: author?.title ?? "",
    date: formatDate(new Date(r.created_at)),
    read: readingTime(r.body?.length ?? 0),
    viewCount: r.view_count,
  };
}

export async function incrementWebzineView(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: id });
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
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select("id, category, title, excerpt, body, is_pinned")
    .eq("id", id)
    .eq("section", SECTION)
    .maybeSingle();
  if (!r) return null;

  return {
    id: r.id,
    category: r.category,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    isPinned: r.is_pinned,
  };
}
