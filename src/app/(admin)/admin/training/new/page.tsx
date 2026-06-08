import { requireAdmin } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/training";
import EditorForm from "../EditorForm";

export default async function NewTrainingPostPage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 글 작성</h1>
      <p style={{ color: "#666", fontSize: 13 }}>저장 후 편집 화면에서 파일을 첨부할 수 있습니다.</p>
      <EditorForm action={createPost} submitLabel="저장하고 첨부하기" />
    </main>
  );
}
