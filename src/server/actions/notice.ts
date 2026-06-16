"use server";
// 공지 게시물 CRUD. admin 전용(requireAdmin + RLS), zod 검증.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/current-user";
import { createSupabaseServer } from "@/server/supabase/server";

// ── 공지 게시물 CRUD (committee 액션 미러, category·첨부·event_date 없음) ──
const noticeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요.")
    .max(200, "제목은 200자 이내로 입력해주세요."),
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

function parseNotice(formData: FormData) {
  return noticeSchema.safeParse({
    title: formData.get("title"),
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
  const r = parseNotice(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      section: "notice",
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  revalidatePath("/notice");
  revalidatePath("/main");
  redirect(`/notice/${data.id}`);
}

export async function updatePost(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const r = parseNotice(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("posts")
    .update({
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
    })
    .eq("id", id)
    .eq("section", "notice");
  if (error) return { error: "수정에 실패했습니다." };
  revalidatePath("/notice");
  revalidatePath("/main");
  revalidatePath(`/notice/${id}`);
  redirect(`/notice/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").delete().eq("id", id).eq("section", "notice");
  revalidatePath("/notice");
  revalidatePath("/main");
  redirect("/notice");
}
