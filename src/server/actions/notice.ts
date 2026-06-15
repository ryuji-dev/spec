"use server";
// 메인 공지(notice 싱글톤) 저장/해제. admin 전용(requireAdmin + RLS), zod 검증.
import { revalidatePath } from "next/cache";
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
