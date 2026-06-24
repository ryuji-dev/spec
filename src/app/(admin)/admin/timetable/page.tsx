import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listTimetableForAdmin } from "@/server/services/faculty";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminTimetablePage() {
  await requireAdmin();
  const rows = await listTimetableForAdmin();

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>강의 시간표 관리</h1>
        <Link href="/admin/timetable/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 강의
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>요일</th>
            <th style={{ padding: "8px 6px" }}>시간</th>
            <th style={{ padding: "8px 6px" }}>강좌</th>
            <th style={{ padding: "8px 6px" }}>교수</th>
            <th style={{ padding: "8px 6px" }}>강의실</th>
            <th style={{ padding: "8px 6px" }}>학장</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.day}</td>
              <td style={{ padding: "8px 6px" }}>{r.time}</td>
              <td style={{ padding: "8px 6px" }}>{r.course}</td>
              <td style={{ padding: "8px 6px" }}>{r.prof}</td>
              <td style={{ padding: "8px 6px" }}>{r.room}</td>
              <td style={{ padding: "8px 6px" }}>{r.host ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <Link href={`/admin/timetable/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: "16px 6px", color: "#888" }}>등록된 강의가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
