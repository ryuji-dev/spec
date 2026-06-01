"use server";
// 댓글 작성/삭제. 작성은 로그인 회원(admin·member), 삭제는 작성자 본인 또는 admin.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { comments } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth/current-user";

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
  await getDb()
    .insert(comments)
    .values({ postId, authorId: user.id, body: parsed.data });
  redirect(`/committee/${postId}`);
}

export async function deleteComment(commentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [c] = await getDb()
    .select({ postId: comments.postId, authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!c) redirect("/committee");
  // 권한: 작성자 본인 또는 admin만. 그 외에는 삭제하지 않고 글로 복귀.
  if (user.role !== "admin" && c.authorId !== user.id) {
    redirect(`/committee/${c.postId}`);
  }
  await getDb().delete(comments).where(eq(comments.id, commentId));
  redirect(`/committee/${c.postId}`);
}
