import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getTimetableRowForEdit } from "@/server/services/faculty";
import { updateTimetable, deleteTimetable } from "@/server/actions/timetable";
import EditorForm from "../../EditorForm";

export default async function EditTimetablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await getTimetableRowForEdit(id);
  if (!row) notFound();

  const update = updateTimetable.bind(null, id);
  const remove = deleteTimetable.bind(null, id);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/timetable" style={{ fontSize: 13, color: "#666" }}>← 목록</Link>
      <h1 style={{ fontSize: 22 }}>강의 수정</h1>
      <EditorForm
        action={update}
        initial={{
          day: row.day,
          time: row.time,
          course: row.course,
          prof: row.prof,
          room: row.room,
          host: row.host,
          sortOrder: row.sortOrder,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          강의 삭제
        </button>
      </form>
    </main>
  );
}
