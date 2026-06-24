import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import {
  getCollectionForEdit,
  listResourcePostsForPicker,
} from "@/server/services/resource";
import { updateCollection, deleteCollection } from "@/server/actions/collections";
import EditorForm from "../../EditorForm";

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
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/collections" style={{ fontSize: 13, color: "#666" }}>← 목록</Link>
      <h1 style={{ fontSize: 22 }}>컬렉션 수정</h1>
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
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          컬렉션 삭제
        </button>
      </form>
    </main>
  );
}
