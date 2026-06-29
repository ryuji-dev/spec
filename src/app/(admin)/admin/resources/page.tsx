import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listResourcePostsForAdmin } from "@/server/services/resource";
import { deleteResource, togglePublished } from "@/server/actions/resource";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";
import PublishToggle from "../_components/PublishToggle";
import styles from "../_components/ui.module.css";

export default async function AdminResourcesPage() {
  await requireAdmin();
  const rows = await listResourcePostsForAdmin();

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>자료실 관리</h1>
        <Link href="/admin/resources/new" className={styles.btnGhost}>
          + 새 글
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>제목</th>
              <th>분류</th>
              <th>작성일</th>
              <th>공개</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={styles.cellTitle}>{r.title}</td>
                <td className={styles.cellMuted}>{r.category ?? "-"}</td>
                <td className={styles.cellMuted}>{isoToKstDate(r.createdAt)}</td>
                <td>
                  <PublishToggle action={togglePublished.bind(null, r.id, !r.isPublished)} isPublished={r.isPublished} />
                </td>
                <td>
                  <span className={styles.rowActions}>
                    <Link href={`/admin/resources/${r.id}/edit`} className={styles.rowLink}>수정</Link>
                    <DeletePostButton action={deleteResource.bind(null, r.id)} />
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>등록된 자료가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
