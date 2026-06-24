"use server";
// hero_slides 생성(업로드)/메타수정/삭제. admin 전용(RLS + requireAdmin), zod 검증.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";
import { storeHeroImage, deleteHeroImage } from "@/server/uploads/hero";
import { UploadError } from "@/server/uploads/core";

const metaSchema = z.object({
  alt: z.string().trim().max(200),
  isPublished: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

export interface HeroFormState {
  error?: string;
}

function parseMeta(formData: FormData) {
  return metaSchema.safeParse({
    alt: formData.get("alt") ?? "",
    isPublished:
      formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

export async function createHeroSlide(
  _prev: HeroFormState,
  formData: FormData,
): Promise<HeroFormState> {
  await requireAdmin();
  const m = parseMeta(formData);
  if (!m.success) return { error: m.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "이미지를 선택해주세요." };

  let imagePath: string;
  try {
    ({ imagePath } = await storeHeroImage(file));
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "이미지 저장에 실패했습니다." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("hero_slides").insert({
    image_path: imagePath,
    alt: m.data.alt,
    is_published: m.data.isPublished,
    sort_order: m.data.sortOrder,
  });
  if (error) {
    await deleteHeroImage(imagePath); // DB 실패 시 업로드 롤백
    return { error: "저장에 실패했습니다." };
  }
  redirect("/admin/hero");
}

export async function updateHeroSlide(
  id: string,
  _prev: HeroFormState,
  formData: FormData,
): Promise<HeroFormState> {
  await requireAdmin();
  const m = parseMeta(formData);
  if (!m.success) return { error: m.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("hero_slides")
    .update({ alt: m.data.alt, is_published: m.data.isPublished, sort_order: m.data.sortOrder })
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect("/admin/hero");
}

export async function deleteHeroSlide(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: row } = await supabase
    .from("hero_slides")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("hero_slides").delete().eq("id", id);
  if (row?.image_path) await deleteHeroImage(row.image_path);
  redirect("/admin/hero");
}
