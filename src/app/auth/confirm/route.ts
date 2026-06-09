// 이메일 확인 콜백 — 확인 메일의 token_hash 링크가 여기로 온다. verifyOtp로 세션 생성 후 next로 이동.
// (콜백 전용이라 응답은 redirect — 일반 Route Handler JSON 스키마 비적용.)
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/server/supabase/server";
import { safeNext } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const failUrl = new URL("/login", request.url);
  failUrl.searchParams.set("error", "확인 링크가 만료되었거나 유효하지 않습니다.");
  return NextResponse.redirect(failUrl);
}
