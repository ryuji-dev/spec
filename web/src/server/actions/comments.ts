"use server";
// 댓글 작성/삭제. 작성은 로그인 회원(admin·member), 삭제는 작성자 본인 또는 admin.
// 상세 페이지가 있는 섹션(committee·board·training)에서만 댓글을 지원하며, 섹션별 경로로 redirect.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { getCurrentUser } from "@/server/auth/current-user";

// 댓글을 지원하는 섹션 → 상세 경로 베이스. 목록·상세가 있는 섹션만 등재.
const SECTION_PATH: Partial<Record<string, string>> = {
  committee: "/committee",
  board: "/board",
  training: "/training",
};

const bodySchema = z
  .string()
  .trim()
  .min(1, "댓글 내용을 입력해주세요.")
  .max(2000, "댓글이 너무 깁니다.");

export interface CommentState {
  error?: string;
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function addComment(
  postId: string,
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const parsed = bodySchema.safeParse(formData.get("body"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }
  const supabase = await createSupabaseServer();
  // 대상 게시물이 존재하고 댓글 지원 섹션인지 확인
  const { data: target } = await supabase
    .from("posts")
    .select("section")
    .eq("id", postId)
    .maybeSingle();
  const base = target ? SECTION_PATH[target.section] : undefined;
  if (!base) return { error: "게시물을 찾을 수 없습니다." };

  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body: parsed.data });
  if (error) return { error: "댓글 저장에 실패했습니다." };
  redirect(`${base}/${postId}`);
}

export async function deleteComment(commentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createSupabaseServer();
  const { data: c } = await supabase
    .from("comments")
    .select("post_id, author_id, post:posts(section)")
    .eq("id", commentId)
    .maybeSingle();
  if (!c) redirect("/");
  const section = one(c!.post)?.section;
  const base = (section && SECTION_PATH[section]) ?? "/";
  // 권한: 작성자 본인 또는 admin만. 그 외에는 삭제하지 않고 글로 복귀.
  if (user!.role !== "admin" && c!.author_id !== user!.id) {
    redirect(`${base}/${c!.post_id}`);
  }
  await supabase.from("comments").delete().eq("id", commentId);
  redirect(`${base}/${c!.post_id}`);
}
