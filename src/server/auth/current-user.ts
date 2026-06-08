// 현재 로그인 사용자 조회 (서버 전용) — Supabase 세션에서 사용자 + profiles 로드.
import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/server/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  role: "admin" | "member";
  name: string;
  title: string | null;
  church: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, title, church")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile.role,
    name: profile.name,
    title: profile.title,
    church: profile.church,
  };
}

// 관리자 전용 진입점에서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
// 미인증·비관리자는 로그인으로 보낸다. proxy 가드를 통과해도 여기서 한 번 더 막는다.
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");
  return user;
}
