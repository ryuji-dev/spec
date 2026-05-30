// Next 16 Proxy (구 middleware) — 보호 라우트 가드.
// DB는 쓰지 않고 토큰 클레임의 role만 확인(엣지 안전). 페이지에서 서버 권한 재확인은 별도(헌법).
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/server/auth/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims || claims.role !== "admin") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
