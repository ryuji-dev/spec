import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getTrainingPostForEdit } from "@/server/services/training";
import { updatePost, deletePost } from "@/server/actions/training";
import EditorForm from "../../EditorForm";
import AttachmentManager from "@/app/_components/AttachmentManager";
import { TRAINING_UPLOAD } from "@/lib/training-upload";

export default async function EditTrainingPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = await getTrainingPostForEdit(id);
  if (!post) notFound();

  const update = updatePost.bind(null, id);
  const remove = deletePost.bind(null, id);

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <Link href={`/training/${id}`} style={{ fontSize: 13, color: "#666" }}>← 글 보기</Link>
      <h1 style={{ fontSize: 22 }}>글 수정</h1>
      <EditorForm
        action={update}
        initial={{
          title: post.title,
          category: post.category ?? undefined,
          excerpt: post.excerpt ?? undefined,
          body: post.body ?? undefined,
          isPinned: post.isPinned,
          eventDate: post.eventDate ?? undefined,
          location: post.location ?? undefined,
        }}
        submitLabel="수정 저장"
      />
      <AttachmentManager
        postId={id}
        initial={post.attachments}
        apiBase="/api/training"
        policy={TRAINING_UPLOAD}
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          글 삭제
        </button>
      </form>
    </main>
  );
}
