"use server";
// 로그인·로그아웃·회원가입 Server Action. 입력은 zod 검증, 세션은 Supabase Auth(@supabase/ssr 쿠키).
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  loginSchema,
  newPasswordSchema,
  signupSchema,
} from "@/lib/dto/auth";
import { createSupabaseServer } from "@/server/supabase/server";
import { readUserRole } from "@/lib/jwt-role";
import { safeNext } from "@/lib/safe-redirect";

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
}

// 셀프 회원가입 — supabase.auth.signUp() 호출. 트리거(handle_new_user)가 member 프로필 생성.
// 이메일 인증 미사용(enable_confirmations=false) → 가입 즉시 세션이 생기므로 바로 /main 이동.
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

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, church } },
  });

  // 중복 이메일 등 실패는 일반 메시지(계정 존재 여부 비노출).
  if (error || !data.session) {
    return { error: "가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  redirect("/main");
}

export interface UpdatePasswordState {
  error?: string;
}

// 비밀번호 변경 — 로그인 사용자 본인이 새 비밀번호를 설정한다(페이지 가드 + 여기서 세션 재확인).
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
    return { error: "세션이 만료되었습니다. 다시 로그인해주세요." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "비밀번호 변경에 실패했습니다. 다른 비밀번호로 시도해주세요." };
  }

  redirect("/main");
}

const ALLOWED_PROVIDERS = ["google", "kakao"] as const;
type OAuthProvider = (typeof ALLOWED_PROVIDERS)[number];

// 소셜 로그인 시작 — 폼 액션. provider 화이트리스트 검증 후 공급자 인증 URL로 보낸다.
// redirectTo는 현재 요청 origin 기준 /auth/callback(+next). 콜백이 세션을 발급한다.
export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "");
  const fail = (msg: string) =>
    redirect(`/login?notice=${encodeURIComponent(msg)}`);

  if (!ALLOWED_PROVIDERS.includes(provider as OAuthProvider)) {
    return fail("지원하지 않는 로그인 방식입니다.");
  }

  const next = safeNext(String(formData.get("next") ?? ""), "/main");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "127.0.0.1:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const redirectTo = `${proto}://${host}/auth/callback?next=${encodeURIComponent(next)}`;

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: { redirectTo },
  });

  if (error || !data.url) {
    return fail("로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  redirect(data!.url!);
}
