// Next 16 Proxy (구 middleware) — Supabase 세션 갱신 + 보호 라우트 가드.
// 역할은 JWT 커스텀 클레임(user_role)을 디코드해 확인(엣지에서 DB 미사용).
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// JWT 페이로드에서 user_role 클레임만 읽는다(검증은 getUser가 수행, 여기선 클레임 추출용).
function readRole(accessToken: string | undefined): string | undefined {
  if (!accessToken) return undefined;
  try {
    let b64 = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(b64)).user_role ?? undefined;
  } catch {
    return undefined;
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | undefined;
  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    role = readRole(session?.access_token);
  }

  const path = request.nextUrl.pathname;
  // /admin: admin 역할 필요. /board: 로그인이면 역할 무관 허용(matcher로 한정).
  const ok = path.startsWith("/admin") ? role === "admin" : user != null;

  if (!ok) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/board/:path*"],
};
