import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listTimetableForAdmin } from "@/server/services/faculty";
import styles from "../_components/ui.module.css";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminTimetablePage() {
  await requireAdmin();
  const rows = await listTimetableForAdmin();

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>강의 시간표 관리</h1>
        <Link href="/admin/timetable/new" className={styles.btnGhost}>
          + 새 강의
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>요일</th>
              <th>시간</th>
              <th>강좌</th>
              <th>교수</th>
              <th>강의실</th>
              <th>학장</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.day}</td>
                <td className={styles.cellMuted}>{r.time}</td>
                <td className={styles.cellTitle}>{r.course}</td>
                <td>{r.prof}</td>
                <td className={styles.cellMuted}>{r.room}</td>
                <td>{r.host ? <span className={styles.toggleOn}>✓</span> : ""}</td>
                <td>
                  <Link href={`/admin/timetable/${r.id}/edit`} className={styles.rowLink}>수정</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>등록된 강의가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
