// 문의 조회 — RLS가 역할별 범위를 결정한다(admin 전체, member 본인, anon 없음).
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import type { InquiryCategory } from "@/lib/dto/inquiry";

export type InquiryRow = {
  id: string;
  category: InquiryCategory;
  name: string;
  email: string;
  contact: string | null;
  body: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
};

export async function listInquiries(): Promise<InquiryRow[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("inquiries")
    .select("id, category, name, email, contact, body, answer, answered_at, created_at")
    .order("created_at", { ascending: false });
  return (data as InquiryRow[]) ?? [];
}

// admin 전용: 미답변(접수됨) 문의 건수. answer is null 기준.
export async function countUnansweredInquiries(): Promise<number> {
  const supabase = await createSupabaseServer();
  const { count } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .is("answer", null);
  return count ?? 0;
}
