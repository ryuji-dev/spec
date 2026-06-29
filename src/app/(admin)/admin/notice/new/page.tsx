import { requireAdmin } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/notice";
import EditorForm from "../EditorForm";
import styles from "../../_components/ui.module.css";

export default async function NewNoticePage() {
  await requireAdmin();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 공지 작성</h1>
      </div>
      <EditorForm action={createPost} submitLabel="저장" />
    </div>
  );
}
