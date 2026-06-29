import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listCollectionsForAdmin } from "@/server/services/resource";
import styles from "../_components/ui.module.css";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminCollectionsPage() {
  await requireAdmin();
  const rows = await listCollectionsForAdmin();

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>자료실 컬렉션 관리</h1>
        <Link href="/admin/collections/new" className={styles.btnGhost}>
          + 새 컬렉션
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>제목</th>
              <th>태그</th>
              <th>커버</th>
              <th>배지</th>
              <th>자료수</th>
              <th>공개</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={styles.cellTitle}>{r.title}</td>
                <td className={styles.cellMuted}>{r.tag}</td>
                <td className={styles.cellMuted}>{r.cover}</td>
                <td className={styles.cellMuted}>{r.badge ?? ""}</td>
                <td className={styles.cellMuted}>{r.itemCount}</td>
                <td>{r.isPublished ? <span className={styles.toggleOn}>✓</span> : ""}</td>
                <td>
                  <Link href={`/admin/collections/${r.id}/edit`} className={styles.rowLink}>수정</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>등록된 컬렉션이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
