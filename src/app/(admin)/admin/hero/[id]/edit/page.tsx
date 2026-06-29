import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getHeroSlideForEdit } from "@/server/services/hero";
import { updateHeroSlide, deleteHeroSlide } from "@/server/actions/hero";
import EditForm from "../../EditForm";
import styles from "../../../_components/ui.module.css";

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
    <div className={styles.page}>
      <Link href="/admin/hero" className={styles.backLink}>← 목록</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>배너 슬라이드 수정</h1>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={row.url} alt={row.alt} style={{ width: "100%", maxWidth: 360, borderRadius: 8, marginBottom: 12, display: "block" }} />
      <p className={styles.hint} style={{ marginBottom: 16 }}>
        이미지를 바꾸려면 이 슬라이드를 삭제하고 새로 업로드해주세요.
      </p>
      <EditForm action={update} initial={{ alt: row.alt, isPublished: row.isPublished, sortOrder: row.sortOrder }} />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" className={styles.btnDanger}>슬라이드 삭제</button>
      </form>
    </div>
  );
}
