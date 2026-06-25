"use server";
// 신학원웹진 기사 작성/수정/삭제. admin 전용, zod 검증, supabase-js. (첨부 없음)
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";
import { WEBZINE_CATEGORIES_KO } from "@/lib/webzine";

const postSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(WEBZINE_CATEGORIES_KO),
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
  isPublished: z.coerce.boolean(),
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
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
  });
}

const SECTION = "webzine" as const;

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
      section: SECTION,
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
      is_published: r.data.isPublished,
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  redirect(`/webzine/${data.id}`);
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
  // updated_at은 DB 트리거가 자동 갱신하므로 set하지 않는다.
  const { error } = await supabase
    .from("posts")
    .update({
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
      is_published: r.data.isPublished,
    })
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect(`/webzine/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").delete().eq("id", id);
  redirect("/webzine");
}

export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", SECTION);
  revalidatePath("/webzine");
  revalidatePath("/admin/webzine");
}
