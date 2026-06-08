import { requireAdmin } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/webzine";
import EditorForm from "../EditorForm";

export default async function NewWebzineArticlePage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 기사 발행</h1>
      <EditorForm action={createPost} submitLabel="발행" />
    </main>
  );
}
