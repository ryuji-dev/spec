// 공개 헤더의 장식용 분기를 위한 경량 role 조회(서버 전용).
// 실제 권한 가드는 proxy.ts + requireAdmin이 담당하므로, 여기서는 DB 조회 없이
// 쿠키 세션의 access_token에서 user_role 클레임만 읽는다(proxy.ts와 동일 패턴).
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { readUserRole } from "@/lib/jwt-role";

export async function getViewerIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return readUserRole(session?.access_token) === "admin";
  } catch {
    // 만료·무효 토큰 등 세션 조회 실패는 비관리자로 처리(장식용 링크라 페이지를 깨면 안 됨).
    return false;
  }
}
