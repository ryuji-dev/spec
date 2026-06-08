// Supabase 서버 클라이언트 — 사용자 세션(쿠키)으로 동작. RLS가 사용자 권한으로 적용된다.
// Server Component·Server Action에서 읽기/쓰기에 사용.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 렌더 컨텍스트에서는 쿠키 쓰기가 불가 — proxy가 세션을 갱신하므로 무시.
          }
        },
      },
    },
  );
}
