// Next 16 Proxy (구 middleware) — 보호 라우트 가드.
// DB는 쓰지 않고 토큰 클레임의 role만 확인(엣지 안전). 페이지에서 서버 권한 재확인은 별도(헌법).
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/server/auth/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const claims = token ? await verifySessionToken(token) : null;

  const path = request.nextUrl.pathname;
  // /admin: admin 역할 필요. /board: 로그인이면 역할 무관 허용.
  const ok = path.startsWith("/admin")
    ? claims?.role === "admin"
    : claims != null; // /board (matcher로 한정)

  if (!ok) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/board/:path*"],
};
