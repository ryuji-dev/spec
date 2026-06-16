"use server";
// 메인 공지(notice 싱글톤) 저장/해제. admin 전용(requireAdmin + RLS), zod 검증.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/current-user";
import { createSupabaseServer } from "@/server/supabase/server";

export interface AnnouncementState {
  error?: string;
  success?: string;
}

const textSchema = z
  .string()
  .trim()
  .min(1, "공지 문구를 입력해주세요.")
  .max(200, "200자 이내로 입력해주세요.");

export async function setAnnouncement(
  _prev: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const user = await requireAdmin();
  const r = textSchema.safeParse(formData.get("text"));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };

  const supabase = await createSupabaseServer();
  // 싱글톤: 기존 notice 최신 1건이 있으면 제목 갱신, 없으면 새로 생성.
  // 1인 운영 전제 — 동시 쓰기로 2건이 생겨도 clear는 전체 삭제, set은 최신 1건만 갱신해 수렴.
  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("section", "notice")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("posts")
      .update({ title: r.data })
      .eq("id", existing.id);
    if (error) return { error: "저장에 실패했습니다." };
  } else {
    const { error } = await supabase.from("posts").insert({
      section: "notice",
      title: r.data,
      is_pinned: false,
      author_id: user.id,
    });
    if (error) return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/main");
  revalidatePath("/admin");
  return { success: "공지를 저장했습니다." };
}

// useActionState는 인자 적은 함수도 허용 — clear는 입력이 없어 무인자로 둔다(미사용 인자 경고 방지).
export async function clearAnnouncement(): Promise<AnnouncementState> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("posts").delete().eq("section", "notice");
  if (error) return { error: "공지 해제에 실패했습니다." };
  revalidatePath("/main");
  revalidatePath("/admin");
  return { success: "공지를 내렸습니다." };
}

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
