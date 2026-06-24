"use server";
// resource_collections 생성/수정/삭제. admin 전용(RLS + requireAdmin), zod 검증.
// 자료 연결은 조인 테이블을 전량 교체(삭제 후 재삽입)한다.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  sub: z.string().trim().min(1, "설명을 입력해주세요."),
  cover: z.enum(["spring", "easter", "teacher"]),
  badge: z.enum(["NEW", "HOT"]).nullable(),
  tag: z.string().trim().min(1, "태그를 입력해주세요."),
  isPublished: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

export interface CollectionFormState {
  error?: string;
}

function parse(formData: FormData) {
  const rawBadge = formData.get("badge");
  return schema.safeParse({
    title: formData.get("title"),
    sub: formData.get("sub"),
    cover: formData.get("cover"),
    badge: rawBadge ? rawBadge : null,
    tag: formData.get("tag"),
    isPublished:
      formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

function toRow(d: z.infer<typeof schema>) {
  return {
    title: d.title,
    sub: d.sub,
    cover: d.cover,
    badge: d.badge,
    tag: d.tag,
    is_published: d.isPublished,
    sort_order: d.sortOrder,
  };
}

// 폼의 postIds[] → 조인 행 배열(순서대로 sort_order 부여).
function linkRows(collectionId: string, postIds: string[]) {
  return postIds.map((postId, i) => ({
    collection_id: collectionId,
    post_id: postId,
    sort_order: i,
  }));
}

export async function createCollection(
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success)
    return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const postIds = formData.getAll("postIds").map(String).filter(Boolean);
  const supabase = await createSupabaseServer();
  const { data: inserted, error } = await supabase
    .from("resource_collections")
    .insert(toRow(r.data))
    .select("id")
    .single();
  if (error || !inserted) return { error: "저장에 실패했습니다." };
  if (postIds.length > 0) {
    const { error: linkError } = await supabase
      .from("resource_collection_items")
      .insert(linkRows(inserted.id, postIds));
    if (linkError) return { error: "자료 연결에 실패했습니다." };
  }
  redirect("/admin/collections");
}

export async function updateCollection(
  id: string,
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success)
    return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const postIds = formData.getAll("postIds").map(String).filter(Boolean);
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("resource_collections")
    .update(toRow(r.data))
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  // 연결 전량 교체: 기존 삭제 후 재삽입.
  await supabase.from("resource_collection_items").delete().eq("collection_id", id);
  if (postIds.length > 0) {
    const { error: linkError } = await supabase
      .from("resource_collection_items")
      .insert(linkRows(id, postIds));
    if (linkError) return { error: "자료 연결에 실패했습니다." };
  }
  redirect("/admin/collections");
}

export async function deleteCollection(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  // 조인 행은 on delete cascade로 함께 삭제됨.
  await supabase.from("resource_collections").delete().eq("id", id);
  redirect("/admin/collections");
}
