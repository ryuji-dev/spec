import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import type { PostSection } from "@/lib/section-meta";

export type ContentStat = {
  section: PostSection;
  label: string;
  href: string;
  total: number;
  unpublished: number;
};

// admin 네비와 일치하는 라벨·경로(자료실은 /admin/resources 복수형).
const DOMAINS: { section: PostSection; label: string; href: string }[] = [
  { section: "notice", label: "공지", href: "/admin/notice" },
  { section: "training", label: "강습회", href: "/admin/training" },
  { section: "committee", label: "위원회 소식", href: "/admin/committee" },
  { section: "webzine", label: "웹진", href: "/admin/webzine" },
  { section: "resource", label: "자료실", href: "/admin/resources" },
];

// admin 전용: 5개 도메인 전체/미공개 건수를 단일 쿼리로 집계.
// RLS admin select 정책으로 미공개 글까지 조회된다.
export async function getAdminContentStats(): Promise<ContentStat[]> {
  const supabase = await createSupabaseServer();
  const sections = DOMAINS.map((d) => d.section);
  const { data, error } = await supabase
    .from("posts")
    .select("section, is_published")
    .in("section", sections);
  if (error) throw error;
  const rows = data ?? [];

  return DOMAINS.map((d) => {
    const inSection = rows.filter((r) => r.section === d.section);
    return {
      section: d.section,
      label: d.label,
      href: d.href,
      total: inSection.length,
      unpublished: inSection.filter((r) => r.is_published === false).length,
    };
  });
}
