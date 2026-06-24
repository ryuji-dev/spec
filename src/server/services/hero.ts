import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { heroPublicUrl } from "@/server/uploads/hero";
import type { HeroSlideView } from "@/lib/hero";

// 공개 슬라이드 — is_published, sort_order 순. 없으면 빈 배열(공개 화면이 SVG 폴백 판단).
export async function getHeroSlides(): Promise<HeroSlideView[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("hero_slides")
    .select("image_path, alt")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ url: heroPublicUrl(r.image_path), alt: r.alt }));
}

export type HeroAdminRow = {
  id: string;
  url: string;
  alt: string;
  isPublished: boolean;
  sortOrder: number;
};

export async function listHeroForAdmin(): Promise<HeroAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id, image_path, alt, is_published, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    url: heroPublicUrl(r.image_path),
    alt: r.alt,
    isPublished: r.is_published,
    sortOrder: r.sort_order,
  }));
}

export type HeroEditData = {
  id: string;
  url: string;
  alt: string;
  isPublished: boolean;
  sortOrder: number;
};

export async function getHeroSlideForEdit(id: string): Promise<HeroEditData | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("hero_slides")
    .select("id, image_path, alt, is_published, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  return {
    id: r.id,
    url: heroPublicUrl(r.image_path),
    alt: r.alt,
    isPublished: r.is_published,
    sortOrder: r.sort_order,
  };
}
