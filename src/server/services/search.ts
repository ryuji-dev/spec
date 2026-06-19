import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatDate } from "@/lib/format";
import { SECTION_LABEL, SECTION_ROUTE, type PostSection } from "@/lib/section-meta";

const MAX_QUERY_LEN = 100;
const RESULT_LIMIT = 50;
const SNIPPET_LEN = 120;

export type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  section: PostSection;
  sectionLabel: string;
  date: string;
  href: string;
};

/**
 * 사용자 입력 정제. PostgREST .or()는 ','로 필터를, '()'로 그룹을 구분하고
 * '*'/'%'는 ilike 와일드카드다 → 구문 깨짐·의도치 않은 와일드카드를 막기 위해 제거.
 */
export function sanitizeQuery(raw: string): string {
  return raw
    .trim()
    .slice(0, MAX_QUERY_LEN)
    .replace(/[,()*%\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSnippet(excerpt: string | null, body: string | null): string {
  const src = (excerpt ?? body ?? "").replace(/\s+/g, " ").trim();
  return src.length > SNIPPET_LEN ? `${src.slice(0, SNIPPET_LEN)}…` : src;
}

export async function searchPosts(rawQuery: string): Promise<SearchResult[]> {
  const q = sanitizeQuery(rawQuery);
  if (!q) return [];

  const pat = `%${q}%`;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, body, section, created_at")
    .eq("is_published", true)
    .or(`title.ilike.${pat},excerpt.ilike.${pat},body.ilike.${pat}`)
    .order("created_at", { ascending: false })
    .limit(RESULT_LIMIT);
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    snippet: toSnippet(r.excerpt, r.body),
    section: r.section,
    sectionLabel: SECTION_LABEL[r.section] ?? "",
    date: formatDate(new Date(r.created_at)),
    href: `${SECTION_ROUTE[r.section]}/${r.id}`,
  }));
}
