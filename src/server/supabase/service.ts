// Supabase service-role 클라이언트 — RLS 우회 특권 작업 전용(예: admin 계정 생성).
// ⚠️ server-only. service_role 키는 절대 클라이언트 번들에 유입되면 안 된다.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createSupabaseService() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
