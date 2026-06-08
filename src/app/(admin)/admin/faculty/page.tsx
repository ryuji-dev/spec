import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listFacultyForAdmin } from "@/server/services/faculty";
import { FACULTY_DEPT_META } from "@/lib/faculty";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminFacultyPage() {
  await requireAdmin();
  const rows = await listFacultyForAdmin();

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>신학원 교수 관리</h1>
        <Link href="/admin/faculty/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 교수
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>이름</th>
            <th style={{ padding: "8px 6px" }}>부서</th>
            <th style={{ padding: "8px 6px" }}>커버</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.name}</td>
              <td style={{ padding: "8px 6px" }}>{FACULTY_DEPT_META[r.dept].ko}</td>
              <td style={{ padding: "8px 6px" }}>{r.isCover ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <Link href={`/admin/faculty/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: "16px 6px", color: "#888" }}>등록된 교수가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
