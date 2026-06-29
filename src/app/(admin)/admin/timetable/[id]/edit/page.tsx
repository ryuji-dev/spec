import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getTimetableRowForEdit } from "@/server/services/faculty";
import { updateTimetable, deleteTimetable } from "@/server/actions/timetable";
import EditorForm from "../../EditorForm";
import styles from "../../../_components/ui.module.css";

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
    <div className={styles.page}>
      <Link href="/admin/timetable" className={styles.backLink}>← 목록</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>강의 수정</h1>
      </div>
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
        <button type="submit" className={styles.btnDanger}>강의 삭제</button>
      </form>
    </div>
  );
}
