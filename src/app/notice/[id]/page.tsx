import { notFound } from "next/navigation";
import Link from "next/link";
import { getNoticePost, incrementNoticeView } from "@/server/services/notice";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function NoticePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getNoticePost(id);
  if (!post) notFound();
  await incrementNoticeView(id);

  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/notice" style={{ fontSize: 13, color: "#666" }}>
        ← 목록으로
      </Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {post.author} · {post.date} · 조회 {post.views}
      </p>
      <h1 style={{ fontSize: 26, lineHeight: 1.3 }}>{post.title}</h1>
      {isAdmin && (
        <Link href={`/admin/notice/${id}/edit`} style={{ fontSize: 13, color: "#06c" }}>
          수정
        </Link>
      )}
      <article style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
        {post.body}
      </article>
    </main>
  );
}
