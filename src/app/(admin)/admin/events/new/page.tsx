import { requireAdmin } from "@/server/auth/current-user";
import { createEvent } from "@/server/actions/events";
import EditorForm from "../EditorForm";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 수련회 이벤트</h1>
      <EditorForm action={createEvent} submitLabel="저장" />
    </main>
  );
}
