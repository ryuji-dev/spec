"use server";
// 교역자수련회 글 작성/수정/삭제. admin 전용, zod 검증, Drizzle.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { posts } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/current-user";
import { deletePostFiles } from "@/server/uploads/training";
import { TRAINING_CATEGORIES_KO } from "@/lib/training";

const postSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(TRAINING_CATEGORIES_KO as [string, ...string[]]),
  excerpt: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  body: z
    .string()
    .optional()
    .transform((v) => v || null),
  isPinned: z.coerce.boolean(),
});

export interface PostFormState {
  error?: string;
}

function parse(formData: FormData) {
  return postSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    isPinned: formData.get("isPinned") === "on" || formData.get("isPinned") === "true",
  });
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const [row] = await getDb()
    .insert(posts)
    .values({
      section: "training",
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      isPinned: r.data.isPinned,
      authorId: user.id,
    })
    .returning({ id: posts.id });
  redirect(`/admin/training/${row.id}/edit`);
}

export async function updatePost(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  await getDb()
    .update(posts)
    .set({
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      isPinned: r.data.isPinned,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));
  redirect(`/training/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  await deletePostFiles(id); // 디스크 파일 먼저 정리 (DB 행은 cascade)
  await getDb().delete(posts).where(eq(posts.id, id));
  redirect("/training");
}
