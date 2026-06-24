import { requireAdmin } from "@/server/auth/current-user";
import { createTimetable } from "@/server/actions/timetable";
import EditorForm from "../EditorForm";

export default async function NewTimetablePage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 강의</h1>
      <EditorForm action={createTimetable} submitLabel="저장" />
    </main>
  );
}
