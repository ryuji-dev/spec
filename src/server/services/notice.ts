// 메인 공지(notice 싱글톤) 현재 문구 조회. admin 홈 표시용.
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";

export async function getCurrentAnnouncement(): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("posts")
    .select("title")
    .eq("section", "notice")
    // /main의 getHomeData와 동일 정렬(향후 고정 공지 우선 표시 여지 유지).
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.title ?? null;
}
