import { requireAdmin } from "@/server/auth/current-user";
import { createTimetable } from "@/server/actions/timetable";
import EditorForm from "../EditorForm";
import styles from "../../_components/ui.module.css";

export default async function NewTimetablePage() {
  await requireAdmin();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 강의</h1>
      </div>
      <EditorForm action={createTimetable} submitLabel="저장" />
    </div>
  );
}
