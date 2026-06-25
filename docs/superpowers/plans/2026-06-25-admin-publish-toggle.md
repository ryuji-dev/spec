# admin 공개/비공개 토글 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5개 `posts` 도메인(notice·training·committee·webzine·resources)에 공개/비공개 토글을 추가한다 — 편집 폼 체크박스 + admin 목록 빠른 토글.

**Architecture:** `posts.is_published`와 공개 서비스 필터·RLS는 이미 존재하므로 값 쓰기 경로만 추가한다. (1) 작성/수정 액션이 `is_published`를 반영, (2) 편집 폼에 `공개` 체크박스, (3) `get…ForEdit`가 `isPublished` 반환, (4) 공용 `PublishToggle` + 도메인별 `togglePublished` 액션으로 목록에서 즉시 전환. 스키마·마이그레이션·RLS 변경 없음.

**Tech Stack:** Next.js 16 App Router(Server Action, useActionState), TypeScript strict, supabase-js, zod, 로컬 Supabase CLI.

**검증 방식:** 단위 테스트 러너 없음. 각 태스크는 `npx tsc --noEmit`(0) + `pnpm lint`(0), 마지막에 로컬 e2e + `pnpm build`.

**도메인별 상수 (토글 액션에 사용):**

| 도메인 | 액션 파일 | section | revalidate 경로 | 작성 액션 | 수정 액션 | 폼 컴포넌트 | ForEdit |
|---|---|---|---|---|---|---|---|
| committee | actions/committee.ts | committee | /committee, /main, /admin/committee | createPost | updatePost | committee/EditorForm.tsx | getCommitteePostForEdit |
| notice | actions/notice.ts | notice | /notice, /main, /admin/notice | createPost | updatePost | notice/EditorForm.tsx | getNoticePostForEdit |
| training | actions/training.ts | training | /training, /main, /admin/training | createPost | updatePost | training/EditorForm.tsx | getTrainingPostForEdit |
| webzine | actions/webzine.ts | webzine | /webzine, /admin/webzine | createPost | updatePost | webzine/EditorForm.tsx | getWebzineArticleForEdit |
| resources | actions/resource.ts | resource | /resources, /admin/resources | createResource | updateResource | resources/ResourceEditorForm.tsx | getResourcePostForEdit |

공용 체크박스 스니펫(모든 폼 동일, 제출 버튼 바로 위에 삽입):

```tsx
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
      </label>
```

zod·파서 추가(모든 액션 동일):
- 스키마 객체에 `isPublished: z.coerce.boolean(),` 추가
- 파서의 safeParse 인자에 `isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",` 추가
- create의 insert와 update의 update 객체에 `is_published: r.data.isPublished,` 추가

---

## Task 1: 공용 PublishToggle 컴포넌트

**Files:**
- Create: `src/app/(admin)/admin/_components/PublishToggle.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
"use client";

// 바인딩된 서버 토글 액션을 호출해 공개/비공개를 즉시 전환. admin 목록이 공유.
export default function PublishToggle({
  action,
  isPublished,
}: {
  action: () => Promise<void>;
  isPublished: boolean;
}) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <button
        type="submit"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit", color: isPublished ? "#080" : "#888" }}
        title={isPublished ? "클릭하면 비공개로 전환" : "클릭하면 공개로 전환"}
      >
        {isPublished ? "공개 ✓" : "비공개"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 0

- [ ] **Step 3: 커밋**

```bash
git add "src/app/(admin)/admin/_components/PublishToggle.tsx"
git commit -m "feat: admin 목록 공개/비공개 토글 컴포넌트"
```

---

## Task 2: committee 공개 토글 (기준 슬라이스)

**Files:**
- Modify: `src/server/actions/committee.ts`
- Modify: `src/server/services/committee.ts` (`CommitteeEditData` + `getCommitteePostForEdit`)
- Modify: `src/app/(admin)/admin/committee/EditorForm.tsx`
- Modify: `src/app/(admin)/admin/committee/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/admin/committee/page.tsx`

- [ ] **Step 1: 액션 — 스키마·파서·insert·update에 is_published + togglePublished 신설**

`actions/committee.ts`:
- 스키마 객체에 `isPublished: z.coerce.boolean(),` 추가.
- 파서(safeParse 인자)에 `isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",` 추가.
- `createPost`의 `.insert({ ... })`에 `is_published: r.data.isPublished,` 추가.
- `updatePost`의 `.update({ ... })`에 `is_published: r.data.isPublished,` 추가.
- 파일 끝에 토글 액션 추가:

```ts
export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", "committee");
  revalidatePath("/committee");
  revalidatePath("/main");
  revalidatePath("/admin/committee");
}
```

> 확인: 상단에 `revalidatePath`, `requireAdmin`, `createSupabaseServer` import가 이미 있음(committee 액션은 사용 중).

- [ ] **Step 2: 서비스 — ForEdit에 isPublished**

`services/committee.ts` `getCommitteePostForEdit`:
- `CommitteeEditData` 타입에 `isPublished: boolean;` 추가.
- select 문자열에 `is_published` 추가: `"id, category, title, excerpt, body, is_pinned, event_date, meta, is_published"`.
- return 객체에 `isPublished: r.is_published,` 추가.

- [ ] **Step 3: 편집 폼 — 공개 체크박스**

`committee/EditorForm.tsx`:
- `Initial` 타입에 `isPublished?: boolean;` 추가.
- 제출 버튼 `<button>` 바로 위에 공용 체크박스 스니펫 삽입:

```tsx
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
      </label>
```

- [ ] **Step 4: 편집 페이지 — initial 전달**

`committee/[id]/edit/page.tsx`의 `<EditorForm initial={{ ... }}>`에 `isPublished: post.isPublished,` 추가.

- [ ] **Step 5: 목록 — 토글 셀**

`committee/page.tsx`:
- import 추가: `import { deletePost, togglePublished } from "@/server/actions/committee";` (기존 `deletePost` import에 합침) 와 `import PublishToggle from "../_components/PublishToggle";`
- 공개 셀 교체:

```tsx
              <td style={{ padding: "8px 6px" }}>
                <PublishToggle action={togglePublished.bind(null, r.id, !r.isPublished)} isPublished={r.isPublished} />
              </td>
```

(기존 `{r.isPublished ? "✓" : ""}` 셀을 위로 대체.)

- [ ] **Step 6: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 0

- [ ] **Step 7: 커밋**

```bash
git add "src/server/actions/committee.ts" "src/server/services/committee.ts" "src/app/(admin)/admin/committee/EditorForm.tsx" "src/app/(admin)/admin/committee/[id]/edit/page.tsx" "src/app/(admin)/admin/committee/page.tsx"
git commit -m "feat: 위원회 소식 공개/비공개 토글"
```

---

## Task 3: notice 공개 토글

**Files:**
- Modify: `src/server/actions/notice.ts`
- Modify: `src/server/services/notice.ts` (`NoticeEditData` + `getNoticePostForEdit`)
- Modify: `src/app/(admin)/admin/notice/EditorForm.tsx`
- Modify: `src/app/(admin)/admin/notice/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/admin/notice/page.tsx`

- [ ] **Step 1: 액션**

`actions/notice.ts`:
- `noticeSchema`에 `isPublished: z.coerce.boolean(),` 추가.
- `parseNotice`의 safeParse 인자에 `isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",` 추가.
- `createPost`의 insert에 `is_published: r.data.isPublished,` 추가.
- `updatePost`의 update에 `is_published: r.data.isPublished,` 추가.
- 파일 끝에:

```ts
export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", "notice");
  revalidatePath("/notice");
  revalidatePath("/main");
  revalidatePath("/admin/notice");
}
```

- [ ] **Step 2: 서비스**

`services/notice.ts` `getNoticePostForEdit`:
- `NoticeEditData` 타입에 `isPublished: boolean;` 추가.
- select에 `is_published` 추가.
- return에 `isPublished: r.is_published,` 추가.

- [ ] **Step 3: 편집 폼**

`notice/EditorForm.tsx`: `Initial`에 `isPublished?: boolean;` 추가 + 제출 버튼 위에 공용 체크박스 스니펫 삽입.

- [ ] **Step 4: 편집 페이지**

`notice/[id]/edit/page.tsx`의 `initial`에 `isPublished: post.isPublished,` 추가.

- [ ] **Step 5: 목록**

`notice/page.tsx`:
- `import { deletePost, togglePublished } from "@/server/actions/notice";` + `import PublishToggle from "../_components/PublishToggle";`
- 공개 셀을 토글로 교체:

```tsx
              <td style={{ padding: "8px 6px" }}>
                <PublishToggle action={togglePublished.bind(null, r.id, !r.isPublished)} isPublished={r.isPublished} />
              </td>
```

- [ ] **Step 6: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 0

- [ ] **Step 7: 커밋**

```bash
git add "src/server/actions/notice.ts" "src/server/services/notice.ts" "src/app/(admin)/admin/notice/EditorForm.tsx" "src/app/(admin)/admin/notice/[id]/edit/page.tsx" "src/app/(admin)/admin/notice/page.tsx"
git commit -m "feat: 공지 공개/비공개 토글"
```

---

## Task 4: training 공개 토글

**Files:**
- Modify: `src/server/actions/training.ts`
- Modify: `src/server/services/training.ts` (`getTrainingPostForEdit` + 그 EditData 타입)
- Modify: `src/app/(admin)/admin/training/EditorForm.tsx`
- Modify: `src/app/(admin)/admin/training/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/admin/training/page.tsx`

- [ ] **Step 1: 액션**

`actions/training.ts`: 스키마에 `isPublished: z.coerce.boolean(),` + 파서에 `isPublished` 파싱 + create insert·update에 `is_published: r.data.isPublished,` + 파일 끝에:

```ts
export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", "training");
  revalidatePath("/training");
  revalidatePath("/main");
  revalidatePath("/admin/training");
}
```

- [ ] **Step 2: 서비스**

`services/training.ts` `getTrainingPostForEdit`: EditData 타입에 `isPublished: boolean;` + select에 `is_published` + return에 `isPublished: r.is_published,`.

- [ ] **Step 3: 편집 폼**

`training/EditorForm.tsx`: `Initial`에 `isPublished?: boolean;` + 제출 버튼 위 공용 체크박스.

- [ ] **Step 4: 편집 페이지**

`training/[id]/edit/page.tsx`의 `initial`에 `isPublished: post.isPublished,`.

- [ ] **Step 5: 목록**

`training/page.tsx`: `import { deletePost, togglePublished } from "@/server/actions/training";` + `import PublishToggle from "../_components/PublishToggle";` + 공개 셀 교체:

```tsx
              <td style={{ padding: "8px 6px" }}>
                <PublishToggle action={togglePublished.bind(null, r.id, !r.isPublished)} isPublished={r.isPublished} />
              </td>
```

- [ ] **Step 6: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 0

- [ ] **Step 7: 커밋**

```bash
git add "src/server/actions/training.ts" "src/server/services/training.ts" "src/app/(admin)/admin/training/EditorForm.tsx" "src/app/(admin)/admin/training/[id]/edit/page.tsx" "src/app/(admin)/admin/training/page.tsx"
git commit -m "feat: 강습회 글 공개/비공개 토글"
```

---

## Task 5: webzine 공개 토글

**Files:**
- Modify: `src/server/actions/webzine.ts`
- Modify: `src/server/services/webzine.ts` (`getWebzineArticleForEdit` + 그 EditData 타입)
- Modify: `src/app/(admin)/admin/webzine/EditorForm.tsx`
- Modify: `src/app/(admin)/admin/webzine/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/admin/webzine/page.tsx`

- [ ] **Step 1: 액션**

`actions/webzine.ts`: 스키마에 `isPublished: z.coerce.boolean(),` + 파서에 `isPublished` 파싱 + create insert·update에 `is_published: r.data.isPublished,` + 파일 끝에:

```ts
export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", "webzine");
  revalidatePath("/webzine");
  revalidatePath("/admin/webzine");
}
```

- [ ] **Step 2: 서비스**

`services/webzine.ts` `getWebzineArticleForEdit`: EditData 타입에 `isPublished: boolean;` + select에 `is_published` + return에 `isPublished: r.is_published,`.

- [ ] **Step 3: 편집 폼**

`webzine/EditorForm.tsx`: `Initial`에 `isPublished?: boolean;` + 제출 버튼 위 공용 체크박스.

- [ ] **Step 4: 편집 페이지**

`webzine/[id]/edit/page.tsx`의 `initial`에 `isPublished: post.isPublished,`.

- [ ] **Step 5: 목록**

`webzine/page.tsx`: `import { deletePost, togglePublished } from "@/server/actions/webzine";` + `import PublishToggle from "../_components/PublishToggle";` + 공개 셀 교체:

```tsx
              <td style={{ padding: "8px 6px" }}>
                <PublishToggle action={togglePublished.bind(null, r.id, !r.isPublished)} isPublished={r.isPublished} />
              </td>
```

- [ ] **Step 6: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 0

- [ ] **Step 7: 커밋**

```bash
git add "src/server/actions/webzine.ts" "src/server/services/webzine.ts" "src/app/(admin)/admin/webzine/EditorForm.tsx" "src/app/(admin)/admin/webzine/[id]/edit/page.tsx" "src/app/(admin)/admin/webzine/page.tsx"
git commit -m "feat: 웹진 공개/비공개 토글"
```

---

## Task 6: resources 공개 토글 (액션·폼 이름 다름)

resources는 액션이 `createResource`/`updateResource`, 파서가 `parse`, 폼 필드가 `sub`, ForEdit가 `getResourcePostForEdit`(반환 `{id, category, title, sub, attachments}`), 폼이 `ResourceEditorForm.tsx`다.

**Files:**
- Modify: `src/server/actions/resource.ts`
- Modify: `src/server/services/resource.ts` (`ResourceEditData` + `getResourcePostForEdit`)
- Modify: `src/app/(admin)/admin/resources/ResourceEditorForm.tsx`
- Modify: `src/app/(admin)/admin/resources/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/admin/resources/page.tsx`

- [ ] **Step 1: 액션**

`actions/resource.ts`:
- `schema`에 `isPublished: z.coerce.boolean(),` 추가.
- `parse`의 safeParse 인자에 `isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",` 추가.
- `createResource`의 insert에 `is_published: r.data.isPublished,` 추가.
- `updateResource`의 update 객체 `{ category, title, excerpt: sub }`에 `is_published: r.data.isPublished,` 추가.
- 파일 끝에:

```ts
export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", "resource");
  revalidatePath("/resources");
  revalidatePath("/admin/resources");
}
```

> 확인: `actions/resource.ts`는 현재 `revalidatePath`를 import하지 않으므로 상단 import에 추가 — `import { revalidatePath } from "next/cache";`

- [ ] **Step 2: 서비스**

`services/resource.ts` `getResourcePostForEdit`: `ResourceEditData`에 `isPublished: boolean;` + select(`"id, category, title, excerpt"`)에 `is_published` 추가 + return에 `isPublished: r.is_published,`.

- [ ] **Step 3: 편집 폼**

`resources/ResourceEditorForm.tsx`: `Initial`(`{ title?, category?, sub? }`)에 `isPublished?: boolean;` 추가 + 제출 버튼 위 공용 체크박스 스니펫.

- [ ] **Step 4: 편집 페이지**

`resources/[id]/edit/page.tsx`의 `<ResourceEditorForm initial={{ ... }}>`에 `isPublished: post.isPublished,` 추가.

- [ ] **Step 5: 목록**

`resources/page.tsx`:
- `import { deleteResource, togglePublished } from "@/server/actions/resource";` (기존 `deleteResource` import에 합침) + `import PublishToggle from "../_components/PublishToggle";`
- 공개 셀 교체:

```tsx
              <td style={{ padding: "8px 6px" }}>
                <PublishToggle action={togglePublished.bind(null, r.id, !r.isPublished)} isPublished={r.isPublished} />
              </td>
```

- [ ] **Step 6: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 0

- [ ] **Step 7: 커밋**

```bash
git add "src/server/actions/resource.ts" "src/server/services/resource.ts" "src/app/(admin)/admin/resources/ResourceEditorForm.tsx" "src/app/(admin)/admin/resources/[id]/edit/page.tsx" "src/app/(admin)/admin/resources/page.tsx"
git commit -m "feat: 자료실 공개/비공개 토글"
```

---

## Task 7: 로컬 e2e 검증 + 빌드

**Files:** (없음 — 검증 전용)

- [ ] **Step 1: 로컬 Supabase 확인**

Run: `npx supabase status -o json | grep API_URL`
Expected: `http://127.0.0.1:54321` (운영 아님 확인). 아니면 `colima start && npx supabase start`.

- [ ] **Step 2: 개발 서버 + admin 로그인**

`pnpm dev` 후 `/login`에서 admin(`admin@seogyeong.kr` / `admin1234`) 로그인.

- [ ] **Step 3: 도메인별 토글 e2e**

각 도메인(notice·training·committee·webzine·resources)에서:
- 목록의 공개 셀이 `공개 ✓`/`비공개` 버튼으로 보인다
- `공개 ✓` 클릭 → `비공개`로 바뀐다 → 해당 공개 목록/상세에서 사라진다(비로그인/공개 경로 fetch로 확인)
- 다시 클릭 → `공개 ✓` → 공개 사이트 노출 복귀
- 편집 폼에서 `공개` 체크 해제 저장 → 비공개 반영 / 체크 저장 → 공개 반영
- 새 글 작성(공개 체크 기본) → 공개로 생성됨
- 비공개 글이 admin 목록에는 계속 보인다

- [ ] **Step 4: 빌드**

Run: `pnpm build`
Expected: 성공(0).

- [ ] **Step 5: plan 갱신 커밋(있을 때만)**

```bash
git add docs/superpowers/plans/2026-06-25-admin-publish-toggle.md
git commit -m "docs: 공개 토글 plan 검증 반영"
```

---

## 완료 기준

- 5개 도메인 편집 폼 `공개` 체크박스 + 목록 빠른 토글 동작
- 작성/수정 시 공개 상태 반영(새 글 기본 공개)
- 토글 시 공개 사이트 즉시 반영(revalidatePath), 비공개 글은 admin 목록 유지
- 공용 `PublishToggle` 1개 + 도메인별 `togglePublished` 액션, 신규 마이그레이션·스키마·RLS 변경 0
- `tsc`·`lint`·`build` 통과, 로컬 e2e 통과
