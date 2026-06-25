"use server";
// 자료 작성/수정/삭제. admin 전용(RLS admin 정책 + requireAdmin 재확인), zod 검증.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";
import { deleteResourcePostFiles } from "@/server/uploads/resource";
import { RESOURCE_CATEGORIES_KO } from "@/lib/resource";

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(RESOURCE_CATEGORIES_KO as [string, ...string[]]),
  sub: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  isPublished: z.coerce.boolean(),
});

export interface ResourceFormState {
  error?: string;
}

function parse(formData: FormData) {
  return schema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    sub: formData.get("sub"),
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
  });
}

export async function createResource(
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const user = await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      section: "resource",
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.sub,
      is_published: r.data.isPublished,
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  redirect(`/admin/resources/${data.id}/edit`);
}

export async function updateResource(
  id: string,
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("posts")
    .update({ category: r.data.category, title: r.data.title, excerpt: r.data.sub, is_published: r.data.isPublished })
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect(`/resources/${id}`);
}

export async function deleteResource(id: string): Promise<void> {
  await requireAdmin();
  await deleteResourcePostFiles(id); // Storage 파일 먼저 정리 (DB 행은 cascade)
  const supabase = await createSupabaseServer();
  await supabase.from("posts").delete().eq("id", id);
  redirect("/resources");
}

export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", "resource");
  revalidatePath("/resources");
  revalidatePath("/admin/resources");
}
