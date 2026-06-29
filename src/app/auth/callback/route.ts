import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/server/supabase/server";
import { safeNext } from "@/lib/safe-redirect";

// OAuth 공급자 인증 후 돌아오는 콜백. code를 세션으로 교환(PKCE 쿠키 사용)하고
// 안전한 next(기본 /main)로 이동한다. 실패 시 로그인 화면에 안내를 띄운다.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next") ?? "", "/main");
  const fail = (msg: string) =>
    NextResponse.redirect(
      new URL(`/login?notice=${encodeURIComponent(msg)}`, url.origin),
    );

  if (!code) return fail("로그인을 완료하지 못했습니다. 다시 시도해주세요.");

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("로그인을 완료하지 못했습니다. 다시 시도해주세요.");

  return NextResponse.redirect(new URL(next, url.origin));
}
