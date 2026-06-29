import { requireAdmin } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/training";
import EditorForm from "../EditorForm";
import styles from "../../_components/ui.module.css";

export default async function NewTrainingPostPage() {
  await requireAdmin();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 글 작성</h1>
        <p className={styles.pageDesc}>저장 후 편집 화면에서 파일을 첨부할 수 있습니다.</p>
      </div>
      <EditorForm action={createPost} submitLabel="저장하고 첨부하기" />
    </div>
  );
}
