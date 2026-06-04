import { notFound } from "next/navigation";
import Link from "next/link";
import { getBoardPost, incrementBoardView } from "@/server/services/board";
import { getCurrentUser } from "@/server/auth/current-user";
import { deletePost } from "@/server/actions/board";
import { deleteComment } from "@/server/actions/comments";
import CommentForm from "@/app/committee/_components/CommentForm";
import LikeButton from "@/app/board/_components/LikeButton";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";

// 최소 기능 상세 화면. 디자인 폴리시는 추후 Claude Design 핸드오프로 교체.
export default async function BoardPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBoardPost(id);
  if (!post) notFound();
  await incrementBoardView(id);
  const user = await getCurrentUser(); // proxy가 이미 회원 가드 — user 존재
  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || (user != null && post.authorId === user.id);

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/board" style={{ fontSize: 13, color: "#666" }}>← 자유게시판</Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {post.category} · {post.author}{post.church ? ` · ${post.church}` : ""} · {post.date} · 조회 {post.views}
      </p>
      <h1 style={{ fontSize: 24, lineHeight: 1.3 }}>{post.title}</h1>
      <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
        <LikeButton
          postId={id}
          initialLiked={post.likedByMe}
          initialCount={post.likes}
          palette={FOREST_PALETTE}
        />
      </div>
      {canEdit && (
        <div style={{ display: "flex", gap: 12, fontSize: 13, marginTop: 4 }}>
          <Link href={`/board/${id}/edit`} style={{ color: "#06c" }}>수정</Link>
          <form action={deletePost.bind(null, id)}>
            <button type="submit" style={{ color: "#c00", fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0 }}>삭제</button>
          </form>
        </div>
      )}
      <article style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>{post.body}</article>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15 }}>댓글 ({post.comments.length})</h2>
        {post.comments.map((c) => {
          const canDelC = isAdmin || (user != null && c.authorId === user.id);
          return (
            <div key={c.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{c.author} · {c.date}</p>
              <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{c.body}</p>
              {canDelC && (
                <form action={deleteComment.bind(null, c.id)} style={{ marginTop: 4 }}>
                  <button type="submit" style={{ fontSize: 12, color: "#c00", background: "none", border: "none", cursor: "pointer", padding: 0 }}>삭제</button>
                </form>
              )}
            </div>
          );
        })}
        <CommentForm postId={id} />
      </section>
    </main>
  );
}
