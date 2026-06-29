import { requireAdmin } from "@/server/auth/current-user";
import { createHeroSlide } from "@/server/actions/hero";
import NewForm from "../NewForm";
import styles from "../../_components/ui.module.css";

export default async function NewHeroPage() {
  await requireAdmin();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>새 배너 슬라이드</h1>
      </div>
      <NewForm action={createHeroSlide} />
    </div>
  );
}
