# admin 작성 폼 보강(공지·일정 입력) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **커밋 정책:** 커밋은 사용자 승인 후. 운영 DB·스키마 변경 없음(posts에 `event_date`·`meta` 이미 존재).

**Goal:** admin이 `/main`이 읽는 **공지(한 줄)** 와 **일정(`event_date`·장소)** 을 실제로 입력·관리할 수 있게 한다.

**Architecture:** (1) notice 글을 싱글톤으로 set/clear하는 액션 + admin 홈 "메인 공지" 카드. (2) training·committee 에디터에 선택 입력 `event_date`(날짜)·장소를 추가하고, 액션이 KST 23:59:59 ISO·`meta.location`으로 저장. 공용 날짜 변환 유틸로 입력↔저장을 변환. `/main`·스키마·RLS는 변경 없음.

**Tech Stack:** Next.js 16 App Router, TS strict, supabase-js + RLS(admin write). 테스트 러너 없음 → `pnpm lint && pnpm build` + 로컬 렌더 검증.

## 빌드 안전 순서
유틸(의존 0) → notice → training → committee → 검증. 각 Task 종료 시 빌드 green.

## 파일 구조

```
src/lib/datetime.ts                                       # Create: KST 날짜 ↔ ISO 변환 유틸
src/server/services/notice.ts                             # Create: 현재 공지 조회(getCurrentAnnouncement)
src/server/actions/notice.ts                              # Create: setAnnouncement / clearAnnouncement
src/app/(admin)/admin/AnnouncementForm.tsx                # Create: 메인 공지 입력 폼(client)
src/app/(admin)/admin/page.tsx                            # Modify: "메인 공지" 섹션 삽입
src/server/actions/training.ts                            # Modify: eventDate·location 스키마/insert/update
src/server/services/training.ts                           # Modify: ForEdit가 eventDate·location 반환
src/app/(admin)/admin/training/EditorForm.tsx             # Modify: 일정·장소 입력 + Initial 타입
src/app/(admin)/admin/training/[id]/edit/page.tsx         # Modify: initial에 eventDate·location 전달
src/server/actions/committee.ts                           # Modify: training과 동일 보강
src/server/services/committee.ts                          # Modify: training과 동일 보강
src/app/(admin)/admin/committee/EditorForm.tsx            # Modify: training과 동일 보강
src/app/(admin)/admin/committee/[id]/edit/page.tsx        # Modify: training과 동일 보강
```

---

### Task 1: 날짜 변환 유틸 `datetime.ts`

**Files:**
- Create: `src/lib/datetime.ts`

- [ ] **Step 1: 유틸 작성**

`src/lib/datetime.ts`:
```typescript
// KST(UTC+9) 기준 날짜 문자열 ↔ ISO timestamptz 변환. 일정 입력(날짜만)용.
const KST_OFFSET = "+09:00";

// "YYYY-MM-DD" → 그날 23:59:59(KST)의 ISO. 같은 날 종일 '다가오는 일정'에 남도록 끝시각 사용.
export function kstDateEndToIso(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59${KST_OFFSET}`).toISOString();
}

// ISO timestamptz → KST 기준 "YYYY-MM-DD" (edit 화면 prefill용).
export function isoToKstDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
```

- [ ] **Step 2: 검증** — Run: `pnpm lint && pnpm build` → 통과(미사용이라 빌드만 확인).

- [ ] **Step 3: 커밋 (사용자 승인 후)**
```bash
git add src/lib/datetime.ts
git commit -m "feat: KST 날짜↔ISO 변환 유틸 추가"
```

---

### Task 2: 메인 공지 한 줄 관리 (notice)

**Files:**
- Create: `src/server/services/notice.ts`
- Create: `src/server/actions/notice.ts`
- Create: `src/app/(admin)/admin/AnnouncementForm.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: 읽기 서비스**

`src/server/services/notice.ts`:
```typescript
// 메인 공지(notice 싱글톤) 현재 문구 조회. admin 홈 표시용.
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";

export async function getCurrentAnnouncement(): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("posts")
    .select("title")
    .eq("section", "notice")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.title ?? null;
}
```

- [ ] **Step 2: 쓰기 액션**

`src/server/actions/notice.ts`:
```typescript
"use server";
// 메인 공지(notice 싱글톤) 저장/해제. admin 전용(requireAdmin + RLS), zod 검증.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/current-user";
import { createSupabaseServer } from "@/server/supabase/server";

export interface AnnouncementState {
  error?: string;
  success?: string;
}

const textSchema = z
  .string()
  .trim()
  .min(1, "공지 문구를 입력해주세요.")
  .max(200, "200자 이내로 입력해주세요.");

export async function setAnnouncement(
  _prev: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const user = await requireAdmin();
  const r = textSchema.safeParse(formData.get("text"));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };

  const supabase = await createSupabaseServer();
  // 싱글톤: 기존 notice 최신 1건이 있으면 제목 갱신, 없으면 새로 생성.
  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("section", "notice")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("posts")
      .update({ title: r.data })
      .eq("id", existing.id);
    if (error) return { error: "저장에 실패했습니다." };
  } else {
    const { error } = await supabase.from("posts").insert({
      section: "notice",
      title: r.data,
      is_pinned: false,
      author_id: user.id,
    });
    if (error) return { error: "저장에 실패했습니다." };
  }

  revalidatePath("/main");
  revalidatePath("/admin");
  return { success: "공지를 저장했습니다." };
}

export async function clearAnnouncement(
  _prev: AnnouncementState,
  _formData: FormData,
): Promise<AnnouncementState> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("posts").delete().eq("section", "notice");
  if (error) return { error: "공지 해제에 실패했습니다." };
  revalidatePath("/main");
  revalidatePath("/admin");
  return { success: "공지를 내렸습니다." };
}
```

- [ ] **Step 3: admin 공지 폼(client)**

`src/app/(admin)/admin/AnnouncementForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import {
  setAnnouncement,
  clearAnnouncement,
  type AnnouncementState,
} from "@/server/actions/notice";

const inputStyle = {
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 6,
  width: "100%",
} as const;

export default function AnnouncementForm({ current }: { current: string | null }) {
  const [setState, setAction, setPending] = useActionState<AnnouncementState, FormData>(
    setAnnouncement,
    {},
  );
  const [clearState, clearAction, clearPending] = useActionState<AnnouncementState, FormData>(
    clearAnnouncement,
    {},
  );
  const error = setState.error || clearState.error;
  const success = setState.success || clearState.success;

  return (
    <div style={{ display: "grid", gap: 10, maxWidth: 640 }}>
      <form action={setAction} style={{ display: "grid", gap: 8 }}>
        <input
          name="text"
          defaultValue={current ?? ""}
          placeholder="메인 상단에 노출할 공지 한 줄"
          maxLength={200}
          style={inputStyle}
        />
        <button type="submit" disabled={setPending} style={{ padding: 10, borderRadius: 6 }}>
          {setPending ? "저장 중…" : "공지 저장"}
        </button>
      </form>
      {current && (
        <form action={clearAction}>
          <button
            type="submit"
            disabled={clearPending}
            style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}
          >
            {clearPending ? "처리 중…" : "공지 내리기"}
          </button>
        </form>
      )}
      {error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{error}</p>}
      {success && <p style={{ color: "#0a0", margin: 0 }}>{success}</p>}
    </div>
  );
}
```

- [ ] **Step 4: admin 홈에 섹션 삽입**

`src/app/(admin)/admin/page.tsx` 상단 import에 추가:
```tsx
import { getCurrentAnnouncement } from "@/server/services/notice";
import AnnouncementForm from "./AnnouncementForm";
```
함수 본문에서 `requireAdmin()` 다음 줄에 조회 추가:
```tsx
  const user = await requireAdmin();
  const announcement = await getCurrentAnnouncement();
```
"계정 생성" `<section>` **앞에** 다음 섹션 삽입:
```tsx
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>메인 공지</h2>
        <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
          메인 페이지 상단에 한 줄로 노출됩니다. 비우고 저장하지 말고, 내릴 때는
          &quot;공지 내리기&quot;를 사용하세요.
        </p>
        <AnnouncementForm current={announcement} />
      </section>
```

- [ ] **Step 5: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 6: 커밋 (사용자 승인 후)**
```bash
git add src/server/services/notice.ts src/server/actions/notice.ts "src/app/(admin)/admin/AnnouncementForm.tsx" "src/app/(admin)/admin/page.tsx"
git commit -m "feat: admin 메인 공지 한 줄 관리(저장·해제) 추가"
```

---

### Task 3: training 일정 필드(`event_date`·장소)

**Files:**
- Modify: `src/server/actions/training.ts`
- Modify: `src/server/services/training.ts`
- Modify: `src/app/(admin)/admin/training/EditorForm.tsx`
- Modify: `src/app/(admin)/admin/training/[id]/edit/page.tsx`

- [ ] **Step 1: 액션 스키마·저장 보강**

`src/server/actions/training.ts` — import 추가(파일 상단 import 블록):
```typescript
import type { Json } from "@/lib/database.types";
import { kstDateEndToIso } from "@/lib/datetime";
```
`postSchema`에 두 필드 추가(`isPinned` 다음):
```typescript
  isPinned: z.coerce.boolean(),
  eventDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  location: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
```
`parse()`의 객체에 추가(`isPinned` 라인 다음):
```typescript
    isPinned: formData.get("isPinned") === "on" || formData.get("isPinned") === "true",
    eventDate: formData.get("eventDate"),
    location: formData.get("location"),
```
`createPost`의 `.insert({ ... })`에 두 줄 추가(`is_pinned` 다음):
```typescript
      is_pinned: r.data.isPinned,
      event_date: r.data.eventDate ? kstDateEndToIso(r.data.eventDate) : null,
      meta: r.data.location ? { location: r.data.location } : null,
      author_id: user.id,
```
`updatePost`에서 update 직전에 기존 meta 머지 코드 추가(`const supabase = ...` 다음):
```typescript
  const supabase = await createSupabaseServer();
  // 기존 meta 보존(location만 갱신/제거).
  const { data: cur } = await supabase.from("posts").select("meta").eq("id", id).single();
  const baseMeta =
    cur?.meta && typeof cur.meta === "object" && !Array.isArray(cur.meta)
      ? (cur.meta as Record<string, Json>)
      : {};
  const nextMeta: Record<string, Json> = { ...baseMeta };
  if (r.data.location) nextMeta.location = r.data.location;
  else delete nextMeta.location;
  const meta: Json | null = Object.keys(nextMeta).length ? nextMeta : null;
```
그리고 `.update({ ... })`에 두 줄 추가(`is_pinned` 다음):
```typescript
      is_pinned: r.data.isPinned,
      event_date: r.data.eventDate ? kstDateEndToIso(r.data.eventDate) : null,
      meta,
```

> 주의: `createSupabaseServer()` 호출이 updatePost 안에 이미 한 번 있으므로 **중복 호출하지 말 것** — 기존 `const supabase` 라인 바로 뒤에 머지 코드를 넣는다.

- [ ] **Step 2: ForEdit 서비스 보강**

`src/server/services/training.ts` — 상단 import에 추가:
```typescript
import { isoToKstDate } from "@/lib/datetime";
```
`TrainingEditData` 타입에 두 필드 추가(`isPinned` 다음):
```typescript
  isPinned: boolean;
  eventDate: string | null;
  location: string | null;
```
`getTrainingPostForEdit`의 select에 컬럼 추가:
```typescript
    .select("id, category, title, excerpt, body, is_pinned, event_date, meta")
```
`return { ... }`에 두 필드 추가(`isPinned: r.is_pinned,` 다음):
```typescript
    isPinned: r.is_pinned,
    eventDate: r.event_date ? isoToKstDate(r.event_date) : null,
    location:
      r.meta && typeof r.meta === "object" && !Array.isArray(r.meta)
        ? ((r.meta as Record<string, unknown>).location as string | undefined) ?? null
        : null,
```

- [ ] **Step 3: EditorForm에 입력 추가**

`src/app/(admin)/admin/training/EditorForm.tsx` — `Initial` 타입에 추가:
```typescript
  isPinned?: boolean;
  eventDate?: string;
  location?: string;
```
`<label> ... 상단 고정 ... </label>` **다음 줄**에 입력 2개 추가:
```tsx
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        행사 일정 (선택)
        <input
          type="date"
          name="eventDate"
          defaultValue={initial?.eventDate ?? ""}
          style={inputStyle}
        />
      </label>
      <input
        name="location"
        defaultValue={initial?.location ?? ""}
        placeholder="장소 (선택)"
        style={inputStyle}
      />
```

- [ ] **Step 4: edit 페이지 prefill 전달**

`src/app/(admin)/admin/training/[id]/edit/page.tsx`의 `<EditorForm initial={{ ... }} />`에 두 줄 추가(`isPinned: post.isPinned,` 다음):
```tsx
          isPinned: post.isPinned,
          eventDate: post.eventDate ?? undefined,
          location: post.location ?? undefined,
```

- [ ] **Step 5: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 6: 커밋 (사용자 승인 후)**
```bash
git add src/server/actions/training.ts src/server/services/training.ts "src/app/(admin)/admin/training/"
git commit -m "feat: 교역자수련회 글 일정(event_date)·장소 입력 추가"
```

---

### Task 4: committee 일정 필드(`event_date`·장소)

> Task 3과 동일 구조. committee 파일에 같은 변경을 적용한다.

**Files:**
- Modify: `src/server/actions/committee.ts`
- Modify: `src/server/services/committee.ts`
- Modify: `src/app/(admin)/admin/committee/EditorForm.tsx`
- Modify: `src/app/(admin)/admin/committee/[id]/edit/page.tsx`

- [ ] **Step 1: 액션 스키마·저장 보강**

`src/server/actions/committee.ts` — import 추가:
```typescript
import type { Json } from "@/lib/database.types";
import { kstDateEndToIso } from "@/lib/datetime";
```
`postSchema`에 추가(`isPinned` 다음):
```typescript
  isPinned: z.coerce.boolean(),
  eventDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  location: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
```
`parse()`에 추가:
```typescript
    isPinned: formData.get("isPinned") === "on" || formData.get("isPinned") === "true",
    eventDate: formData.get("eventDate"),
    location: formData.get("location"),
```
`createPost`의 `.insert({ ... })`에 추가(`is_pinned` 다음):
```typescript
      is_pinned: r.data.isPinned,
      event_date: r.data.eventDate ? kstDateEndToIso(r.data.eventDate) : null,
      meta: r.data.location ? { location: r.data.location } : null,
      author_id: user.id,
```

> 주의: committee `createPost`가 `author_id: user.id`를 쓰는지 확인하고, 기존 insert 필드 순서에 맞춰 `event_date`·`meta`만 끼워넣는다. `author_id`가 이미 있으면 중복 추가하지 말 것.

`updatePost`에서 `const supabase = ...` 다음에 머지 코드 추가:
```typescript
  const supabase = await createSupabaseServer();
  // 기존 meta 보존(location만 갱신/제거).
  const { data: cur } = await supabase.from("posts").select("meta").eq("id", id).single();
  const baseMeta =
    cur?.meta && typeof cur.meta === "object" && !Array.isArray(cur.meta)
      ? (cur.meta as Record<string, Json>)
      : {};
  const nextMeta: Record<string, Json> = { ...baseMeta };
  if (r.data.location) nextMeta.location = r.data.location;
  else delete nextMeta.location;
  const meta: Json | null = Object.keys(nextMeta).length ? nextMeta : null;
```
`.update({ ... })`에 추가(`is_pinned` 다음):
```typescript
      is_pinned: r.data.isPinned,
      event_date: r.data.eventDate ? kstDateEndToIso(r.data.eventDate) : null,
      meta,
```

- [ ] **Step 2: ForEdit 서비스 보강**

`src/server/services/committee.ts` — import 추가:
```typescript
import { isoToKstDate } from "@/lib/datetime";
```
`CommitteeEditData` 타입에 추가(`isPinned` 다음):
```typescript
  isPinned: boolean;
  eventDate: string | null;
  location: string | null;
```
`getCommitteePostForEdit`의 select에 컬럼 추가:
```typescript
    .select("id, category, title, excerpt, body, is_pinned, event_date, meta")
```
`return { ... }`에 추가(`isPinned: r.is_pinned,` 다음):
```typescript
    isPinned: r.is_pinned,
    eventDate: r.event_date ? isoToKstDate(r.event_date) : null,
    location:
      r.meta && typeof r.meta === "object" && !Array.isArray(r.meta)
        ? ((r.meta as Record<string, unknown>).location as string | undefined) ?? null
        : null,
```

- [ ] **Step 3: EditorForm에 입력 추가**

`src/app/(admin)/admin/committee/EditorForm.tsx` — `Initial` 타입에 추가:
```typescript
  isPinned?: boolean;
  eventDate?: string;
  location?: string;
```
`<label> ... 상단 고정 ... </label>` 다음 줄에 추가:
```tsx
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        행사 일정 (선택)
        <input
          type="date"
          name="eventDate"
          defaultValue={initial?.eventDate ?? ""}
          style={inputStyle}
        />
      </label>
      <input
        name="location"
        defaultValue={initial?.location ?? ""}
        placeholder="장소 (선택)"
        style={inputStyle}
      />
```

- [ ] **Step 4: edit 페이지 prefill 전달**

`src/app/(admin)/admin/committee/[id]/edit/page.tsx`의 `<EditorForm initial={{ ... }} />`에 추가(`isPinned: post.isPinned,` 다음):
```tsx
          isPinned: post.isPinned,
          eventDate: post.eventDate ?? undefined,
          location: post.location ?? undefined,
```

> 주의: committee edit 페이지의 initial 객체 모양이 training과 다를 수 있으니, 실제 파일을 열어 `isPinned`가 전달되는 위치를 찾아 그 뒤에 두 줄을 넣는다.

- [ ] **Step 5: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 6: 커밋 (사용자 승인 후)**
```bash
git add src/server/actions/committee.ts src/server/services/committee.ts "src/app/(admin)/admin/committee/"
git commit -m "feat: 교육위원회 글 일정(event_date)·장소 입력 추가"
```

---

### Task 5: 로컬 e2e + 렌더 검증 (컨트롤러 실행)

- [ ] **Step 1:** 로컬 Supabase 가동 확인(`.env.local`이 127.0.0.1 지향). admin 계정으로 로그인.
- [ ] **Step 2: 공지** — `/admin`에서 "메인 공지" 저장 → `/main` 상단 공지 strip에 반영. 문구 수정 → 갱신. "공지 내리기" → strip 미표시. (싱글톤: notice 글이 1건만 유지되는지 확인.)
- [ ] **Step 3: 일정** — `/admin/training/new`(및 committee)에서 글 작성 시 `event_date`(미래)·장소 입력 → `/main` "다가오는 일정"에 날짜(`MM.DD`)·요일·장소·태그 반영, `event_date` 오름차순 정렬 확인.
- [ ] **Step 4: 수정 prefill** — 해당 글 edit 화면 재진입 시 일정·장소가 채워져 보이는지, 날짜 비우고 저장 시 일정에서 빠지는지 확인.
- [ ] **Step 5: 경계** — 과거 `event_date` 글은 미포함, 당일 글은 종일 표시(KST 23:59:59). 기존(필드 없이 작성된) 글 수정해도 정상.
- [ ] **Step 6:** `pnpm lint && pnpm build` 최종 확인. 시드/임시 데이터는 정리. 결과 보고.

---

## Self-Review (작성자 점검)

- **Spec 커버리지**: 공지 A(Task 2: service+action+form+홈), 일정 B training/committee(Task 3·4), 날짜 단위=날짜만·KST 23:59:59(Task 1 유틸 + 액션 변환), 운영 스키마 무변경(posts 기존 컬럼 사용), 검증(Task 5). spec과 일치.
- **타입 일관성**: `kstDateEndToIso`/`isoToKstDate`(T1) → 액션·서비스(T3·T4) 동일 시그니처. `AnnouncementState`(T2) form↔action 일치. `Json`은 `@/lib/database.types`에서 import, meta 머지에 사용. `TrainingEditData`/`CommitteeEditData`에 `eventDate`·`location` 추가 → EditorForm `Initial` → edit page initial 흐름 일관.
- **빌드 안전**: 각 Task가 독립적으로 컴파일(유틸 먼저, 이후 소비). 선택 필드라 기존 글·폼 호환.
- **No placeholder**: 모든 코드 블록은 실제 삽입 코드. committee insert의 `author_id`·initial 객체 위치는 파일 확인 주의 노트 포함.
- **보안**: 모든 쓰기 `requireAdmin` + RLS(posts admin write). service-role 미사용. 입력 zod 검증(길이·trim). 텍스트 렌더(XSS 무관).
