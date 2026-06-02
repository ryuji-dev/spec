"use server";
// 자료 작성/수정/삭제. admin 전용, zod 검증, Drizzle.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { posts } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/current-user";
import { deleteResourcePostFiles } from "@/server/uploads/resource";
import { RESOURCE_CATEGORIES_KO } from "@/lib/resource";

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(RESOURCE_CATEGORIES_KO as [string, ...string[]]),
  sub: z.string().trim().optional().transform((v) => v || null),
});

export interface ResourceFormState {
  error?: string;
}

function parse(formData: FormData) {
  return schema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    sub: formData.get("sub"),
  });
}

export async function createResource(_prev: ResourceFormState, formData: FormData): Promise<ResourceFormState> {
  const user = await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const [row] = await getDb()
    .insert(posts)
    .values({
      section: "resource",
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.sub,
      authorId: user.id,
    })
    .returning({ id: posts.id });
  redirect(`/admin/resources/${row.id}/edit`);
}

export async function updateResource(id: string, _prev: ResourceFormState, formData: FormData): Promise<ResourceFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  await getDb()
    .update(posts)
    .set({ category: r.data.category, title: r.data.title, excerpt: r.data.sub, updatedAt: new Date() })
    .where(eq(posts.id, id));
  redirect(`/resources/${id}`);
}

export async function deleteResource(id: string): Promise<void> {
  await requireAdmin();
  await deleteResourcePostFiles(id);
  await getDb().delete(posts).where(eq(posts.id, id));
  redirect("/resources");
}
