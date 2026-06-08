// Supabase 브라우저 클라이언트 — 클라이언트 컴포넌트에서 직접 호출이 필요할 때만.
"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function createSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
