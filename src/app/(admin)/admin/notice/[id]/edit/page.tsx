import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getNoticePostForEdit } from "@/server/services/notice";
import { updatePost, deletePost } from "@/server/actions/notice";
import EditorForm from "../../EditorForm";

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
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <Link href={`/notice/${id}`} style={{ fontSize: 13, color: "#666" }}>← 글 보기</Link>
      <h1 style={{ fontSize: 22 }}>공지 수정</h1>
      <EditorForm
        action={update}
        initial={{
          title: post.title,
          excerpt: post.excerpt ?? undefined,
          body: post.body ?? undefined,
          isPinned: post.isPinned,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          공지 삭제
        </button>
      </form>
    </main>
  );
}
