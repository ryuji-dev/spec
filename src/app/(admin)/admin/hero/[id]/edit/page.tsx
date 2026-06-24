import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getHeroSlideForEdit } from "@/server/services/hero";
import { updateHeroSlide, deleteHeroSlide } from "@/server/actions/hero";
import EditForm from "../../EditForm";

export default async function EditHeroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await getHeroSlideForEdit(id);
  if (!row) notFound();

  const update = updateHeroSlide.bind(null, id);
  const remove = deleteHeroSlide.bind(null, id);

  return (
    <main style={{ maxWidth: 540, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/hero" style={{ fontSize: 13, color: "#666" }}>← 목록</Link>
      <h1 style={{ fontSize: 22 }}>히어로 슬라이드 수정</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={row.url} alt={row.alt} style={{ width: "100%", maxWidth: 360, borderRadius: 6, marginBottom: 16 }} />
      <p style={{ color: "#888", fontSize: 12, marginTop: 0 }}>
        이미지를 바꾸려면 이 슬라이드를 삭제하고 새로 업로드해주세요.
      </p>
      <EditForm action={update} initial={{ alt: row.alt, isPublished: row.isPublished, sortOrder: row.sortOrder }} />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          슬라이드 삭제
        </button>
      </form>
    </main>
  );
}
