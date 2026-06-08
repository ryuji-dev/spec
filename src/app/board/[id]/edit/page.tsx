import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBoardPost } from "@/server/services/board";
import { getCurrentUser } from "@/server/auth/current-user";
import { updatePost } from "@/server/actions/board";
import BoardEditorForm from "../../new/BoardEditorForm";

// 회원 글 수정 화면. 작성 폼(BoardEditorForm)을 updatePost에 배선해 재사용.
export default async function BoardEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/board/${id}/edit`);
  const post = await getBoardPost(id);
  if (!post) notFound();
  // 권한: 작성자 본인 또는 admin. (서버 액션 updatePost 진입부에서도 재확인 — 이중 방어)
  const canEdit = user.role === "admin" || post.authorId === user.id;
  if (!canEdit) redirect(`/board/${id}`);

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href={`/board/${id}`} style={{ fontSize: 13, color: "#666" }}>← 글로 돌아가기</Link>
      <h1 style={{ fontSize: 24, lineHeight: 1.3, margin: "16px 0 20px" }}>글 수정</h1>
      <BoardEditorForm
        action={updatePost.bind(null, id)}
        defaultTitle={post.title}
        defaultBody={post.body ?? ""}
        defaultCategory={post.category ?? undefined}
        submitLabel="수정 완료"
      />
    </main>
  );
}
