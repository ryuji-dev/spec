"use server";
// 고객지원 문의 — 접수(비로그인 포함)와 관리자 답변. RLS가 1차 경계, 답변은 진입부 권한 재확인.
import { revalidatePath } from "next/cache";
import { answerSchema, inquirySchema } from "@/lib/dto/inquiry";
import { requireAdmin } from "@/server/auth/current-user";
import { createSupabaseServer } from "@/server/supabase/server";

export interface SubmitInquiryState {
  error?: string;
  done?: boolean;
}

export async function submitInquiry(
  _prev: SubmitInquiryState,
  formData: FormData,
): Promise<SubmitInquiryState> {
  // honeypot — 봇이 채우는 숨김 필드. 채워져 있으면 저장 없이 조용히 성공 처리.
  if (formData.get("company")) return { done: true };

  const parsed = inquirySchema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    email: formData.get("email"),
    contact: formData.get("contact"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인앱 답변을 못 받는 경우(비로그인 또는 비밀번호 분실)는 연락처 필수.
  const needsContact = !user || parsed.data.category === "password";
  if (needsContact && !parsed.data.contact) {
    return { error: "답변을 받을 연락처(전화·카카오톡 등)를 입력해주세요." };
  }

  const { error } = await supabase.from("inquiries").insert({
    user_id: user?.id ?? null,
    category: parsed.data.category,
    name: parsed.data.name,
    email: parsed.data.email,
    contact: parsed.data.contact,
    body: parsed.data.body,
  });
  if (error) {
    return { error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/support");
  return { done: true };
}

export interface AnswerInquiryState {
  error?: string;
  success?: string;
}

export async function answerInquiry(
  _prev: AnswerInquiryState,
  formData: FormData,
): Promise<AnswerInquiryState> {
  await requireAdmin();

  const parsed = answerSchema.safeParse({
    id: formData.get("id"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createSupabaseServer();
  // 존재하지 않는 id는 error 없이 0행 갱신으로 끝나므로 data.length로 실제 반영을 확인한다.
  const { error, data } = await supabase
    .from("inquiries")
    .update({ answer: parsed.data.answer, answered_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .select("id");
  if (error || data.length === 0) return { error: "답변 저장에 실패했습니다." };

  revalidatePath("/admin/inquiries");
  revalidatePath("/support");
  return { success: "답변을 저장했습니다." };
}
