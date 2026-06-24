import { requireAdmin } from "@/server/auth/current-user";
import { listResourcePostsForPicker } from "@/server/services/resource";
import { createCollection } from "@/server/actions/collections";
import EditorForm from "../EditorForm";

export default async function NewCollectionPage() {
  await requireAdmin();
  const picker = await listResourcePostsForPicker();
  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 컬렉션</h1>
      <EditorForm action={createCollection} picker={picker} submitLabel="저장" />
    </main>
  );
}
