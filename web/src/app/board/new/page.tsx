import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/board";
import BoardEditorForm from "./BoardEditorForm";

// 회원 글 작성 화면. proxy가 /board 를 회원 가드하지만 진입부에서 세션 재확인(이중 방어).
export default async function BoardNewPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/board/new");

  const { cat } = await searchParams;

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/board" style={{ fontSize: 13, color: "#666" }}>
        ← 자유게시판
      </Link>
      <h1 style={{ fontSize: 24, lineHeight: 1.3, margin: "16px 0 20px" }}>
        글 작성
      </h1>
      <BoardEditorForm action={createPost} defaultCategory={cat} />
    </main>
  );
}
