import { requireAdmin } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/webzine";
import EditorForm from "../EditorForm";
import styles from "../../_components/ui.module.css";

export default async function NewWebzineArticlePage() {
  await requireAdmin();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 기사 발행</h1>
      </div>
      <EditorForm action={createPost} submitLabel="발행" />
    </div>
  );
}
