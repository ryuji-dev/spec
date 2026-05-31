// 현재 로그인 사용자 조회 (서버 전용) — 쿠키의 세션 토큰을 검증하고 DB에서 사용자 로드.
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users, type User } from "@/server/db/schema";
import { verifySessionToken } from "./session";

export const SESSION_COOKIE = "session";

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, claims.sub))
    .limit(1);
  return rows[0] ?? null;
}

// 관리자 전용 진입점에서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
// 미인증·비관리자는 로그인으로 보낸다. proxy 가드를 통과해도 여기서 한 번 더 막는다.
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");
  return user;
}
