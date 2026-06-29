import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listFacultyForAdmin } from "@/server/services/faculty";
import { FACULTY_DEPT_META } from "@/lib/faculty";
import styles from "../_components/ui.module.css";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminFacultyPage() {
  await requireAdmin();
  const rows = await listFacultyForAdmin();

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>신학원 교수 관리</h1>
        <Link href="/admin/faculty/new" className={styles.btnGhost}>
          + 새 교수
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>부서</th>
              <th>커버</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={styles.cellTitle}>{r.name}</td>
                <td className={styles.cellMuted}>{FACULTY_DEPT_META[r.dept].ko}</td>
                <td>{r.isCover ? <span className={styles.toggleOn}>✓</span> : ""}</td>
                <td>
                  <Link href={`/admin/faculty/${r.id}/edit`} className={styles.rowLink}>수정</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>등록된 교수가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
