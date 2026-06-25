"use server";
// 교육위원회 글 작성/수정/삭제. admin 전용(RLS admin 정책 + requireAdmin 재확인), zod 검증.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";
import { deletePostFiles } from "@/server/uploads/committee";
import { COMMITTEE_CATEGORIES_KO } from "@/lib/committee";
import type { Json } from "@/lib/database.types";
import { kstDateEndToIso } from "@/lib/datetime";

const postSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(COMMITTEE_CATEGORIES_KO as [string, ...string[]]),
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
  eventDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  location: z
    .string()
    .trim()
    .max(200, "장소는 200자 이내로 입력해주세요.")
    .optional()
    .transform((v) => v || null),
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
    eventDate: formData.get("eventDate"),
    location: formData.get("location"),
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
      section: "committee",
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
      is_published: r.data.isPublished,
      event_date: r.data.eventDate ? kstDateEndToIso(r.data.eventDate) : null,
      meta: r.data.location ? { location: r.data.location } : null,
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  redirect(`/admin/committee/${data.id}/edit`);
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
  // 기존 meta 보존(location만 갱신/제거). 잘못된 id로 타 섹션 글을 건드리지 않도록 section도 고정.
  const { data: cur } = await supabase
    .from("posts")
    .select("meta")
    .eq("id", id)
    .eq("section", "committee")
    .single();
  const baseMeta =
    cur?.meta && typeof cur.meta === "object" && !Array.isArray(cur.meta)
      ? (cur.meta as Record<string, Json>)
      : {};
  const nextMeta: Record<string, Json> = { ...baseMeta };
  if (r.data.location) nextMeta.location = r.data.location;
  else delete nextMeta.location;
  const meta: Json | null = Object.keys(nextMeta).length ? nextMeta : null;
  const { error } = await supabase
    .from("posts")
    .update({
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
      is_published: r.data.isPublished,
      event_date: r.data.eventDate ? kstDateEndToIso(r.data.eventDate) : null,
      meta,
    })
    .eq("id", id)
    .eq("section", "committee");
  if (error) return { error: "수정에 실패했습니다." };
  redirect(`/committee/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  await deletePostFiles(id); // Storage 파일 먼저 정리 (DB 행은 cascade)
  const supabase = await createSupabaseServer();
  await supabase.from("posts").delete().eq("id", id);
  redirect("/committee");
}

export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", "committee");
  revalidatePath("/committee");
  revalidatePath("/main");
  revalidatePath("/admin/committee");
}
