import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listEventsForAdmin } from "@/server/services/training";
import styles from "../_components/ui.module.css";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminEventsPage() {
  await requireAdmin();
  const rows = await listEventsForAdmin();

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>수련회 이벤트 관리</h1>
        <Link href="/admin/events/new" className={styles.btnGhost}>
          + 새 이벤트
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>제목</th>
              <th>기간</th>
              <th>상태</th>
              <th>장소</th>
              <th>공개</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={styles.cellTitle}>{r.title}</td>
                <td className={styles.cellMuted}>{r.dates}</td>
                <td>{r.status}</td>
                <td className={styles.cellMuted}>{r.place}</td>
                <td>{r.isPublished ? <span className={styles.toggleOn}>✓</span> : ""}</td>
                <td>
                  <Link href={`/admin/events/${r.id}/edit`} className={styles.rowLink}>수정</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>등록된 이벤트가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
