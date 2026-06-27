import { requireAdmin } from "@/server/auth/current-user";
import CreateUserForm from "./CreateUserForm";
import AdminResetPasswordForm from "./AdminResetPasswordForm";
import { getAdminContentStats } from "@/server/services/admin-stats";
import StatCard from "./_components/StatCard";
import styles from "./_components/ui.module.css";

// proxy·레이아웃이 1차 가드, 여기서 서버 권한을 재확인한다.
export default async function AdminPage() {
  await requireAdmin();
  const stats = await getAdminContentStats();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>대시보드</h1>
        <p className={styles.pageDesc}>콘텐츠 현황과 계정 관리</p>
      </div>

      <div className={styles.sectionLabel}>콘텐츠 현황</div>
      <div className={styles.cardGrid} style={{ marginBottom: 24 }}>
        {stats.map((s) => (
          <StatCard key={s.section} stat={s} />
        ))}
      </div>

      <div className={styles.sectionGrid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>계정 생성</h2>
          <p className={styles.cardDesc}>
            직함이 필요한 회원·관리자 계정을 발급합니다.
          </p>
          <CreateUserForm />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>회원 비밀번호 재설정</h2>
          <p className={styles.cardDesc}>
            임시 비밀번호를 발급해 연락처로 전달한 뒤, 회원이 /reset-password에서
            직접 변경하도록 안내해주세요.
          </p>
          <AdminResetPasswordForm />
        </section>
      </div>
    </div>
  );
}
