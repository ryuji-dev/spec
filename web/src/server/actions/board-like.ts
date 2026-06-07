"use server";
// 자유게시판 글 좋아요 멱등 토글. 로그인 회원 누구나. board 섹션 글만 대상.
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/server/supabase/server";
import { getCurrentUser } from "@/server/auth/current-user";

const SECTION = "board" as const;

export type LikeResult =
  | { ok: true; liked: boolean; count: number }
  | { ok: false; error: string };

export async function toggleLike(postId: string): Promise<LikeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  const supabase = await createSupabaseServer();

  // 대상이 board 글인지 확인 (비정상 postId·타 섹션 차단)
  const { data: p } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("section", SECTION)
    .maybeSingle();
  if (!p) return { ok: false, error: "게시물을 찾을 수 없습니다." };

  // 토글: 있으면 삭제, 없으면 삽입
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("post_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  }

  const { count } = await supabase
    .from("post_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  // 서버 렌더 카운트 동기화 (목록·상세)
  revalidatePath("/board");
  revalidatePath(`/board/${postId}`);
  return { ok: true, liked: !existing, count: count ?? 0 };
}
