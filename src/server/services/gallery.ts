import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatDate } from "@/lib/format";
import type { PhotoTileType } from "@/lib/main-page-data";
import { SECTION_LABEL, SECTION_PHOTO_TYPE, SECTION_ROUTE } from "@/lib/section-meta";

export type GalleryTile = {
  postId: string;
  imageId: string; // 첫 이미지 첨부 id → /api/files/{imageId}
  title: string;
  date: string; // formatDate(created_at)
  tag: string; // category ?? 섹션 라벨
  type: PhotoTileType; // 이미지 로드 실패 시 그라데이션 폴백
  href: string; // 섹션→경로 매핑 + /{postId}
};


export async function getGalleryData(): Promise<GalleryTile[]> {
  const supabase = await createSupabaseServer();
  // 이미지 첨부가 있는 공개 글 전체, 최신순(limit 없음).
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, section, created_at, attachments!inner(id, mime, created_at)")
    .eq("is_published", true)
    .like("attachments.mime", "image/%")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .map((r) => {
      const imgs = ((r.attachments ?? []) as { id: string; mime: string; created_at: string }[])
        .filter((img) => img.mime.startsWith("image/"));
      // 글당 첫 이미지(업로드 순). !inner로 최소 1건 보장되나 strict 대비 가드.
      const first = [...imgs].sort(
        (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
      )[0];
      if (!first) return null;
      const route = SECTION_ROUTE[r.section];
      if (!route) return null; // 상세 경로가 없는 섹션은 제외(링크 대상 없음)
      return {
        postId: r.id,
        imageId: first.id,
        title: r.title,
        date: formatDate(new Date(r.created_at)),
        tag: r.category ?? SECTION_LABEL[r.section] ?? "",
        type: SECTION_PHOTO_TYPE[r.section] ?? "mountain",
        href: `${route}/${r.id}`,
      };
    })
    .filter((t): t is GalleryTile => t !== null);
}
