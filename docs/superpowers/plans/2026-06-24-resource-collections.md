# 자료실 컬렉션 실데이터화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자료실(`/resources`)의 "큐레이션 묶음" 섹션을 mock 상수(`LB_COLLECTIONS`)에서 Supabase 실데이터 + admin CRUD로 전환한다.

**Architecture:** 신규 테이블 2개(`resource_collections` 메타 + `resource_collection_items` 조인). `items`(자료 수)·`downloads`(view_count 합)는 연결된 실제 `posts`에서 파생(저장 X). 배지·커버·공개여부는 관리자 제어. 서비스(읽기) → Server Component, 액션(쓰기) → admin 폼. 디자인 컴포넌트는 데이터 출처만 교체.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase(PostgreSQL + RLS), supabase-js, zod, pnpm.

> **검증 방식 주의:** 이 저장소는 단위 테스트 프레임워크를 두지 않는다(기존 plan들과 동일). 각 작업은 `npx tsc --noEmit`·`pnpm lint`·`pnpm build` + 로컬 e2e로 검증한다. "테스트 실패 확인" 단계 대신 타입/빌드/수동 검증을 사용한다.

> **설계 문서:** `docs/superpowers/specs/2026-06-24-resource-collections-design.md`

> **로컬 환경 전제:** colima + `npx supabase start` 가동, `npx supabase status -o json`의 API_URL이 `http://127.0.0.1:54321`인지 **반드시 먼저 확인**(운영 DB 보호). DB 컨테이너명은 `supabase_db_<worktree>` 형식.

---

## File Structure

| 파일 | 책임 | 작업 |
|------|------|------|
| `supabase/migrations/<ts>_resource_collections.sql` | 테이블·RLS·인덱스 | Create |
| `src/lib/database.types.ts` | DB 타입 | 재생성 |
| `src/lib/resource.ts` | 컬렉션 행→뷰 순수 매퍼·enum 상수 | Modify |
| `src/server/services/resource.ts` | 공개 컬렉션 조회 + admin 조회 | Modify |
| `src/server/actions/collections.ts` | 컬렉션 CRUD 액션 | Create |
| `src/app/(admin)/admin/collections/page.tsx` | 목록 | Create |
| `src/app/(admin)/admin/collections/new/page.tsx` | 생성 | Create |
| `src/app/(admin)/admin/collections/[id]/edit/page.tsx` | 수정·삭제 | Create |
| `src/app/(admin)/admin/collections/EditorForm.tsx` | 폼(자료 체크박스 포함) | Create |
| `src/app/(admin)/admin/page.tsx` | 관리 링크 추가 | Modify |
| `src/app/resources/page.tsx` | collections props 주입 | Modify |
| `src/app/resources/_components/desktop/ResourcesDesktop.tsx` | collections prop 전달 | Modify |
| `src/app/resources/_components/desktop/CollectionsSection.tsx` | mock→prop | Modify |
| `src/app/resources/_components/mobile/ResourcesMobile.tsx` | mock→prop | Modify |
| `src/lib/resources-data.ts` | `LB_COLLECTIONS` 값 삭제(타입 유지) | Modify |
| `scripts/seed-supabase.mjs` | 로컬 시드 컬렉션 추가 | Modify |

---

## Task 1: 마이그레이션 — 테이블·RLS·인덱스

**Files:**
- Create: `supabase/migrations/<timestamp>_resource_collections.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `npx supabase migration new resource_collections`
생성된 1줄짜리 빈 파일 경로를 확인하고, **Read로 먼저 연 뒤** 아래 내용으로 덮어쓴다.

- [ ] **Step 2: SQL 작성**

```sql
-- 자료실 큐레이션 컬렉션: 메타 + 자료 연결 조인.
-- items/downloads는 연결된 posts에서 파생(저장하지 않음).
create table public.resource_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sub text not null,
  cover text not null check (cover in ('spring', 'easter', 'teacher')),
  badge text check (badge in ('NEW', 'HOT')),
  tag text not null,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index resource_collections_sort_idx on public.resource_collections (sort_order);

create table public.resource_collection_items (
  collection_id uuid not null references public.resource_collections (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  sort_order int not null default 0,
  primary key (collection_id, post_id)
);
create index resource_collection_items_collection_idx
  on public.resource_collection_items (collection_id);

alter table public.resource_collections enable row level security;
alter table public.resource_collection_items enable row level security;

-- 공개분은 누구나, 비공개분은 admin만 읽는다.
create policy resource_collections_select on public.resource_collections
  for select using (is_published or public.auth_is_admin());
create policy resource_collections_write on public.resource_collections
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());

-- 조인 행은 부모 공개여부로 노출이 통제되므로 select는 단순 허용.
create policy resource_collection_items_select on public.resource_collection_items
  for select using (true);
create policy resource_collection_items_write on public.resource_collection_items
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());
```

- [ ] **Step 3: 로컬 적용**

먼저 `npx supabase status -o json` 출력에서 API_URL이 `http://127.0.0.1:54321`인지 확인한다.
Run: `npx supabase db reset`
Expected: 마이그레이션이 오류 없이 적용되고 시드까지 재실행됨.

- [ ] **Step 4: grant 복구(로컬 한정, 커밋하지 않음)**

`db reset`은 public 스키마 grant를 날리므로 복구한다. DB 컨테이너 ID를 구해 psql로 적용한다.

```bash
CID=$(docker ps --filter "name=supabase_db_" --format "{{.ID}}")
docker exec -i "$CID" psql -U postgres -d postgres <<'SQL'
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to anon, authenticated, service_role;
SQL
```

- [ ] **Step 5: 테이블 생성 확인**

```bash
CID=$(docker ps --filter "name=supabase_db_" --format "{{.ID}}")
docker exec -i "$CID" psql -U postgres -d postgres -c "\d public.resource_collections" -c "\d public.resource_collection_items"
```
Expected: 두 테이블 정의와 제약(check, FK, PK)이 출력됨.

- [ ] **Step 6: 커밋**

```bash
git add supabase/migrations
git commit -m "feat: resource_collections 테이블·RLS 마이그레이션"
```

---

## Task 2: DB 타입 재생성

**Files:**
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: 타입 생성**

Run: `npx supabase gen types typescript --local > src/lib/database.types.ts`
(주의: `pnpm db:types`는 PATH에 없는 bare `supabase`를 호출하므로 위 npx 명령을 쓴다.)

- [ ] **Step 2: 타입 반영 확인**

```bash
grep -c "resource_collections\|resource_collection_items" src/lib/database.types.ts
```
Expected: 0보다 큰 값(두 테이블 타입이 포함됨).

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 4: 커밋**

```bash
git add src/lib/database.types.ts
git commit -m "chore: resource_collections database.types 재생성"
```

---

## Task 3: lib/resource.ts — 행→뷰 매퍼·enum 상수

**Files:**
- Modify: `src/lib/resource.ts`

- [ ] **Step 1: enum 상수와 매퍼 추가**

`src/lib/resource.ts` 끝에 아래를 추가한다. 기존 뷰 타입 `ResourceCollection`·`CollectionCoverKind`·`CollectionBadge`를 import해 재사용한다.

먼저 파일 상단 import 블록(`resources-data`에서 가져오는 부분)에 타입을 추가한다. 현재:
```ts
import type {
  ResourceFile,
  ResourceFileType,
  ResourceFileCategory,
  ResourceCategoryEn,
  ResourcesSort,
} from "./resources-data";
```
를 다음으로 교체:
```ts
import type {
  ResourceFile,
  ResourceFileType,
  ResourceFileCategory,
  ResourceCategoryEn,
  ResourcesSort,
  ResourceCollection,
  CollectionCoverKind,
  CollectionBadge,
} from "./resources-data";
```

파일 끝에 추가:
```ts
// 컬렉션 — admin 폼·zod·DB check 제약이 공유하는 enum.
export const COLLECTION_COVERS: CollectionCoverKind[] = ["spring", "easter", "teacher"];
export const COLLECTION_BADGES: CollectionBadge[] = ["NEW", "HOT"];

// 서비스가 만드는 평면 행(파생 수치 포함).
export type CollectionRow = {
  id: string;
  title: string;
  sub: string;
  cover: CollectionCoverKind;
  badge: CollectionBadge | null;
  tag: string;
  items: number;
  downloads: number;
};

// 평면 행 → 디자인 뷰 타입. badge가 null이면 키를 생략한다.
export function toCollectionView(row: CollectionRow): ResourceCollection {
  return {
    id: row.id,
    title: row.title,
    sub: row.sub,
    items: row.items,
    downloads: row.downloads,
    cover: row.cover,
    tag: row.tag,
    ...(row.badge ? { badge: row.badge } : {}),
  };
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 3: 커밋**

```bash
git add src/lib/resource.ts
git commit -m "feat: 컬렉션 행→뷰 매퍼·enum 상수 추가"
```

---

## Task 4: 서비스 — 공개 컬렉션 조회 + admin 조회

**Files:**
- Modify: `src/server/services/resource.ts`

- [ ] **Step 1: import·반환 타입 확장**

`src/server/services/resource.ts` 상단 import에 매퍼·타입을 추가한다. 현재 `from "@/lib/resource"` import 블록에 `toCollectionView`, `type CollectionRow`를 추가하고, `from "@/lib/resources-data"`에 `ResourceCollection`을 추가한다.

```ts
import {
  toResourceFileView,
  categoryToType,
  RESOURCE_CATEGORIES_KO,
  RESOURCE_CATEGORY_EN,
  formatDate,
  toCollectionView,
  type ResourceRow,
  type CollectionRow,
} from "@/lib/resource";
import type {
  ResourceFile,
  ResourceCategory,
  ResourceTopItem,
  ResourceCollection,
  CollectionCoverKind,
  CollectionBadge,
} from "@/lib/resources-data";
```

`ResourceListData` 타입에 컬렉션을 추가:
```ts
export type ResourceListData = {
  files: ResourceFile[];
  categories: ResourceCategory[];
  top: ResourceTopItem[];
  collections: ResourceCollection[];
};
```

- [ ] **Step 2: 공개 컬렉션 조회 함수 추가**

`getResourceListData` 함수 내부, `return { files, categories, top };` 직전에 컬렉션 조회·집계를 추가하고 반환에 합류시킨다.

```ts
  // 컬렉션 — 공개분 + 연결 자료(view_count)를 임베드해 items/downloads 파생.
  const { data: colData, error: colError } = await supabase
    .from("resource_collections")
    .select(
      "id, title, sub, cover, badge, tag, items:resource_collection_items(post:posts(view_count))",
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (colError) throw colError;
  const collections: ResourceCollection[] = (colData ?? []).map((c) => {
    const links = (c.items ?? []) as { post: { view_count: number } | { view_count: number }[] | null }[];
    const posts = links.map((l) => one(l.post)).filter((p): p is { view_count: number } => p != null);
    const row: CollectionRow = {
      id: c.id,
      title: c.title,
      sub: c.sub,
      cover: c.cover as CollectionCoverKind,
      badge: (c.badge as CollectionBadge | null) ?? null,
      tag: c.tag,
      items: posts.length,
      downloads: posts.reduce((sum, p) => sum + (p.view_count ?? 0), 0),
    };
    return toCollectionView(row);
  });
```

`return`을 다음으로 교체:
```ts
  return { files, categories, top, collections };
```

- [ ] **Step 3: admin 조회 함수 3개 추가**

파일 끝에 추가한다.

```ts
export type CollectionAdminRow = {
  id: string;
  title: string;
  tag: string;
  cover: string;
  badge: string | null;
  isPublished: boolean;
  sortOrder: number;
  itemCount: number;
};

export async function listCollectionsForAdmin(): Promise<CollectionAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("resource_collections")
    .select(
      "id, title, tag, cover, badge, is_published, sort_order, resource_collection_items(count)",
    )
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => {
    const countRel = c.resource_collection_items as { count: number }[] | null;
    return {
      id: c.id,
      title: c.title,
      tag: c.tag,
      cover: c.cover,
      badge: c.badge,
      isPublished: c.is_published,
      sortOrder: c.sort_order,
      itemCount: countRel?.[0]?.count ?? 0,
    };
  });
}

export type CollectionEditData = {
  id: string;
  title: string;
  sub: string;
  cover: string;
  badge: string | null;
  tag: string;
  isPublished: boolean;
  sortOrder: number;
  postIds: string[];
};

export async function getCollectionForEdit(id: string): Promise<CollectionEditData | null> {
  const supabase = await createSupabaseServer();
  const { data: c } = await supabase
    .from("resource_collections")
    .select("id, title, sub, cover, badge, tag, is_published, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;
  const { data: items } = await supabase
    .from("resource_collection_items")
    .select("post_id")
    .eq("collection_id", id);
  return {
    id: c.id,
    title: c.title,
    sub: c.sub,
    cover: c.cover,
    badge: c.badge,
    tag: c.tag,
    isPublished: c.is_published,
    sortOrder: c.sort_order,
    postIds: (items ?? []).map((i) => i.post_id),
  };
}

export type ResourcePickerItem = { id: string; title: string; category: string | null };

export async function listResourcePostsForPicker(): Promise<ResourcePickerItem[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, title: p.title, category: p.category }));
}
```

- [ ] **Step 4: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 5: 커밋**

```bash
git add src/server/services/resource.ts
git commit -m "feat: 컬렉션 공개 조회·admin 조회 서비스 추가"
```

---

## Task 5: 액션 — 컬렉션 CRUD

**Files:**
- Create: `src/server/actions/collections.ts`

- [ ] **Step 1: 액션 파일 작성**

```ts
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
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
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
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 3: 커밋**

```bash
git add src/server/actions/collections.ts
git commit -m "feat: 컬렉션 CRUD 액션(자료 연결 전량 교체)"
```

---

## Task 6: admin CRUD UI

**Files:**
- Create: `src/app/(admin)/admin/collections/EditorForm.tsx`
- Create: `src/app/(admin)/admin/collections/page.tsx`
- Create: `src/app/(admin)/admin/collections/new/page.tsx`
- Create: `src/app/(admin)/admin/collections/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: EditorForm 작성**

`src/app/(admin)/admin/collections/EditorForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import type { CollectionFormState } from "@/server/actions/collections";

type Picker = { id: string; title: string; category: string | null };

type Initial = {
  title?: string;
  sub?: string;
  cover?: string;
  badge?: string | null;
  tag?: string;
  isPublished?: boolean;
  sortOrder?: number;
  postIds?: string[];
};

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function EditorForm({
  action,
  picker,
  initial,
  submitLabel,
}: {
  action: (prev: CollectionFormState, formData: FormData) => Promise<CollectionFormState>;
  picker: Picker[];
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const selected = new Set(initial?.postIds ?? []);
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="컬렉션 제목" style={inputStyle} />
      <input name="sub" defaultValue={initial?.sub ?? ""} required placeholder="설명" style={inputStyle} />
      <input name="tag" defaultValue={initial?.tag ?? ""} required placeholder="표시 태그 (예: 교안·예배·교사)" style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          커버
          <select name="cover" defaultValue={initial?.cover ?? "spring"} style={inputStyle}>
            <option value="spring">spring</option>
            <option value="easter">easter</option>
            <option value="teacher">teacher</option>
          </select>
        </label>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          배지
          <select name="badge" defaultValue={initial?.badge ?? ""} style={inputStyle}>
            <option value="">없음</option>
            <option value="NEW">NEW</option>
            <option value="HOT">HOT</option>
          </select>
        </label>
      </div>
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} min={0} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
      </label>
      <fieldset style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
        <legend style={{ fontSize: 13, color: "#666" }}>연결할 자료</legend>
        {picker.length === 0 && <p style={{ color: "#888", margin: 0 }}>등록된 자료가 없습니다.</p>}
        {picker.map((p) => (
          <label key={p.id} style={{ display: "block", fontSize: 14, padding: "4px 0" }}>
            <input type="checkbox" name="postIds" value={p.id} defaultChecked={selected.has(p.id)} />{" "}
            {p.title}
            {p.category ? <span style={{ color: "#999" }}> · {p.category}</span> : null}
          </label>
        ))}
      </fieldset>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 목록 page 작성**

`src/app/(admin)/admin/collections/page.tsx`:
```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listCollectionsForAdmin } from "@/server/services/resource";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminCollectionsPage() {
  await requireAdmin();
  const rows = await listCollectionsForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>자료실 컬렉션 관리</h1>
        <Link href="/admin/collections/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 컬렉션
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>태그</th>
            <th style={{ padding: "8px 6px" }}>커버</th>
            <th style={{ padding: "8px 6px" }}>배지</th>
            <th style={{ padding: "8px 6px" }}>자료수</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.tag}</td>
              <td style={{ padding: "8px 6px" }}>{r.cover}</td>
              <td style={{ padding: "8px 6px" }}>{r.badge ?? ""}</td>
              <td style={{ padding: "8px 6px" }}>{r.itemCount}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <Link href={`/admin/collections/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: "16px 6px", color: "#888" }}>등록된 컬렉션이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 3: new page 작성**

`src/app/(admin)/admin/collections/new/page.tsx`:
```tsx
import { requireAdmin } from "@/server/auth/current-user";
import { listResourcePostsForPicker } from "@/server/services/resource";
import { createCollection } from "@/server/actions/collections";
import EditorForm from "../EditorForm";

export default async function NewCollectionPage() {
  await requireAdmin();
  const picker = await listResourcePostsForPicker();
  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 컬렉션</h1>
      <EditorForm action={createCollection} picker={picker} submitLabel="저장" />
    </main>
  );
}
```

- [ ] **Step 4: edit page 작성**

`src/app/(admin)/admin/collections/[id]/edit/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import {
  getCollectionForEdit,
  listResourcePostsForPicker,
} from "@/server/services/resource";
import { updateCollection, deleteCollection } from "@/server/actions/collections";
import EditorForm from "../../EditorForm";

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [row, picker] = await Promise.all([
    getCollectionForEdit(id),
    listResourcePostsForPicker(),
  ]);
  if (!row) notFound();

  const update = updateCollection.bind(null, id);
  const remove = deleteCollection.bind(null, id);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/collections" style={{ fontSize: 13, color: "#666" }}>← 목록</Link>
      <h1 style={{ fontSize: 22 }}>컬렉션 수정</h1>
      <EditorForm
        action={update}
        picker={picker}
        initial={{
          title: row.title,
          sub: row.sub,
          cover: row.cover,
          badge: row.badge,
          tag: row.tag,
          isPublished: row.isPublished,
          sortOrder: row.sortOrder,
          postIds: row.postIds,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          컬렉션 삭제
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: 대시보드 링크 추가**

`src/app/(admin)/admin/page.tsx`의 링크 묶음에 추가한다. 현재:
```tsx
        <Link href="/admin/timetable">강의 시간표 관리 →</Link>
```
뒤에 한 줄 추가:
```tsx
        <Link href="/admin/collections">자료실 컬렉션 관리 →</Link>
```

- [ ] **Step 6: 타입체크·린트**

Run: `npx tsc --noEmit; echo "TSC=$?"; pnpm lint 2>&1 | tail -5; echo "LINT=$?"`
Expected: `TSC=0`, lint 오류 없음.

- [ ] **Step 7: 커밋**

```bash
git add "src/app/(admin)/admin/collections" "src/app/(admin)/admin/page.tsx"
git commit -m "feat: 자료실 컬렉션 admin CRUD UI"
```

---

## Task 7: 공개 화면 배선 (디자인 보존)

**Files:**
- Modify: `src/app/resources/page.tsx`
- Modify: `src/app/resources/_components/desktop/ResourcesDesktop.tsx`
- Modify: `src/app/resources/_components/desktop/CollectionsSection.tsx`
- Modify: `src/app/resources/_components/mobile/ResourcesMobile.tsx`

- [ ] **Step 1: page.tsx — collections 주입**

`src/app/resources/page.tsx`에서 데스크톱·모바일에 `collections`를 추가로 넘긴다.

데스크톱 분기:
```tsx
        <ResourcesDesktop files={data.files} categories={data.categories} top={data.top} collections={data.collections} />
```
모바일 분기:
```tsx
    <ResourcesMobile
      deviceType={device}
      files={data.files}
      categories={data.categories}
      top={data.top}
      collections={data.collections}
    />
```

- [ ] **Step 2: ResourcesDesktop — prop 전달**

`src/app/resources/_components/desktop/ResourcesDesktop.tsx`:

import에 `ResourceCollection` 타입을 추가(기존 `from "@/lib/resources-data"` 타입 import 줄에 합류). Props 타입과 시그니처를 교체:
```tsx
type Props = { files: ResourceFile[]; categories: ResourceCategory[]; top: ResourceTopItem[]; collections: ResourceCollection[] };

export default function ResourcesDesktop({ files, categories, top, collections }: Props) {
```
`CollectionsSection` 사용부를 교체:
```tsx
      <CollectionsSection palette={palette} collections={collections} />
```

- [ ] **Step 3: CollectionsSection — mock→prop**

`src/app/resources/_components/desktop/CollectionsSection.tsx`:

`import { LB_COLLECTIONS } from "@/lib/resources-data";`를 타입 import로 교체:
```tsx
import type { ResourceCollection } from "@/lib/resources-data";
```
Props 타입·시그니처 교체:
```tsx
type Props = { palette: Palette; collections: ResourceCollection[] };

export default function CollectionsSection({ palette, collections }: Props) {
```
`{LB_COLLECTIONS.map((c, i) => (`를 `{collections.map((c, i) => (`로 교체.

**그 외 마크업·스타일·`CollectionCover`·`LbCatLabel`·뱃지 렌더는 변경 금지(헌법 [7]).**

- [ ] **Step 4: ResourcesMobile — mock→prop**

`src/app/resources/_components/mobile/ResourcesMobile.tsx`:

`import { LB_COLLECTIONS } from "@/lib/resources-data";`를 타입 import로 교체(이미 다른 타입을 같은 경로에서 import 중이면 그 줄에 합류):
```tsx
import type { ResourceCollection } from "@/lib/resources-data";
```
`Props` 타입에 `collections: ResourceCollection[];`를 추가하고, 컴포넌트 구조분해 매개변수에 `collections`를 추가한다. `{LB_COLLECTIONS.map((c) => (`를 `{collections.map((c) => (`로 교체.

**그 외 마크업·스타일은 변경 금지.**

- [ ] **Step 5: 타입체크·빌드**

Run: `npx tsc --noEmit; echo "TSC=$?"; pnpm build 2>&1 | tail -8; echo "BUILD=${PIPESTATUS[0]}"`
Expected: `TSC=0`, `BUILD=0`.

- [ ] **Step 6: 커밋**

```bash
git add src/app/resources
git commit -m "feat: 자료실 컬렉션 공개 화면 실데이터 배선"
```

---

## Task 8: mock 상수 제거 + 로컬 시드

**Files:**
- Modify: `src/lib/resources-data.ts`
- Modify: `scripts/seed-supabase.mjs`

- [ ] **Step 1: LB_COLLECTIONS 값 삭제(타입 유지)**

`src/lib/resources-data.ts`에서 `export const LB_COLLECTIONS: ReadonlyArray<ResourceCollection> = [ ... ];` 블록 전체를 삭제한다. **타입 정의(`ResourceCollection`, `CollectionCoverKind`, `CollectionBadge`)는 그대로 둔다**(서비스·뷰가 계속 사용).

- [ ] **Step 2: 잔여 참조 확인**

```bash
grep -rn "LB_COLLECTIONS" src; echo "EXIT=$?"
```
Expected: 매치 없음(`EXIT=1`). 매치가 있으면 해당 파일을 prop 기반으로 마저 정리한다.

- [ ] **Step 3: 시드에 컬렉션 추가**

`scripts/seed-supabase.mjs`에서 자료(resource posts) 시드가 끝난 지점을 찾아, 그 자료들의 id를 활용해 컬렉션 3종 + 연결을 삽입한다. 기존 시드가 service-role 클라이언트(`supabase`)를 쓰는 패턴을 그대로 따른다.

```js
// 자료실 컬렉션 시드 — 위에서 만든 resource posts를 묶는다.
// (resourcePostIds: 앞서 삽입한 resource 게시물 id 배열이라고 가정. 실제 변수명은
//  파일에서 자료 삽입 결과를 담은 변수에 맞춘다.)
const { data: cols } = await supabase
  .from("resource_collections")
  .insert([
    { title: "2026 봄학기 공과 모음", sub: "유년 · 초등 · 중고등 · 청년 4개 학년 일괄", cover: "spring", badge: "NEW", tag: "교안", sort_order: 0 },
    { title: "부활절 연합 예배 패키지", sub: "설교 PPT · 콘티 · 악보 · 영상 매뉴얼", cover: "easter", badge: "HOT", tag: "예배", sort_order: 1 },
    { title: "교사 필수 자료 50선", sub: "교사 헌신예배 · 교사대학 · 양육 가이드", cover: "teacher", tag: "교사", sort_order: 2 },
  ])
  .select("id");

// 각 컬렉션에 앞서 만든 자료 일부를 연결(자료가 충분치 않으면 가능한 만큼).
if (cols && resourcePostIds.length > 0) {
  const links = [];
  cols.forEach((col, ci) => {
    resourcePostIds.slice(ci, ci + 3).forEach((postId, i) => {
      links.push({ collection_id: col.id, post_id: postId, sort_order: i });
    });
  });
  if (links.length > 0) await supabase.from("resource_collection_items").insert(links);
}
```

> 구현자 주의: `resourcePostIds`는 예시 변수명이다. `seed-supabase.mjs`에서 resource 게시물을 삽입하고 받은 실제 id 목록 변수에 맞춰 사용한다. 만약 기존 시드가 id를 보관하지 않으면, resource posts insert에 `.select("id")`를 추가해 id를 확보한 뒤 사용한다.

- [ ] **Step 4: 시드 재실행·확인**

API_URL이 `127.0.0.1`인지 확인 후:
Run: `pnpm seed`
그 다음 grant 복구가 필요하면 Task 1 Step 4를 재실행한다.

```bash
CID=$(docker ps --filter "name=supabase_db_" --format "{{.ID}}")
docker exec -i "$CID" psql -U postgres -d postgres -c "select c.title, count(i.post_id) from public.resource_collections c left join public.resource_collection_items i on i.collection_id=c.id group by c.title order by c.title;"
```
Expected: 컬렉션 3종과 각 연결 자료 수가 출력됨.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/resources-data.ts scripts/seed-supabase.mjs
git commit -m "chore: LB_COLLECTIONS mock 제거·로컬 시드에 컬렉션 추가"
```

---

## Task 9: 로컬 e2e 검증 + plan 커밋

**Files:**
- (검증 전용, 코드 변경 없음. 마지막에 plan 문서 커밋.)

- [ ] **Step 1: 개발 서버 기동·공개 화면 확인**

`pnpm dev` 후(또는 preview 도구로) `/resources`를 연다. 컬렉션 섹션에 시드 3종이 보이고, 각 카드의 "N개 자료"·다운로드 수가 **연결 자료에서 파생된 값**과 일치하는지 확인한다(DB 집계 쿼리와 대조).

- [ ] **Step 2: admin 생성 검증**

admin 로그인 → `/admin/collections/new`에서 컬렉션을 만들고 자료 2건을 체크 → 저장. 공개 `/resources`에서 "2개 자료"로 표시되고 다운로드 합이 두 자료 `view_count` 합과 같은지 확인.

- [ ] **Step 3: 수정·비공개·삭제 검증**

- 수정: 연결 자료를 1건으로 바꾸면 "1개 자료"로 반영.
- 비공개: `공개` 체크 해제 시 `/resources`에서 사라짐. admin 목록에는 남음.
- 삭제: 삭제 후 목록·공개 화면 모두에서 사라지고, 조인 행도 cascade로 제거됨(아래 쿼리로 확인).

```bash
CID=$(docker ps --filter "name=supabase_db_" --format "{{.ID}}")
docker exec -i "$CID" psql -U postgres -d postgres -c "select count(*) from public.resource_collection_items;"
```

- [ ] **Step 4: 검증 데이터 정리**

테스트로 만든 컬렉션을 admin에서 삭제해 시드 상태로 되돌린다(또는 `npx supabase db reset` + grant 복구 + `pnpm seed`).

- [ ] **Step 5: 최종 점검**

Run: `npx tsc --noEmit; echo "TSC=$?"; pnpm lint 2>&1 | tail -3; echo "LINT=$?"; pnpm build 2>&1 | tail -5; echo "BUILD=${PIPESTATUS[0]}"; git status --short`
Expected: `TSC=0`, lint 오류 없음, `BUILD=0`, working tree clean(커밋 안 된 변경 없음).

- [ ] **Step 6: plan 문서 커밋**

```bash
git add docs/superpowers/plans/2026-06-24-resource-collections.md
git commit -m "docs: 자료실 컬렉션 실데이터화 실행 plan"
```

---

## 검증·완료 기준

- 마이그레이션이 로컬에 적용되고 운영 반영(`npx supabase db push`)은 **머지 후 별도 수행**(사용자 확인 필요).
- `/resources` 컬렉션이 DB 실데이터로 렌더되고 `items`/`downloads`가 연결 자료에서 파생된다.
- admin에서 생성·수정·삭제·공개토글·자료연결이 동작한다.
- mock `LB_COLLECTIONS` 값이 제거되고 화면 잔여 mock(컬렉션)이 사라진다.
- `tsc`·`lint`·`build` 통과.
