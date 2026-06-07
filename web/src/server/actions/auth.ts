"use server";
// 로그인·로그아웃 Server Action. 입력은 zod 검증, 세션은 Supabase Auth(@supabase/ssr 쿠키).
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "이메일·비밀번호 형식을 확인해주세요." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  // 사용자 부재·비번 불일치를 동일 메시지로 (계정 존재 여부 노출 방지)
  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/admin");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
