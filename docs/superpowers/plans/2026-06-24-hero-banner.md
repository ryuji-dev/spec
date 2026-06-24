# 메인 히어로 사진 배너 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 히어로 배경(SVG 아트 슬라이드)을 관리자가 업로드한 사진 슬라이드로 교체할 수 있게 하고, 사진이 없으면 기존 SVG 아트로 폴백한다.

**Architecture:** 신규 `hero_slides` 테이블 + 공개 Storage 버킷 `hero`. 서비스(읽기)→Server Component, 액션(쓰기·업로드)→admin 폼. 공개 히어로 컴포넌트는 `slides` prop을 받아 1장 이상이면 `<img>` 배경, 0장이면 기존 SVG로 폴백. 텍스트 오버레이·슬라이드 동작·CSS는 불변.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase(PostgreSQL + RLS + Storage 공개 버킷), supabase-js, zod, file-type(MIME 검사), pnpm.

> **검증 방식 주의:** 이 저장소는 단위 테스트 프레임워크를 두지 않는다(기존 plan들과 동일). 각 작업은 `npx tsc --noEmit`·`pnpm lint`·`pnpm build` + 로컬 e2e로 검증한다.

> **설계 문서:** `docs/superpowers/specs/2026-06-24-hero-banner-design.md`

> **로컬 환경 전제:** colima + `npx supabase start` 가동, `npx supabase status -o json`의 API_URL이 `http://127.0.0.1:54321`인지 **반드시 먼저 확인**(운영 DB 보호). DB 컨테이너명은 `supabase_db_<worktree>` 형식.

> **디자인 보존(헌법 [7]):** 히어로 마크업·CSS·애니메이션은 변경하지 않는다. 슬라이드 **배경 소스만** SVG→`<img>`로 교체. 단, 모바일 캡션은 현재 `HERO_SLIDES[idx].date`를 쓰는데 사진엔 날짜가 없으므로 **사진 모드에서만** 날짜 접두사를 생략하고 카운터만 표시한다(SVG 폴백 경로는 기존 그대로).

---

## File Structure

| 파일 | 책임 | 작업 |
|------|------|------|
| `supabase/migrations/<ts>_hero_slides.sql` | 테이블·RLS·공개 버킷·storage 정책 | Create |
| `src/lib/database.types.ts` | DB 타입 | 재생성 |
| `src/lib/hero.ts` | 공개 슬라이드 뷰 타입 | Create |
| `src/server/uploads/hero.ts` | `hero` 공개 버킷 업로드/삭제 헬퍼 | Create |
| `src/server/services/hero.ts` | 공개 조회 + admin 조회 | Create |
| `src/server/actions/hero.ts` | 업로드·메타수정·삭제 액션 | Create |
| `src/app/(admin)/admin/hero/page.tsx` | 목록 | Create |
| `src/app/(admin)/admin/hero/new/page.tsx` | 업로드 | Create |
| `src/app/(admin)/admin/hero/[id]/edit/page.tsx` | 메타수정·삭제 | Create |
| `src/app/(admin)/admin/hero/NewForm.tsx` | 업로드 폼(파일 input) | Create |
| `src/app/(admin)/admin/hero/EditForm.tsx` | 메타수정 폼 | Create |
| `src/app/(admin)/admin/page.tsx` | 관리 링크 추가 | Modify |
| `src/app/main/page.tsx` | `getHeroSlides()` 호출·주입 | Modify |
| `src/app/main/_components/desktop/DesktopPage.tsx` | heroSlides 전달 | Modify |
| `src/app/main/_components/mobile/MobilePage.tsx` | heroSlides 전달 | Modify |
| `src/app/main/_components/desktop/DesktopHero.tsx` | slides prop·img 배경·폴백 | Modify |
| `src/app/main/_components/desktop/DesktopHero.module.css` | `.image` 클래스 추가 | Modify |
| `src/app/main/_components/mobile/HeroMobile.tsx` | slides prop·img 배경·폴백 | Modify |
| `src/app/main/_components/mobile/HeroMobile.module.css` | `.image` 클래스 추가 | Modify |

---

## Task 1: 마이그레이션 — 테이블·RLS·공개 버킷·storage 정책

**Files:**
- Create: `supabase/migrations/<timestamp>_hero_slides.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `npx supabase migration new hero_slides`
생성된 1줄짜리 빈 파일 경로를 확인하고 **Read로 먼저 연 뒤** 아래 내용으로 덮어쓴다.

- [ ] **Step 2: SQL 작성**

```sql
-- 메인 히어로 사진 배너 슬라이드.
create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  alt text not null default '',
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index hero_slides_sort_idx on public.hero_slides (sort_order);

alter table public.hero_slides enable row level security;

-- 공개분은 누구나, 비공개분은 admin만 읽는다.
create policy hero_slides_select on public.hero_slides
  for select using (is_published or public.auth_is_admin());
create policy hero_slides_write on public.hero_slides
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());

-- Storage — hero 버킷(공개). 배너 이미지는 공개 URL로 직접 노출(CDN 캐시).
insert into storage.buckets (id, name, public)
values ('hero', 'hero', true)
on conflict (id) do nothing;

-- 쓰기(업로드/수정/삭제)는 admin만. 읽기는 공개 버킷이라 익명 URL 접근 허용.
create policy storage_hero_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'hero' and public.auth_is_admin())
  with check (bucket_id = 'hero' and public.auth_is_admin());
```

- [ ] **Step 3: 로컬 적용**

먼저 `npx supabase status -o json`에서 API_URL이 `http://127.0.0.1:54321`인지 확인한다.
Run: `npx supabase db reset`
Expected: 마이그레이션이 오류 없이 적용됨.

- [ ] **Step 4: grant 복구(로컬 한정, 커밋하지 않음)**

```bash
CID=$(docker ps --filter "name=supabase_db_" --format "{{.ID}}")
docker exec -i "$CID" psql -U postgres -d postgres <<'SQL'
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to anon, authenticated, service_role;
SQL
```

- [ ] **Step 5: 테이블·버킷 확인**

```bash
CID=$(docker ps --filter "name=supabase_db_" --format "{{.ID}}")
docker exec -i "$CID" psql -U postgres -d postgres -c "\d public.hero_slides" -c "select id, public from storage.buckets where id='hero';"
```
Expected: 테이블 정의 + `hero | t`(공개) 출력.

- [ ] **Step 6: 커밋**

```bash
git add supabase/migrations
git commit -m "feat: hero_slides 테이블·공개 버킷·RLS 마이그레이션"
```

---

## Task 2: DB 타입 재생성

**Files:**
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: 타입 생성**

Run: `npx supabase gen types typescript --local > src/lib/database.types.ts`
(주의: `pnpm db:types`는 PATH에 없는 bare `supabase`를 호출하므로 위 npx 명령을 쓴다.)

- [ ] **Step 2: 반영 확인**

```bash
grep -c "hero_slides" src/lib/database.types.ts
```
Expected: 0보다 큰 값.

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 4: 커밋**

```bash
git add src/lib/database.types.ts
git commit -m "chore: hero_slides database.types 재생성"
```

---

## Task 3: lib/hero.ts — 공개 슬라이드 뷰 타입

**Files:**
- Create: `src/lib/hero.ts`

- [ ] **Step 1: 타입 작성**

```ts
// 히어로 — 클라이언트 안전 타입. DB·server-only 의존 없음.

// 공개 히어로 컴포넌트가 받는 슬라이드 뷰.
export type HeroSlideView = { url: string; alt: string };

// 업로드 허용 이미지 확장자(공개 버킷 정책).
export const HERO_IMAGE_EXT: Record<string, "image"> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
};
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 3: 커밋**

```bash
git add src/lib/hero.ts
git commit -m "feat: 히어로 슬라이드 뷰 타입·이미지 정책 추가"
```

---

## Task 4: 업로드 헬퍼 — 공개 hero 버킷

**Files:**
- Create: `src/server/uploads/hero.ts`

- [ ] **Step 1: 헬퍼 작성**

기존 `core.ts` 패턴(서버 MIME 검사·파일명 재생성)을 따르되 공개 `hero` 버킷에 올린다.

```ts
import "server-only";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { createSupabaseService } from "@/server/supabase/service";
import { extOf, preCheck, resolveMime, type UploadPolicy } from "@/lib/upload-policy";
import { HERO_IMAGE_EXT } from "@/lib/hero";
import { UploadError } from "./core";

const BUCKET = "hero";

const HERO_POLICY: UploadPolicy = {
  allowedExt: HERO_IMAGE_EXT,
  maxFileBytes: 8 * 1024 * 1024, // 8MB
  maxFiles: 1,
  maxTotalBytes: 8 * 1024 * 1024,
  maxFileLabel: "8MB",
};

// 공개 hero 버킷에 이미지 1장 저장. 저장 경로(파일명)는 서버에서 재생성.
export async function storeHeroImage(file: File): Promise<{ imagePath: string }> {
  const ext = extOf(file.name);
  const pre = preCheck(HERO_POLICY, file.name, file.size);
  if (pre) throw new UploadError("INVALID_FILE", pre);

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = (await fileTypeFromBuffer(buf)) ?? null;
  const mime = resolveMime(HERO_POLICY, ext, detected);
  if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

  const imagePath = `${randomUUID()}.${ext}`;
  const supabase = createSupabaseService();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, buf, { contentType: mime, upsert: false });
  if (error) throw new UploadError("STORAGE_FAILED", "이미지 저장에 실패했습니다.");
  return { imagePath };
}

export async function deleteHeroImage(imagePath: string): Promise<void> {
  const supabase = createSupabaseService();
  await supabase.storage.from(BUCKET).remove([imagePath]);
}

// 공개 URL 변환.
export function heroPublicUrl(imagePath: string): string {
  const supabase = createSupabaseService();
  return supabase.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl;
}
```

- [ ] **Step 2: `UploadError`가 export 되는지 확인**

`src/server/uploads/core.ts`에서 `export class UploadError`가 이미 export되어 있다(현재 코드 16행). import가 성립한다.

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 4: 커밋**

```bash
git add src/server/uploads/hero.ts
git commit -m "feat: 공개 hero 버킷 업로드 헬퍼"
```

---

## Task 5: 서비스 — 공개 조회 + admin 조회

**Files:**
- Create: `src/server/services/hero.ts`

- [ ] **Step 1: 서비스 작성**

```ts
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { heroPublicUrl } from "@/server/uploads/hero";
import type { HeroSlideView } from "@/lib/hero";

// 공개 슬라이드 — is_published, sort_order 순. 없으면 빈 배열(공개 화면이 SVG 폴백 판단).
export async function getHeroSlides(): Promise<HeroSlideView[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("hero_slides")
    .select("image_path, alt")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ url: heroPublicUrl(r.image_path), alt: r.alt }));
}

export type HeroAdminRow = {
  id: string;
  url: string;
  alt: string;
  isPublished: boolean;
  sortOrder: number;
};

export async function listHeroForAdmin(): Promise<HeroAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id, image_path, alt, is_published, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    url: heroPublicUrl(r.image_path),
    alt: r.alt,
    isPublished: r.is_published,
    sortOrder: r.sort_order,
  }));
}

export type HeroEditData = {
  id: string;
  url: string;
  alt: string;
  isPublished: boolean;
  sortOrder: number;
};

export async function getHeroSlideForEdit(id: string): Promise<HeroEditData | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("hero_slides")
    .select("id, image_path, alt, is_published, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  return {
    id: r.id,
    url: heroPublicUrl(r.image_path),
    alt: r.alt,
    isPublished: r.is_published,
    sortOrder: r.sort_order,
  };
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 3: 커밋**

```bash
git add src/server/services/hero.ts
git commit -m "feat: 히어로 공개 조회·admin 조회 서비스"
```

---

## Task 6: 액션 — 업로드·메타수정·삭제

**Files:**
- Create: `src/server/actions/hero.ts`

- [ ] **Step 1: 액션 작성**

```ts
"use server";
// hero_slides 생성(업로드)/메타수정/삭제. admin 전용(RLS + requireAdmin), zod 검증.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";
import { storeHeroImage, deleteHeroImage } from "@/server/uploads/hero";
import { UploadError } from "@/server/uploads/core";

const metaSchema = z.object({
  alt: z.string().trim().max(200),
  isPublished: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

export interface HeroFormState {
  error?: string;
}

function parseMeta(formData: FormData) {
  return metaSchema.safeParse({
    alt: formData.get("alt") ?? "",
    isPublished:
      formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

export async function createHeroSlide(
  _prev: HeroFormState,
  formData: FormData,
): Promise<HeroFormState> {
  await requireAdmin();
  const m = parseMeta(formData);
  if (!m.success) return { error: m.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "이미지를 선택해주세요." };

  let imagePath: string;
  try {
    ({ imagePath } = await storeHeroImage(file));
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "이미지 저장에 실패했습니다." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("hero_slides").insert({
    image_path: imagePath,
    alt: m.data.alt,
    is_published: m.data.isPublished,
    sort_order: m.data.sortOrder,
  });
  if (error) {
    await deleteHeroImage(imagePath); // DB 실패 시 업로드 롤백
    return { error: "저장에 실패했습니다." };
  }
  redirect("/admin/hero");
}

export async function updateHeroSlide(
  id: string,
  _prev: HeroFormState,
  formData: FormData,
): Promise<HeroFormState> {
  await requireAdmin();
  const m = parseMeta(formData);
  if (!m.success) return { error: m.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("hero_slides")
    .update({ alt: m.data.alt, is_published: m.data.isPublished, sort_order: m.data.sortOrder })
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect("/admin/hero");
}

export async function deleteHeroSlide(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: row } = await supabase
    .from("hero_slides")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("hero_slides").delete().eq("id", id);
  if (row?.image_path) await deleteHeroImage(row.image_path);
  redirect("/admin/hero");
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Step 3: 커밋**

```bash
git add src/server/actions/hero.ts
git commit -m "feat: 히어로 슬라이드 CRUD 액션(업로드·롤백)"
```

---

## Task 7: admin CRUD UI

**Files:**
- Create: `src/app/(admin)/admin/hero/NewForm.tsx`
- Create: `src/app/(admin)/admin/hero/EditForm.tsx`
- Create: `src/app/(admin)/admin/hero/page.tsx`
- Create: `src/app/(admin)/admin/hero/new/page.tsx`
- Create: `src/app/(admin)/admin/hero/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: NewForm 작성(파일 업로드)**

`src/app/(admin)/admin/hero/NewForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import type { HeroFormState } from "@/server/actions/hero";

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function NewForm({
  action,
}: {
  action: (prev: HeroFormState, formData: FormData) => Promise<HeroFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        이미지 (jpg·png·webp, 최대 8MB)
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required style={inputStyle} />
      </label>
      <input name="alt" placeholder="대체 텍스트(접근성, 선택)" style={inputStyle} />
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={0} min={0} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked /> 공개
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "업로드 중…" : "업로드"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: EditForm 작성(메타 수정)**

`src/app/(admin)/admin/hero/EditForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import type { HeroFormState } from "@/server/actions/hero";

type Initial = { alt: string; isPublished: boolean; sortOrder: number };
const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function EditForm({
  action,
  initial,
}: {
  action: (prev: HeroFormState, formData: FormData) => Promise<HeroFormState>;
  initial: Initial;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <input name="alt" defaultValue={initial.alt} placeholder="대체 텍스트(접근성, 선택)" style={inputStyle} />
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial.sortOrder} min={0} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} /> 공개
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : "수정 저장"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: 목록 page 작성**

`src/app/(admin)/admin/hero/page.tsx`:
```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listHeroForAdmin } from "@/server/services/hero";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminHeroPage() {
  await requireAdmin();
  const rows = await listHeroForAdmin();

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>메인 히어로 관리</h1>
        <Link href="/admin/hero/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 슬라이드
        </Link>
      </div>
      <p style={{ color: "#666", fontSize: 13 }}>
        사진이 없으면 메인 히어로는 기본 아트 배경으로 표시됩니다.
      </p>

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>미리보기</th>
            <th style={{ padding: "8px 6px" }}>대체 텍스트</th>
            <th style={{ padding: "8px 6px" }}>순서</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt={r.alt} style={{ width: 120, height: 60, objectFit: "cover", borderRadius: 4 }} />
              </td>
              <td style={{ padding: "8px 6px" }}>{r.alt || <span style={{ color: "#bbb" }}>—</span>}</td>
              <td style={{ padding: "8px 6px" }}>{r.sortOrder}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <Link href={`/admin/hero/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 슬라이드가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 4: new page 작성**

`src/app/(admin)/admin/hero/new/page.tsx`:
```tsx
import { requireAdmin } from "@/server/auth/current-user";
import { createHeroSlide } from "@/server/actions/hero";
import NewForm from "../NewForm";

export default async function NewHeroPage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 540, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 히어로 슬라이드</h1>
      <NewForm action={createHeroSlide} />
    </main>
  );
}
```

- [ ] **Step 5: edit page 작성**

`src/app/(admin)/admin/hero/[id]/edit/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getHeroSlideForEdit } from "@/server/services/hero";
import { updateHeroSlide, deleteHeroSlide } from "@/server/actions/hero";
import EditForm from "../../EditForm";

export default async function EditHeroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await getHeroSlideForEdit(id);
  if (!row) notFound();

  const update = updateHeroSlide.bind(null, id);
  const remove = deleteHeroSlide.bind(null, id);

  return (
    <main style={{ maxWidth: 540, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/hero" style={{ fontSize: 13, color: "#666" }}>← 목록</Link>
      <h1 style={{ fontSize: 22 }}>히어로 슬라이드 수정</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={row.url} alt={row.alt} style={{ width: "100%", maxWidth: 360, borderRadius: 6, marginBottom: 16 }} />
      <p style={{ color: "#888", fontSize: 12, marginTop: 0 }}>
        이미지를 바꾸려면 이 슬라이드를 삭제하고 새로 업로드해주세요.
      </p>
      <EditForm action={update} initial={{ alt: row.alt, isPublished: row.isPublished, sortOrder: row.sortOrder }} />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          슬라이드 삭제
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: 대시보드 링크 추가**

`src/app/(admin)/admin/page.tsx`의 링크 묶음에서 현재 마지막 줄:
```tsx
        <Link href="/admin/collections">자료실 컬렉션 관리 →</Link>
```
뒤에 추가:
```tsx
        <Link href="/admin/hero">메인 히어로 관리 →</Link>
```

> 참고: PR #56(자료실 컬렉션)이 머지되어 origin/main에 위 collections 링크가 이미 있다. 만약 없으면 timetable 링크 뒤에 두 줄(collections·hero)을 추가한다.

- [ ] **Step 7: 타입체크·린트**

Run: `npx tsc --noEmit; echo "TSC=$?"; pnpm lint > /dev/null 2>&1; echo "LINT=$?"`
Expected: `TSC=0`, `LINT=0`

- [ ] **Step 8: 커밋**

```bash
git add "src/app/(admin)/admin/hero" "src/app/(admin)/admin/page.tsx"
git commit -m "feat: 메인 히어로 admin CRUD UI"
```

---

## Task 8: 공개 화면 배선 + 폴백 (디자인 보존)

**Files:**
- Modify: `src/app/main/page.tsx`
- Modify: `src/app/main/_components/desktop/DesktopPage.tsx`
- Modify: `src/app/main/_components/mobile/MobilePage.tsx`
- Modify: `src/app/main/_components/desktop/DesktopHero.tsx`
- Modify: `src/app/main/_components/desktop/DesktopHero.module.css`
- Modify: `src/app/main/_components/mobile/HeroMobile.tsx`
- Modify: `src/app/main/_components/mobile/HeroMobile.module.css`

- [ ] **Step 1: page.tsx — getHeroSlides 호출·주입**

`src/app/main/page.tsx`:

import 추가:
```tsx
import { getHeroSlides } from "@/server/services/hero";
```
`MainPage` 본문에서 데이터 두 개를 병렬로 가져오고 props로 넘긴다:
```tsx
export default async function MainPage() {
  const [home, heroSlides] = await Promise.all([getHomeData(), getHeroSlides()]);
  return (
    <div className={styles.root}>
      <div className={styles.desktopOnly}>
        <DesktopPage home={home} heroSlides={heroSlides} />
      </div>
      <div className={styles.mobileOnly}>
        <MobilePage home={home} heroSlides={heroSlides} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: DesktopPage — heroSlides 전달**

`src/app/main/_components/desktop/DesktopPage.tsx`:

상단 import에 타입 추가:
```tsx
import type { HeroSlideView } from "@/lib/hero";
```
시그니처와 사용부 교체:
```tsx
export default function DesktopPage({ home, heroSlides }: { home: HomeData; heroSlides: HeroSlideView[] }) {
```
```tsx
        <DesktopHero slides={heroSlides} />
```

- [ ] **Step 3: MobilePage — heroSlides 전달**

`src/app/main/_components/mobile/MobilePage.tsx`:

```tsx
import type { HeroSlideView } from "@/lib/hero";
```
```tsx
export default function MobilePage({ home, heroSlides }: { home: HomeData; heroSlides: HeroSlideView[] }) {
```
```tsx
      <HeroMobile slides={heroSlides} />
```

- [ ] **Step 4: DesktopHero.module.css — `.image` 추가**

`src/app/main/_components/desktop/DesktopHero.module.css` 끝에 추가:
```css
.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

- [ ] **Step 5: DesktopHero.tsx — slides prop·img 배경·폴백**

`src/app/main/_components/desktop/DesktopHero.tsx` 전체를 아래로 교체(마크업·클래스·오버레이·텍스트·점·카운터·자동전환은 그대로, 배경 소스와 개수만 분기):
```tsx
"use client";

import { useEffect, useState } from "react";
import type { HeroSlideView } from "@/lib/hero";
import { HERO_SLIDE_COMPONENTS } from "../HeroSlides";
import styles from "./DesktopHero.module.css";

const SLIDE_INTERVAL_MS = 5500;

/**
 * 데스크톱 히어로 — 자동 슬라이드(5.5초) + 켄번스 + 점 수동 전환.
 * 배경은 관리자 사진(slides)이 있으면 사진, 없으면 기본 SVG 아트로 폴백.
 */
export default function DesktopHero({ slides }: { slides: HeroSlideView[] }) {
  const usePhotos = slides.length > 0;
  const total = usePhotos ? slides.length : HERO_SLIDE_COMPONENTS.length;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [total]);

  return (
    <section className={styles.hero}>
      {usePhotos
        ? slides.map((s, i) => (
            <div key={i} className={styles.slide} data-active={i === idx ? "true" : "false"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.alt} className={styles.image} />
            </div>
          ))
        : HERO_SLIDE_COMPONENTS.map((Component, i) => (
            <div key={i} className={styles.slide} data-active={i === idx ? "true" : "false"}>
              <Component />
            </div>
          ))}
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.kicker}>EDUCATION · COMMUNITY · FAITH</div>
          <h1 className={styles.title}>
            가르치는 자의
            <br />
            <em>거룩한 부르심</em>
          </h1>
          <p className={styles.lead}>
            다음 세대를 세우는 교사들의 자리. 서경노회 교육위원회가 함께합니다.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn}>수련회 신청 →</button>
            <button type="button" className={styles.ghostBtn}>공지사항 보기</button>
          </div>
        </div>
      </div>

      <div className={styles.indicator}>
        <div className={styles.dots}>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={styles.dot}
              data-active={i === idx ? "true" : "false"}
              role="button"
              tabIndex={0}
              aria-label={`슬라이드 ${i + 1}로 이동`}
              onClick={() => setIdx(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIdx(i);
                }
              }}
            />
          ))}
        </div>
        <div className={styles.counter}>
          {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: HeroMobile.module.css — `.image` 추가**

`src/app/main/_components/mobile/HeroMobile.module.css` 끝에 추가:
```css
.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

- [ ] **Step 7: HeroMobile.tsx — slides prop·img 배경·폴백**

`src/app/main/_components/mobile/HeroMobile.tsx` 전체를 아래로 교체(사진 모드에선 캡션의 날짜 접두사 생략, SVG 폴백 경로는 날짜 유지):
```tsx
"use client";

import { useEffect, useState } from "react";
import type { HeroSlideView } from "@/lib/hero";
import { HERO_SLIDE_COMPONENTS } from "../HeroSlides";
import { HERO_SLIDES } from "@/lib/main-page-data";
import styles from "./HeroMobile.module.css";

const SLIDE_INTERVAL_MS = 5500;

/**
 * 모바일 히어로 — 자동 슬라이드(5.5초) + 켄번스 + 점 수동 전환.
 * 배경은 관리자 사진(slides)이 있으면 사진, 없으면 기본 SVG 아트로 폴백.
 */
export default function HeroMobile({ slides }: { slides: HeroSlideView[] }) {
  const usePhotos = slides.length > 0;
  const total = usePhotos ? slides.length : HERO_SLIDE_COMPONENTS.length;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [total]);

  const counter = `${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const caption = usePhotos ? counter : `${HERO_SLIDES[idx].date} · ${counter}`;

  return (
    <section className={styles.hero}>
      {usePhotos
        ? slides.map((s, i) => (
            <div key={i} className={styles.slide} data-active={i === idx ? "true" : "false"} data-origin={i % 2 === 0 ? "a" : "b"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.alt} className={styles.image} />
            </div>
          ))
        : HERO_SLIDE_COMPONENTS.map((Component, i) => (
            <div key={i} className={styles.slide} data-active={i === idx ? "true" : "false"} data-origin={i % 2 === 0 ? "a" : "b"}>
              <Component />
            </div>
          ))}

      <div className={styles.overlay} />
      <div className={styles.grain} />

      <div className={styles.content}>
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>
            <svg width="11" height="18" viewBox="0 0 12 20" fill="none">
              <rect x="5" y="0" width="2" height="20" fill="#fff" />
              <rect x="0" y="5" width="12" height="2" fill="#fff" />
            </svg>
          </div>
          <div className={styles.brandText}>
            <div className={styles.brandKo}>서경노회 교육위원회 웹진</div>
            <div className={styles.brandEn}>Seogyeong Presbytery Education Committee</div>
          </div>
        </div>

        <div className={styles.welcome}>
          <div className={styles.kicker}>EDUCATION · COMMUNITY · FAITH</div>
          <h1 className={styles.title}>
            가르치는 자의
            <br />
            <em className={styles.titleEm}>거룩한 부르심</em>
          </h1>
          <p className={styles.lead}>
            다음 세대를 세우는 교사들의 자리.
            <br />
            서경노회 교육위원회가 함께합니다.
          </p>

          <div className={styles.indicatorRow}>
            <div className={styles.dots}>
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={styles.dot}
                  data-active={i === idx ? "true" : "false"}
                  role="button"
                  tabIndex={0}
                  aria-label={`슬라이드 ${i + 1}로 이동`}
                  onClick={() => setIdx(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIdx(i);
                    }
                  }}
                />
              ))}
            </div>
            <div className={styles.caption}>{caption}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: 타입체크·빌드**

Run: `npx tsc --noEmit; echo "TSC=$?"; pnpm build > /tmp/b.log 2>&1; echo "BUILD=$?"; tail -5 /tmp/b.log`
Expected: `TSC=0`, `BUILD=0`.

- [ ] **Step 9: 커밋**

```bash
git add src/app/main
git commit -m "feat: 메인 히어로 사진 배경 배선·SVG 폴백"
```

---

## Task 9: 로컬 e2e 검증 + plan 커밋

**Files:**
- (검증 전용. 마지막에 plan 문서 커밋.)

- [ ] **Step 1: 폴백 상태 확인(사진 0장)**

`pnpm dev` 후 또는 preview로 `/`를 연다. `hero_slides`가 비어 있으므로 **기존 SVG 아트 히어로**가 정상 표시되는지 확인한다(자동 전환·점·카운터 동작).

- [ ] **Step 2: admin 업로드 검증**

admin 로그인(admin@seogyeong.kr / admin1234) → `/admin/hero/new`에서 작은 이미지(jpg/png) 2장을 각각 업로드(순서 0, 1). 목록에서 썸네일 2개와 공개 ✓ 확인.

DB·Storage 확인:
```bash
CID=$(docker ps --filter "name=supabase_db_" --format "{{.ID}}")
docker exec -i "$CID" psql -U postgres -d postgres -c "select alt, is_published, sort_order, image_path from public.hero_slides order by sort_order;"
docker exec -i "$CID" psql -U postgres -d postgres -c "select name from storage.objects where bucket_id='hero';"
```
Expected: 행 2개 + Storage 오브젝트 2개.

- [ ] **Step 3: 공개 화면 사진 모드 확인**

`/`를 다시 열어 히어로 배경이 **업로드한 사진**으로 바뀌고 점/카운터가 2개 기준(01/02)으로 도는지 확인. 데스크톱·모바일 양쪽(모바일은 user-agent 분기) 확인.

- [ ] **Step 4: 순서·비공개·삭제 검증**

- 순서: 한 슬라이드의 sort_order를 바꿔 순서 반영 확인.
- 비공개: 한 장을 비공개로 → 공개 화면에서 1장만(01/01) 표시.
- 삭제: 한 장 삭제 → DB 행과 Storage 오브젝트가 함께 사라지는지 위 쿼리로 확인.

- [ ] **Step 5: 거부 케이스 확인**

`/admin/hero/new`에서 이미지가 아닌 파일(예: .txt) 또는 8MB 초과 파일 업로드 시 폼에 에러 메시지가 뜨고 저장되지 않는지 확인.

- [ ] **Step 6: 폴백 복귀 확인 + 정리**

남은 슬라이드를 모두 삭제 → `/`에서 **SVG 아트로 복귀**하는지 확인. 검증 데이터(슬라이드·Storage 오브젝트) 정리 완료.

- [ ] **Step 7: 최종 점검**

Run: `npx tsc --noEmit; echo "TSC=$?"; pnpm lint > /dev/null 2>&1; echo "LINT=$?"; pnpm build > /tmp/b.log 2>&1; echo "BUILD=$?"; git status --short`
Expected: `TSC=0`, `LINT=0`, `BUILD=0`, working tree clean.

- [ ] **Step 8: plan 문서 커밋**

```bash
git add docs/superpowers/plans/2026-06-24-hero-banner.md
git commit -m "docs: 메인 히어로 사진 배너 실행 plan"
```

---

## 검증·완료 기준

- 마이그레이션이 로컬에 적용되고 운영 반영(`npx supabase db push`)은 **머지 후 별도 수행**(사용자 확인 필요).
- 관리자가 사진을 올리면 메인 히어로가 사진 슬라이드로 바뀌고, 0장이면 SVG 아트로 폴백한다.
- admin에서 업로드·순서·공개토글·삭제가 동작하고 Storage 오브젝트가 함께 정리된다.
- 허용 외 형식/용량 초과는 거부된다.
- 히어로 텍스트·동작·CSS는 변경되지 않는다(사진 모드 모바일 캡션의 날짜 접두사 생략만 예외).
- `tsc`·`lint`·`build` 통과.
