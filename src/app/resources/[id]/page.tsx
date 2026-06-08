import { notFound } from "next/navigation";
import Link from "next/link";
import { getResourcePost } from "@/server/services/resource";
import { getCurrentUser } from "@/server/auth/current-user";
import { formatBytes } from "@/lib/resource";

// 최소 기능 상세 화면. 디자인 폴리시는 추후 Claude Design 핸드오프로 교체.
export default async function ResourcePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await getResourcePost(id);
  if (!resource) notFound();
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/resources" style={{ fontSize: 13, color: "#666" }}>
        ← 자료공유로
      </Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {resource.category} · {resource.by} · {resource.date} · 다운로드 {resource.downloads}
      </p>
      <h1 style={{ fontSize: 26, lineHeight: 1.3 }}>{resource.title}</h1>
      {isAdmin && (
        <Link href={`/admin/resources/${id}/edit`} style={{ fontSize: 13, color: "#06c" }}>
          수정
        </Link>
      )}
      {resource.sub && (
        <p style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
          {resource.sub}
        </p>
      )}

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15 }}>파일 ({resource.files.length})</h2>
        {resource.files.length === 0 ? (
          <p style={{ fontSize: 13, color: "#888" }}>등록된 파일이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {resource.files.map((f) => (
              <li key={f.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <a href={`/api/resources/files/${f.id}`}>{f.name}</a>
                <span style={{ fontSize: 12, color: "#888" }}>({formatBytes(f.sizeBytes)})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
