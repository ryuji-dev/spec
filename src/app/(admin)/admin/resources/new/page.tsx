import { requireAdmin } from "@/server/auth/current-user";
import { createResource } from "@/server/actions/resource";
import ResourceEditorForm from "../ResourceEditorForm";
import styles from "../../_components/ui.module.css";

export default async function NewResourcePage() {
  await requireAdmin();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 자료 등록</h1>
        <p className={styles.pageDesc}>저장 후 편집 화면에서 파일을 첨부할 수 있습니다.</p>
      </div>
      <ResourceEditorForm action={createResource} submitLabel="저장하고 첨부하기" />
    </div>
  );
}
