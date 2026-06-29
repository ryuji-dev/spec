import { requireAdmin } from "@/server/auth/current-user";
import { createEvent } from "@/server/actions/events";
import EditorForm from "../EditorForm";
import styles from "../../_components/ui.module.css";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 수련회 이벤트</h1>
      </div>
      <EditorForm action={createEvent} submitLabel="저장" />
    </div>
  );
}
