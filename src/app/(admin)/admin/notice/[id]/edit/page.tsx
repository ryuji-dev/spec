import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getNoticePostForEdit } from "@/server/services/notice";
import { updatePost, deletePost } from "@/server/actions/notice";
import EditorForm from "../../EditorForm";
import styles from "../../../_components/ui.module.css";

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = await getNoticePostForEdit(id);
  if (!post) notFound();

  const update = updatePost.bind(null, id);
  const remove = deletePost.bind(null, id);

  return (
    <div className={styles.page}>
      <Link href={`/notice/${id}`} className={styles.backLink}>← 글 보기</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>공지 수정</h1>
      </div>
      <EditorForm
        action={update}
        initial={{
          title: post.title,
          excerpt: post.excerpt ?? undefined,
          body: post.body ?? undefined,
          isPinned: post.isPinned,
          isPublished: post.isPublished,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" className={styles.btnDanger}>공지 삭제</button>
      </form>
    </div>
  );
}
