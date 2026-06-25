# admin 글 관리 색인 + 삭제 연결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5개 `posts` 도메인(notice·training·committee·webzine·resources)에 admin 목록 페이지를 신설하고, 기존 삭제 액션을 confirm UI로 연결한다.

**Architecture:** 기존 events 목록 패턴 미러 — 도메인별 `list…ForAdmin()` 서비스(미공개 포함 전체 조회) + `/admin/<domain>/page.tsx` 인라인 테이블 + 공용 `DeletePostButton` 클라이언트 컴포넌트(바인딩된 기존 서버 액션 호출). 신규 마이그레이션·신규 액션·스키마 변경 없음.

**Tech Stack:** Next.js 16 App Router(Server Component + Server Action), TypeScript strict, supabase-js, 로컬 Supabase CLI 스택.

**검증 방식:** 이 저장소는 단위 테스트 러너가 없다. 각 태스크는 `npx tsc --noEmit`(타입 0) + `pnpm lint`(0)로 검증하고, 마지막에 로컬 Supabase + admin 로그인으로 e2e를 수행한다.

**참조 패턴(읽고 따를 것):**
- 목록 페이지: `src/app/(admin)/admin/events/page.tsx`
- 서비스 admin 조회: `src/server/services/training.ts`의 `listEventsForAdmin` (294행~)
- 날짜 포맷: `src/lib/datetime.ts`의 `isoToKstDate(iso)`
- 섹션 상수: 각 서비스 파일 상단 `const SECTION = "<name>" as const;`

---

## Task 1: 공용 DeletePostButton 컴포넌트

**Files:**
- Create: `src/app/(admin)/admin/_components/DeletePostButton.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/app/(admin)/admin/_components/DeletePostButton.tsx`:

```tsx
"use client";

// 바인딩된 서버 삭제 액션을 confirm 후 호출하는 공용 버튼. 5개 admin 목록이 공유.
export default function DeletePostButton({
  action,
  confirmText = "삭제하시겠습니까? 되돌릴 수 없습니다.",
}: {
  action: () => Promise<void>;
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <button
        type="submit"
        style={{ color: "#c00", background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}
      >
        삭제
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 오류 0 (아직 import하는 곳 없음, 컴포넌트 자체만 검증)

- [ ] **Step 3: 커밋**

```bash
git add "src/app/(admin)/admin/_components/DeletePostButton.tsx"
git commit -m "feat: admin 목록 공용 삭제 버튼 컴포넌트"
```

---

## Task 2: committee 서비스 + 목록 (기준 슬라이스)

가장 표준적인 도메인(분류 컬럼)으로 먼저 완성해 패턴을 고정한다.

**Files:**
- Modify: `src/server/services/committee.ts` (파일 끝에 함수 추가)
- Create: `src/app/(admin)/admin/committee/page.tsx`

- [ ] **Step 1: 서비스에 admin 목록 함수 추가**

`src/server/services/committee.ts` 파일 **끝**에 추가:

```ts
export type CommitteeAdminRow = {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
  isPublished: boolean;
};

// admin 전용: 미공개 포함 전체(RLS가 admin에 전체 행 허용), 최신순.
export async function listCommitteePostsForAdmin(): Promise<CommitteeAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, created_at, is_published")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    createdAt: r.created_at,
    isPublished: r.is_published,
  }));
}
```

> 확인: 파일 상단에 `import { createSupabaseServer } from "@/server/supabase/server";`가 이미 있고 `const SECTION = "committee" as const;`가 있음(있으므로 재선언 금지).

- [ ] **Step 2: 목록 페이지 작성**

`src/app/(admin)/admin/committee/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listCommitteePostsForAdmin } from "@/server/services/committee";
import { deletePost } from "@/server/actions/committee";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";

// proxy가 1차 가드, 여기서 서버 권한 재확인(헌법: 권한 체크는 서버에서).
export default async function AdminCommitteePage() {
  await requireAdmin();
  const rows = await listCommitteePostsForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>위원회 소식 관리</h1>
        <Link href="/admin/committee/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 글
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>분류</th>
            <th style={{ padding: "8px 6px" }}>작성일</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.category ?? "-"}</td>
              <td style={{ padding: "8px 6px" }}>{isoToKstDate(r.createdAt)}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <span style={{ display: "inline-flex", gap: 12 }}>
                  <Link href={`/admin/committee/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
                  <DeletePostButton action={deletePost.bind(null, r.id)} />
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 글이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

> 확인: `src/server/actions/committee.ts`에 `deletePost(id: string): Promise<void>`가 있음(있음).

- [ ] **Step 3: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 오류 0

- [ ] **Step 4: 커밋**

```bash
git add "src/server/services/committee.ts" "src/app/(admin)/admin/committee/page.tsx"
git commit -m "feat: 위원회 소식 admin 목록 페이지"
```

---

## Task 3: notice 서비스 + 목록 (고정 변형)

notice는 `category`가 없고 `is_pinned`(고정)를 쓴다.

**Files:**
- Modify: `src/server/services/notice.ts` (파일 끝)
- Create: `src/app/(admin)/admin/notice/page.tsx`

- [ ] **Step 1: 서비스에 admin 목록 함수 추가**

`src/server/services/notice.ts` 파일 **끝**에 추가:

```ts
export type NoticeAdminRow = {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  isPublished: boolean;
};

// admin 전용: 미공개 포함 전체, 최신순.
export async function listNoticesForAdmin(): Promise<NoticeAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, is_pinned, created_at, is_published")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    isPinned: r.is_pinned,
    createdAt: r.created_at,
    isPublished: r.is_published,
  }));
}
```

> 확인: 상단에 `createSupabaseServer` import와 `const SECTION = "notice" as const;`가 이미 있음.

- [ ] **Step 2: 목록 페이지 작성**

`src/app/(admin)/admin/notice/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listNoticesForAdmin } from "@/server/services/notice";
import { deletePost } from "@/server/actions/notice";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";

export default async function AdminNoticePage() {
  await requireAdmin();
  const rows = await listNoticesForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>공지 관리</h1>
        <Link href="/admin/notice/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 글
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>고정</th>
            <th style={{ padding: "8px 6px" }}>작성일</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPinned ? "📌" : ""}</td>
              <td style={{ padding: "8px 6px" }}>{isoToKstDate(r.createdAt)}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <span style={{ display: "inline-flex", gap: 12 }}>
                  <Link href={`/admin/notice/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
                  <DeletePostButton action={deletePost.bind(null, r.id)} />
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 공지가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 3: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 오류 0

- [ ] **Step 4: 커밋**

```bash
git add "src/server/services/notice.ts" "src/app/(admin)/admin/notice/page.tsx"
git commit -m "feat: 공지 admin 목록 페이지"
```

---

## Task 4: training 서비스 + 목록 (분류)

training은 `/training` 섹션 글 — events 목록과 별개다.

**Files:**
- Modify: `src/server/services/training.ts` (파일 끝)
- Create: `src/app/(admin)/admin/training/page.tsx`

- [ ] **Step 1: 서비스에 admin 목록 함수 추가**

`src/server/services/training.ts` 파일 **끝**에 추가:

```ts
export type TrainingAdminRow = {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
  isPublished: boolean;
};

// admin 전용: training 섹션 글(미공개 포함) 최신순. events 목록과 별개.
export async function listTrainingPostsForAdmin(): Promise<TrainingAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, created_at, is_published")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    createdAt: r.created_at,
    isPublished: r.is_published,
  }));
}
```

> 확인: 상단에 `createSupabaseServer` import와 `const SECTION = "training" as const;`가 있음. `SECTION`은 training 섹션을 가리킴.

- [ ] **Step 2: 목록 페이지 작성**

`src/app/(admin)/admin/training/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listTrainingPostsForAdmin } from "@/server/services/training";
import { deletePost } from "@/server/actions/training";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";

export default async function AdminTrainingPage() {
  await requireAdmin();
  const rows = await listTrainingPostsForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>강습회 글 관리</h1>
        <Link href="/admin/training/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 글
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>분류</th>
            <th style={{ padding: "8px 6px" }}>작성일</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.category ?? "-"}</td>
              <td style={{ padding: "8px 6px" }}>{isoToKstDate(r.createdAt)}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <span style={{ display: "inline-flex", gap: 12 }}>
                  <Link href={`/admin/training/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
                  <DeletePostButton action={deletePost.bind(null, r.id)} />
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 글이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

> 확인: `src/server/actions/training.ts`에 `deletePost(id)`가 있음.

- [ ] **Step 3: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 오류 0

- [ ] **Step 4: 커밋**

```bash
git add "src/server/services/training.ts" "src/app/(admin)/admin/training/page.tsx"
git commit -m "feat: 강습회 글 admin 목록 페이지"
```

---

## Task 5: webzine 서비스 + 목록 (분류)

**Files:**
- Modify: `src/server/services/webzine.ts` (파일 끝)
- Create: `src/app/(admin)/admin/webzine/page.tsx`

- [ ] **Step 1: 서비스에 admin 목록 함수 추가**

`src/server/services/webzine.ts` 파일 **끝**에 추가:

```ts
export type WebzineAdminRow = {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
  isPublished: boolean;
};

// admin 전용: webzine 섹션 글(미공개 포함) 최신순.
export async function listWebzineArticlesForAdmin(): Promise<WebzineAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, created_at, is_published")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    createdAt: r.created_at,
    isPublished: r.is_published,
  }));
}
```

> 확인: 상단에 `createSupabaseServer` import와 `const SECTION = "webzine" as const;`가 있음.

- [ ] **Step 2: 목록 페이지 작성**

`src/app/(admin)/admin/webzine/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listWebzineArticlesForAdmin } from "@/server/services/webzine";
import { deletePost } from "@/server/actions/webzine";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";

export default async function AdminWebzinePage() {
  await requireAdmin();
  const rows = await listWebzineArticlesForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>웹진 관리</h1>
        <Link href="/admin/webzine/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 글
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>분류</th>
            <th style={{ padding: "8px 6px" }}>작성일</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.category ?? "-"}</td>
              <td style={{ padding: "8px 6px" }}>{isoToKstDate(r.createdAt)}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <span style={{ display: "inline-flex", gap: 12 }}>
                  <Link href={`/admin/webzine/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
                  <DeletePostButton action={deletePost.bind(null, r.id)} />
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 글이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

> 확인: `src/server/actions/webzine.ts`에 `deletePost(id)`가 있음.

- [ ] **Step 3: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 오류 0

- [ ] **Step 4: 커밋**

```bash
git add "src/server/services/webzine.ts" "src/app/(admin)/admin/webzine/page.tsx"
git commit -m "feat: 웹진 admin 목록 페이지"
```

---

## Task 6: resources 서비스 + 목록 (삭제 액션명 다름)

resources는 삭제 액션이 `deleteResource`다(`deletePost` 아님).

**Files:**
- Modify: `src/server/services/resource.ts` (파일 끝)
- Create: `src/app/(admin)/admin/resources/page.tsx`

- [ ] **Step 1: 서비스에 admin 목록 함수 추가**

`src/server/services/resource.ts` 파일 **끝**에 추가:

```ts
export type ResourceAdminRow = {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
  isPublished: boolean;
};

// admin 전용: resource 섹션 글(미공개 포함) 최신순.
export async function listResourcePostsForAdmin(): Promise<ResourceAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, created_at, is_published")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    createdAt: r.created_at,
    isPublished: r.is_published,
  }));
}
```

> 확인: 상단에 `createSupabaseServer` import와 `const SECTION = "resource" as const;`가 있음(섹션값은 단수 `resource`).

- [ ] **Step 2: 목록 페이지 작성**

`src/app/(admin)/admin/resources/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listResourcePostsForAdmin } from "@/server/services/resource";
import { deleteResource } from "@/server/actions/resource";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";

export default async function AdminResourcesPage() {
  await requireAdmin();
  const rows = await listResourcePostsForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>자료실 관리</h1>
        <Link href="/admin/resources/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 글
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>분류</th>
            <th style={{ padding: "8px 6px" }}>작성일</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.category ?? "-"}</td>
              <td style={{ padding: "8px 6px" }}>{isoToKstDate(r.createdAt)}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <span style={{ display: "inline-flex", gap: 12 }}>
                  <Link href={`/admin/resources/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
                  <DeletePostButton action={deleteResource.bind(null, r.id)} />
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 자료가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

> 확인: `src/server/actions/resource.ts`에 `deleteResource(id: string): Promise<void>`가 있음.

- [ ] **Step 3: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 오류 0

- [ ] **Step 4: 커밋**

```bash
git add "src/server/services/resource.ts" "src/app/(admin)/admin/resources/page.tsx"
git commit -m "feat: 자료실 admin 목록 페이지"
```

---

## Task 7: 대시보드 링크 정비

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: 링크 묶음 교체**

`src/app/(admin)/admin/page.tsx`에서 기존 링크 `<p>` 블록(현재):

```tsx
      <p style={{ marginTop: 16, display: "flex", gap: 16 }}>
        <Link href="/admin/inquiries">문의 접수함 →</Link>
        <Link href="/notice">공지 관리 →</Link>
        <Link href="/admin/events">수련회 이벤트 관리 →</Link>
        <Link href="/admin/timetable">강의 시간표 관리 →</Link>
        <Link href="/admin/collections">자료실 컬렉션 관리 →</Link>
        <Link href="/admin/hero">메인 히어로 관리 →</Link>
      </p>
```

를 아래로 교체(공지 링크를 `/admin/notice`로 교정 + 누락 4개 추가, `flexWrap` 추가):

```tsx
      <p style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/admin/inquiries">문의 접수함 →</Link>
        <Link href="/admin/notice">공지 관리 →</Link>
        <Link href="/admin/training">강습회 글 관리 →</Link>
        <Link href="/admin/committee">위원회 소식 관리 →</Link>
        <Link href="/admin/webzine">웹진 관리 →</Link>
        <Link href="/admin/resources">자료실 관리 →</Link>
        <Link href="/admin/events">수련회 이벤트 관리 →</Link>
        <Link href="/admin/timetable">강의 시간표 관리 →</Link>
        <Link href="/admin/collections">자료실 컬렉션 관리 →</Link>
        <Link href="/admin/hero">메인 히어로 관리 →</Link>
      </p>
```

- [ ] **Step 2: 타입체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 오류 0

- [ ] **Step 3: 커밋**

```bash
git add "src/app/(admin)/admin/page.tsx"
git commit -m "feat: admin 대시보드에 글 관리 목록 링크 정비"
```

---

## Task 8: 로컬 e2e 검증 + 빌드

**Files:** (없음 — 검증 전용)

- [ ] **Step 1: 로컬 Supabase 스택 확인/기동**

Run:
```bash
npx supabase status -o json | grep API_URL
```
Expected: `http://127.0.0.1:54321` (아니면 `colima start && npx supabase start` 후 재확인). 운영이 아닌 로컬임을 반드시 확인.

- [ ] **Step 2: 개발 서버 기동 + admin 로그인**

Run: `pnpm dev` (별도 셸). 브라우저/preview로 `/login`에서 시드 admin으로 로그인.

- [ ] **Step 3: 5개 목록 페이지 e2e**

각 경로(`/admin/notice`, `/admin/training`, `/admin/committee`, `/admin/webzine`, `/admin/resources`)에서:
- 목록이 시드 글과 함께 렌더되고 작성일·공개 컬럼이 보인다
- "새 글" → 작성 → 목록에 새 항목이 최상단에 보인다
- "수정" 링크가 해당 편집 페이지로 이동한다
- "삭제" 클릭 → confirm 표시 → 확인 시 글이 사라지고 공개 사이트에서도 제거된다
- 빈 섹션은 빈 상태 문구가 보인다

- [ ] **Step 4: 대시보드 링크 확인**

`/admin`에서 10개 링크가 모두 보이고 5개 신규 링크가 각 목록으로 이동한다. `공지 관리`가 `/admin/notice`로 가는지 확인.

- [ ] **Step 5: 빌드**

Run: `pnpm build`
Expected: 성공(오류 0).

- [ ] **Step 6: plan 체크 커밋(문서 갱신 시에만)**

검증 중 plan 수정이 있었다면:
```bash
git add docs/superpowers/plans/2026-06-25-admin-post-lists.md
git commit -m "docs: admin 목록 plan 검증 반영"
```

---

## 완료 기준

- 5개 도메인 admin 목록 페이지 동작(렌더·새 글·수정·삭제)
- 공용 `DeletePostButton`로 confirm 삭제 연결(기존 액션 재사용, 신규 액션 0)
- 대시보드에서 5개 목록 진입 + `공지 관리` 경로 교정
- `tsc`·`lint`·`build` 통과, 로컬 e2e 통과
- 신규 마이그레이션·스키마·RLS·편집폼 변경 없음
