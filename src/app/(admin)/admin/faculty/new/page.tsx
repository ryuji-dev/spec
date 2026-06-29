import { requireAdmin } from "@/server/auth/current-user";
import { createFaculty } from "@/server/actions/faculty";
import EditorForm from "../EditorForm";
import styles from "../../_components/ui.module.css";

export default async function NewFacultyPage() {
  await requireAdmin();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 교수 등록</h1>
      </div>
      <EditorForm action={createFaculty} submitLabel="교수 추가" />
    </div>
  );
}
