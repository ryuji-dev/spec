import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getResourcePostForEdit } from "@/server/services/resource";
import { updateResource, deleteResource } from "@/server/actions/resource";
import ResourceEditorForm from "../../ResourceEditorForm";
import AttachmentManager from "@/app/_components/AttachmentManager";
import { RESOURCE_UPLOAD } from "@/lib/resource-upload";
import styles from "../../../_components/ui.module.css";

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
    <div className={styles.page}>
      <Link href={`/resources/${id}`} className={styles.backLink}>← 자료 보기</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>자료 수정</h1>
      </div>
      <ResourceEditorForm
        action={update}
        initial={{ title: resource.title, category: resource.category ?? undefined, sub: resource.sub, isPublished: resource.isPublished }}
        submitLabel="수정 저장"
      />
      <AttachmentManager
        postId={id}
        initial={resource.attachments}
        apiBase="/api/resources"
        policy={RESOURCE_UPLOAD}
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" className={styles.btnDanger}>자료 삭제</button>
      </form>
    </div>
  );
}
