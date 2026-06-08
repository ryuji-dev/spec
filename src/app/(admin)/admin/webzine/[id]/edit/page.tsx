import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getWebzineArticleForEdit } from "@/server/services/webzine";
import { updatePost, deletePost } from "@/server/actions/webzine";
import EditorForm from "../../EditorForm";

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
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <Link href={`/webzine/${id}`} style={{ fontSize: 13, color: "#666" }}>← 기사 보기</Link>
      <h1 style={{ fontSize: 22 }}>기사 수정</h1>
      <EditorForm
        action={update}
        initial={{
          title: article.title,
          category: article.category ?? undefined,
          excerpt: article.excerpt ?? undefined,
          body: article.body ?? undefined,
          isPinned: article.isPinned,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          기사 삭제
        </button>
      </form>
    </main>
  );
}
