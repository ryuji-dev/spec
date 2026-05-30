"use server";
// 로그인·로그아웃 Server Action. 입력은 zod 검증, 세션은 httpOnly·SameSite=Lax 쿠키.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { verifyPassword } from "@/server/auth/password";
import { createSessionToken } from "@/server/auth/session";
import { SESSION_COOKIE } from "@/server/auth/current-user";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export interface LoginState {
  error?: string;
}

const SEVEN_DAYS = 60 * 60 * 24 * 7;

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

  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const user = rows[0];

  // 사용자 부재·비번 불일치를 동일 메시지로 (계정 존재 여부 노출 방지)
  if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const token = await createSessionToken({ sub: user.id, role: user.role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });

  redirect("/admin");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
