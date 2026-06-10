"use server";
// 로그인·로그아웃·회원가입 Server Action. 입력은 zod 검증, 세션은 Supabase Auth(@supabase/ssr 쿠키).
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  loginSchema,
  newPasswordSchema,
  resetRequestSchema,
  signupSchema,
} from "@/lib/dto/auth";
import { createSupabaseServer } from "@/server/supabase/server";
import { readUserRole } from "@/lib/jwt-role";
import { safeNext } from "@/lib/safe-redirect";

// 확인·복구 메일 콜백의 절대 origin — 운영은 NEXT_PUBLIC_SITE_URL, 없으면 요청 헤더.
async function requestOrigin(): Promise<string> {
  const h = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`
  );
}

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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  // 사용자 부재·비번 불일치를 동일 메시지로 (계정 존재 여부 노출 방지)
  if (error || !data.session) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  // 리다이렉트: 유효한 내부 next 우선, 없으면 역할별 기본(admin→/admin, member→/main).
  // 역할은 방금 발급된 세션 JWT의 user_role 클레임에서 직접 읽는다(추가 getUser 왕복·쿠키 가시성 의존 제거).
  const nextRaw = formData.get("next");
  const requested = typeof nextRaw === "string" ? safeNext(nextRaw, "") : "";
  const role = readUserRole(data.session.access_token);
  const fallback = role === "admin" ? "/admin" : "/main";
  redirect(requested || fallback);
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface SignupState {
  error?: string;
  sent?: boolean;
}

// 셀프 회원가입 — supabase.auth.signUp() 호출. 트리거(handle_new_user)가 member 프로필 생성.
// 이메일 인증(enable_confirmations) 켜져 있어 가입 직후 세션 없음 → 확인 메일 안내.
export async function signup(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    church: formData.get("church"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    terms: formData.get("terms") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { name, church, email, password } = parsed.data;

  const origin = await requestOrigin();

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, church },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  // 명시적 실패(rate limit 등)는 일반 메시지. 계정 존재 여부는 노출하지 않는다.
  if (error) {
    return { error: "가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  return { sent: true };
}

export interface ResetRequestState {
  error?: string;
  sent?: boolean;
}

// 비밀번호 재설정 메일 요청 — 계정 존재 여부를 노출하지 않도록 결과는 항상 동일하게 응답.
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "이메일 형식을 확인해주세요." };
  }

  const origin = await requestOrigin();
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  // rate limit 등 명시적 실패만 일반 메시지(존재 여부 비노출 — 미존재 계정은 error 없이 통과).
  if (error) {
    return { error: "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  return { sent: true };
}

export interface UpdatePasswordState {
  error?: string;
}

// 새 비밀번호 설정 — 복구 링크(verifyOtp)로 생성된 세션이 있어야 한다(페이지 가드 + 여기서 재확인).
export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "세션이 만료되었습니다. 재설정 메일을 다시 요청해주세요." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "비밀번호 변경에 실패했습니다. 다른 비밀번호로 시도해주세요." };
  }

  redirect("/main");
}
