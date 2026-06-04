"use server";
// 댓글 작성/삭제. 작성은 로그인 회원(admin·member), 삭제는 작성자 본인 또는 admin.
// 상세 페이지가 있는 섹션(committee·board)에서만 댓글을 지원하며, 섹션별 경로로 redirect.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { comments, posts } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth/current-user";

// 댓글을 지원하는 섹션 → 상세 경로 베이스. 목록·상세가 있는 섹션만 등재.
const SECTION_PATH: Partial<Record<string, string>> = {
  committee: "/committee",
  board: "/board",
};

const bodySchema = z
  .string()
  .trim()
  .min(1, "댓글 내용을 입력해주세요.")
  .max(2000, "댓글이 너무 깁니다.");

export interface CommentState {
  error?: string;
}

export async function addComment(
  postId: string,
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const parsed = bodySchema.safeParse(formData.get("body"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }
  // 대상 게시물이 존재하고 댓글 지원 섹션인지 확인 (비정상 postId의 FK 500·비대상 섹션 방지)
  const [target] = await getDb()
    .select({ section: posts.section })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  const base = target ? SECTION_PATH[target.section] : undefined;
  if (!base) return { error: "게시물을 찾을 수 없습니다." };
  await getDb()
    .insert(comments)
    .values({ postId, authorId: user.id, body: parsed.data });
  redirect(`${base}/${postId}`);
}

export async function deleteComment(commentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [c] = await getDb()
    .select({
      postId: comments.postId,
      authorId: comments.authorId,
      section: posts.section,
    })
    .from(comments)
    .innerJoin(posts, eq(posts.id, comments.postId))
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!c) redirect("/");
  const base = SECTION_PATH[c.section] ?? "/";
  // 권한: 작성자 본인 또는 admin만. 그 외에는 삭제하지 않고 글로 복귀.
  if (user.role !== "admin" && c.authorId !== user.id) {
    redirect(`${base}/${c.postId}`);
  }
  await getDb().delete(comments).where(eq(comments.id, commentId));
  redirect(`${base}/${c.postId}`);
}
