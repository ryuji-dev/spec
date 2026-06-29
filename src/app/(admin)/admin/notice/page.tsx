import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listNoticesForAdmin } from "@/server/services/notice";
import { deletePost, togglePublished } from "@/server/actions/notice";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";
import PublishToggle from "../_components/PublishToggle";
import styles from "../_components/ui.module.css";

export default async function AdminNoticePage() {
  await requireAdmin();
  const rows = await listNoticesForAdmin();

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>공지 관리</h1>
        <Link href="/admin/notice/new" className={styles.btnGhost}>
          + 새 글
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>제목</th>
              <th>고정</th>
              <th>작성일</th>
              <th>공개</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={styles.cellTitle}>{r.title}</td>
                <td>{r.isPinned ? <span className={styles.pin}>📌</span> : ""}</td>
                <td className={styles.cellMuted}>{isoToKstDate(r.createdAt)}</td>
                <td>
                  <PublishToggle action={togglePublished.bind(null, r.id, !r.isPublished)} isPublished={r.isPublished} />
                </td>
                <td>
                  <span className={styles.rowActions}>
                    <Link href={`/admin/notice/${r.id}/edit`} className={styles.rowLink}>수정</Link>
                    <DeletePostButton action={deletePost.bind(null, r.id)} />
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>등록된 공지가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
