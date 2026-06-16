import { requireAdmin } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/notice";
import EditorForm from "../EditorForm";

export default async function NewNoticePage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 공지 작성</h1>
      <EditorForm action={createPost} submitLabel="저장" />
    </main>
  );
}
