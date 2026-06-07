"use server";
// 교역자수련회 글 작성/수정/삭제. admin 전용(RLS admin 정책 + requireAdmin 재확인), zod 검증.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";
import { deletePostFiles } from "@/server/uploads/training";
import { TRAINING_CATEGORIES_KO } from "@/lib/training";

const postSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(TRAINING_CATEGORIES_KO as [string, ...string[]]),
  excerpt: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  body: z
    .string()
    .optional()
    .transform((v) => v || null),
  isPinned: z.coerce.boolean(),
});

export interface PostFormState {
  error?: string;
}

function parse(formData: FormData) {
  return postSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    isPinned: formData.get("isPinned") === "on" || formData.get("isPinned") === "true",
  });
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      section: "training",
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  redirect(`/admin/training/${data.id}/edit`);
}

export async function updatePost(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("posts")
    .update({
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
    })
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect(`/training/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  await deletePostFiles(id); // Storage 파일 먼저 정리 (DB 행은 cascade)
  const supabase = await createSupabaseServer();
  await supabase.from("posts").delete().eq("id", id);
  redirect("/training");
}
