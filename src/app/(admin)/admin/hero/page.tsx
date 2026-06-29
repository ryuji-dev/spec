import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listHeroForAdmin } from "@/server/services/hero";
import styles from "../_components/ui.module.css";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminHeroPage() {
  await requireAdmin();
  const rows = await listHeroForAdmin();

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>메인 히어로 관리</h1>
          <p className={styles.pageDesc}>
            사진이 없으면 메인 히어로는 기본 아트 배경으로 표시됩니다.
          </p>
        </div>
        <Link href="/admin/hero/new" className={styles.btnGhost}>
          + 새 슬라이드
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>미리보기</th>
              <th>대체 텍스트</th>
              <th>순서</th>
              <th>공개</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={r.alt} style={{ width: 120, height: 60, objectFit: "cover", borderRadius: 4, display: "block" }} />
                </td>
                <td>{r.alt || <span className={styles.cellMuted}>—</span>}</td>
                <td className={styles.cellMuted}>{r.sortOrder}</td>
                <td>{r.isPublished ? <span className={styles.toggleOn}>✓</span> : ""}</td>
                <td>
                  <Link href={`/admin/hero/${r.id}/edit`} className={styles.rowLink}>수정</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>등록된 슬라이드가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
