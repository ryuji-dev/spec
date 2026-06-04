"use server";
// 자유게시판 글 좋아요 멱등 토글. 로그인 회원 누구나. board 섹션 글만 대상.
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db";
import { postLikes, posts } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth/current-user";

const SECTION = "board" as const;

export type LikeResult =
  | { ok: true; liked: boolean; count: number }
  | { ok: false; error: string };

export async function toggleLike(postId: string): Promise<LikeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  const db = getDb();
  // 대상이 board 글인지 확인 (비정상 postId·타 섹션 차단)
  const [p] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.section, SECTION)))
    .limit(1);
  if (!p) return { ok: false, error: "게시물을 찾을 수 없습니다." };
  // 토글: 있으면 삭제, 없으면 삽입(유니크 충돌 무시)
  const [existing] = await db
    .select({ id: postLikes.id })
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)))
    .limit(1);
  if (existing) {
    await db.delete(postLikes).where(eq(postLikes.id, existing.id));
  } else {
    await db
      .insert(postLikes)
      .values({ postId, userId: user.id })
      .onConflictDoNothing();
  }
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));
  // 서버 렌더 카운트 동기화 (목록·상세)
  revalidatePath("/board");
  revalidatePath(`/board/${postId}`);
  return { ok: true, liked: !existing, count: n };
}
