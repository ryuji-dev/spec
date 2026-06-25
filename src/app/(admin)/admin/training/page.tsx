import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listTrainingPostsForAdmin } from "@/server/services/training";
import { deletePost } from "@/server/actions/training";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";

export default async function AdminTrainingPage() {
  await requireAdmin();
  const rows = await listTrainingPostsForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>강습회 글 관리</h1>
        <Link href="/admin/training/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 글
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>분류</th>
            <th style={{ padding: "8px 6px" }}>작성일</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.category ?? "-"}</td>
              <td style={{ padding: "8px 6px" }}>{isoToKstDate(r.createdAt)}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <span style={{ display: "inline-flex", gap: 12 }}>
                  <Link href={`/admin/training/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
                  <DeletePostButton action={deletePost.bind(null, r.id)} />
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 글이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
