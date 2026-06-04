"use server";
// 자유게시판 글 작성/수정/삭제. 작성=로그인 회원, 수정·삭제=작성자 본인 또는 admin.
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { posts } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth/current-user";
import { BOARD_CATEGORIES_KO } from "@/lib/board";

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(BOARD_CATEGORIES_KO as [string, ...string[]]),
  body: z.string().trim().optional().transform((v) => v || null),
});

export interface BoardFormState {
  error?: string;
}

function parse(formData: FormData) {
  return schema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    body: formData.get("body"),
  });
}

const SECTION = "board" as const;

export async function createPost(_prev: BoardFormState, formData: FormData): Promise<BoardFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const [row] = await getDb()
    .insert(posts)
    .values({
      section: SECTION,
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.body ? r.data.body.slice(0, 120) : null,
      body: r.data.body,
      authorId: user.id,
    })
    .returning({ id: posts.id });
  redirect(`/board/${row.id}`);
}

// 작성자 본인 또는 admin인지 확인(대상 글이 board 글이어야 함)
async function authorizePost(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
  const [p] = await getDb()
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.section, SECTION)))
    .limit(1);
  if (!p) return false;
  return isAdmin || p.authorId === userId;
}

export async function updatePost(id: string, _prev: BoardFormState, formData: FormData): Promise<BoardFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  if (!(await authorizePost(id, user.id, user.role === "admin")))
    return { error: "수정 권한이 없습니다." };
  await getDb()
    .update(posts)
    .set({
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.body ? r.data.body.slice(0, 120) : null,
      body: r.data.body,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));
  redirect(`/board/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await authorizePost(id, user.id, user.role === "admin"))) redirect(`/board/${id}`);
  await getDb().delete(posts).where(eq(posts.id, id));
  redirect("/board");
}
