import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getWebzineArticle,
  incrementWebzineView,
} from "@/server/services/webzine";
import { getCurrentUser } from "@/server/auth/current-user";
import { deletePost } from "@/server/actions/webzine";

// 최소 기능 상세 화면. 디자인 폴리시는 추후 Claude Design 핸드오프로 교체. (첨부·댓글 없음)
export default async function WebzineArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getWebzineArticle(id);
  if (!article) notFound();
  await incrementWebzineView(id);

  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/webzine" style={{ fontSize: 13, color: "#666" }}>
        ← 신학원웹진
      </Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {article.tag} · {article.author} · {article.date} · {article.read} · 조회{" "}
        {article.viewCount}
      </p>
      <h1 style={{ fontSize: 26, lineHeight: 1.3 }}>{article.title}</h1>
      {article.subtitle && (
        <p style={{ fontSize: 16, color: "#555", marginTop: 8 }}>{article.subtitle}</p>
      )}
      {isAdmin && (
        <Link href={`/admin/webzine/${id}/edit`} style={{ fontSize: 13, color: "#06c" }}>
          수정
        </Link>
      )}
      <article style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
        {article.body}
      </article>

      {isAdmin && (
        <form action={deletePost.bind(null, id)} style={{ marginTop: 24 }}>
          <button type="submit" style={{ fontSize: 13, color: "#c00" }}>
            글 삭제
          </button>
        </form>
      )}
    </main>
  );
}
