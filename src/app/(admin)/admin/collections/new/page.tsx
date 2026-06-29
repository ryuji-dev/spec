import { requireAdmin } from "@/server/auth/current-user";
import { listResourcePostsForPicker } from "@/server/services/resource";
import { createCollection } from "@/server/actions/collections";
import EditorForm from "../EditorForm";
import styles from "../../_components/ui.module.css";

export default async function NewCollectionPage() {
  await requireAdmin();
  const picker = await listResourcePostsForPicker();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 컬렉션</h1>
      </div>
      <EditorForm action={createCollection} picker={picker} submitLabel="저장" />
    </div>
  );
}
