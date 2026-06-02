import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getResourcePostForEdit } from "@/server/services/resource";
import { updateResource, deleteResource } from "@/server/actions/resource";
import ResourceEditorForm from "../../ResourceEditorForm";
import ResourceAttachmentManager from "../../ResourceAttachmentManager";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const resource = await getResourcePostForEdit(id);
  if (!resource) notFound();

  const update = updateResource.bind(null, id);
  const remove = deleteResource.bind(null, id);

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <Link href={`/resources/${id}`} style={{ fontSize: 13, color: "#666" }}>← 자료 보기</Link>
      <h1 style={{ fontSize: 22 }}>자료 수정</h1>
      <ResourceEditorForm
        action={update}
        initial={{ title: resource.title, category: resource.category ?? undefined, sub: resource.sub }}
        submitLabel="수정 저장"
      />
      <ResourceAttachmentManager postId={id} initial={resource.attachments} />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>자료 삭제</button>
      </form>
    </main>
  );
}
