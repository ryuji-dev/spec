"use server";
// 자유게시판 글 작성/수정/삭제. 작성=로그인 회원, 수정·삭제=작성자 본인 또는 admin.
// 권한은 RLS가 1차 강제하고, 여기서 한 번 더 확인해 친절한 메시지를 준다(헌법: 서버 재확인).
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { BOARD_CATEGORIES_KO } from "@/lib/board";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(BOARD_CATEGORIES_KO as [string, ...string[]]),
  body: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});

export interface BoardFormState {
  error?: string;
}

function parse(formData: FormData) {
  return schema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    body: formData.get("body"),
  });
}

const SECTION = "board" as const;

export async function createPost(_prev: BoardFormState, formData: FormData): Promise<BoardFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      section: SECTION,
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.body ? r.data.body.slice(0, 120) : null,
      body: r.data.body,
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  redirect(`/board/${data.id}`);
}

// 작성자 본인 또는 admin인지 확인(대상 글이 board 글이어야 함)
async function authorizePost(
  supabase: SupabaseClient<Database>,
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  const { data } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .eq("section", SECTION)
    .maybeSingle();
  if (!data) return false;
  return isAdmin || data.author_id === userId;
}

export async function updatePost(
  id: string,
  _prev: BoardFormState,
  formData: FormData,
): Promise<BoardFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };

  const supabase = await createSupabaseServer();
  if (!(await authorizePost(supabase, id, user.id, user.role === "admin")))
    return { error: "수정 권한이 없습니다." };
  const { error } = await supabase
    .from("posts")
    .update({
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.body ? r.data.body.slice(0, 120) : null,
      body: r.data.body,
    })
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect(`/board/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createSupabaseServer();
  if (!(await authorizePost(supabase, id, user!.id, user!.role === "admin")))
    redirect(`/board/${id}`);
  await supabase.from("posts").delete().eq("id", id);
  redirect("/board");
}
