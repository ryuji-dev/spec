import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listCollectionsForAdmin } from "@/server/services/resource";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminCollectionsPage() {
  await requireAdmin();
  const rows = await listCollectionsForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>자료실 컬렉션 관리</h1>
        <Link href="/admin/collections/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 컬렉션
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>태그</th>
            <th style={{ padding: "8px 6px" }}>커버</th>
            <th style={{ padding: "8px 6px" }}>배지</th>
            <th style={{ padding: "8px 6px" }}>자료수</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.tag}</td>
              <td style={{ padding: "8px 6px" }}>{r.cover}</td>
              <td style={{ padding: "8px 6px" }}>{r.badge ?? ""}</td>
              <td style={{ padding: "8px 6px" }}>{r.itemCount}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <Link href={`/admin/collections/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: "16px 6px", color: "#888" }}>등록된 컬렉션이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
