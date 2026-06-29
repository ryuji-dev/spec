import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import {
  getCollectionForEdit,
  listResourcePostsForPicker,
} from "@/server/services/resource";
import { updateCollection, deleteCollection } from "@/server/actions/collections";
import EditorForm from "../../EditorForm";
import styles from "../../../_components/ui.module.css";

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [row, picker] = await Promise.all([
    getCollectionForEdit(id),
    listResourcePostsForPicker(),
  ]);
  if (!row) notFound();

  const update = updateCollection.bind(null, id);
  const remove = deleteCollection.bind(null, id);

  return (
    <div className={styles.page}>
      <Link href="/admin/collections" className={styles.backLink}>← 목록</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>컬렉션 수정</h1>
      </div>
      <EditorForm
        action={update}
        picker={picker}
        initial={{
          title: row.title,
          sub: row.sub,
          cover: row.cover,
          badge: row.badge,
          tag: row.tag,
          isPublished: row.isPublished,
          sortOrder: row.sortOrder,
          postIds: row.postIds,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" className={styles.btnDanger}>컬렉션 삭제</button>
      </form>
    </div>
  );
}
