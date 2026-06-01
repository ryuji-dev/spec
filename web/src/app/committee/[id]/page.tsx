import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCommitteePost,
  incrementCommitteeView,
} from "@/server/services/committee";
import { getCurrentUser } from "@/server/auth/current-user";

// 최소 기능 상세 화면. 디자인 폴리시는 추후 Claude Design 핸드오프로 교체.
export default async function CommitteePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getCommitteePost(id);
  if (!post) notFound();
  await incrementCommitteeView(id);

  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/committee" style={{ fontSize: 13, color: "#666" }}>
        ← 목록으로
      </Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {post.category} · {post.author} · {post.date} · 조회 {post.views}
      </p>
      <h1 style={{ fontSize: 26, lineHeight: 1.3 }}>{post.title}</h1>
      {isAdmin && (
        <Link href={`/admin/committee/${id}/edit`} style={{ fontSize: 13, color: "#06c" }}>
          수정
        </Link>
      )}
      <article style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
        {post.body}
      </article>

      {post.attachments.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 15 }}>첨부 ({post.attachments.length})</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {post.attachments.map((a) => (
              <li key={a.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {a.mime.startsWith("image/") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/committee/files/${a.id}`} alt={a.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }} />
                )}
                <a href={`/api/committee/files/${a.id}`} target="_blank" rel="noreferrer">{a.name}</a>
                <span style={{ fontSize: 12, color: "#888" }}>({Math.round(a.sizeBytes / 1024)} KB)</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15 }}>댓글 ({post.comments.length})</h2>
        {post.comments.map((c) => (
          <div key={c.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
              {c.author} · {c.date}
            </p>
            <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{c.body}</p>
          </div>
        ))}
        {/* 댓글 작성 폼은 Plan 3에서 추가 */}
      </section>
    </main>
  );
}
