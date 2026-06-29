import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getWebzineArticleForEdit } from "@/server/services/webzine";
import { updatePost, deletePost } from "@/server/actions/webzine";
import EditorForm from "../../EditorForm";
import styles from "../../../_components/ui.module.css";

export default async function EditWebzineArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const article = await getWebzineArticleForEdit(id);
  if (!article) notFound();

  const update = updatePost.bind(null, id);
  const remove = deletePost.bind(null, id);

  return (
    <div className={styles.page}>
      <Link href={`/webzine/${id}`} className={styles.backLink}>← 기사 보기</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>기사 수정</h1>
      </div>
      <EditorForm
        action={update}
        initial={{
          title: article.title,
          category: article.category ?? undefined,
          excerpt: article.excerpt ?? undefined,
          body: article.body ?? undefined,
          isPinned: article.isPinned,
          isPublished: article.isPublished,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" className={styles.btnDanger}>기사 삭제</button>
      </form>
    </div>
  );
}
