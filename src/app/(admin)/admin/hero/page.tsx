import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listHeroForAdmin } from "@/server/services/hero";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminHeroPage() {
  await requireAdmin();
  const rows = await listHeroForAdmin();

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>메인 히어로 관리</h1>
        <Link href="/admin/hero/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 슬라이드
        </Link>
      </div>
      <p style={{ color: "#666", fontSize: 13 }}>
        사진이 없으면 메인 히어로는 기본 아트 배경으로 표시됩니다.
      </p>

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>미리보기</th>
            <th style={{ padding: "8px 6px" }}>대체 텍스트</th>
            <th style={{ padding: "8px 6px" }}>순서</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt={r.alt} style={{ width: 120, height: 60, objectFit: "cover", borderRadius: 4 }} />
              </td>
              <td style={{ padding: "8px 6px" }}>{r.alt || <span style={{ color: "#bbb" }}>—</span>}</td>
              <td style={{ padding: "8px 6px" }}>{r.sortOrder}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <Link href={`/admin/hero/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 슬라이드가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
