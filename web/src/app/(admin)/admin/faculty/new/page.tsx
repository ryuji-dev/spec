import { requireAdmin } from "@/server/auth/current-user";
import { createFaculty } from "@/server/actions/faculty";
import EditorForm from "../EditorForm";

export default async function NewFacultyPage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 교수 등록</h1>
      <EditorForm action={createFaculty} submitLabel="교수 추가" />
    </main>
  );
}
