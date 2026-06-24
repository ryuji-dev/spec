# 교수 시간표·한마디 실데이터화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/faculty`의 한마디(VOICES) 스트립과 강의 시간표를 mock에서 실데이터로 전환한다.

**Architecture:** 한마디는 기존 `faculty.quote`를 `getFacultyDirectoryData`에서 파생해 배선만 한다(새 테이블 없음). 시간표는 신규 `faculty_timetable` 테이블+RLS를 만들고 공개 읽기 서비스와 admin CRUD(events 패턴 축소판)를 추가한다. 공개 컴포넌트는 데이터 출처만 prop으로 교체하고 마크업은 보존한다.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, supabase-js + RLS, Supabase CLI 마이그레이션, zod, Server Actions.

---

## File Structure

- `supabase/migrations/<ts>_faculty_timetable.sql` (생성) — 테이블+RLS
- `src/lib/database.types.ts` (재생성)
- `src/lib/faculty-data.ts` (수정) — `FACULTY_QUOTES`·`FACULTY_TIMETABLE` 상수 삭제(타입 유지)
- `src/lib/faculty.ts` (수정) — `TimetableRow`·`toTimetableItem`·`toQuoteList` 추가
- `src/server/services/faculty.ts` (수정) — `FacultyDirectoryData.quotes`, `getFacultyTimetable`, `listTimetableForAdmin`, `getTimetableRowForEdit`
- `src/server/actions/timetable.ts` (생성) — CRUD 액션
- `src/app/faculty/page.tsx` (수정) — timetable 조회·전달
- `src/app/faculty/_components/desktop/FacultyDesktop.tsx` (수정) — quotes·timetable prop 중계
- `src/app/faculty/_components/desktop/QuoteStrip.tsx` (수정) — prop 사용
- `src/app/faculty/_components/desktop/ScheduleSection.tsx` (수정) — prop 사용
- `src/app/faculty/_components/mobile/FacultyMobile.tsx` (수정) — quotes prop 사용
- `src/app/(admin)/admin/timetable/{page,new/page,[id]/edit/page,EditorForm}.tsx` (생성)
- `src/app/(admin)/admin/page.tsx` (수정) — 대시보드 링크

> Task 1~6은 컴파일 중간 상태가 깨질 수 있어 Task 7에서 묶어 검증·커밋(시간표 admin은 별 커밋). 마이그레이션(Task 1)만 선커밋.

---

## Task 1: faculty_timetable 마이그레이션

**Files:**
- Create: `supabase/migrations/<ts>_faculty_timetable.sql`
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `npx supabase migration new faculty_timetable`
→ 생성된 빈 파일 경로를 확인하고 **Read 후** 아래 SQL을 Write한다:

```sql
create table public.faculty_timetable (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  time text not null,
  course text not null,
  prof text not null,
  room text not null,
  host boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index faculty_timetable_sort_idx on public.faculty_timetable (sort_order);
alter table public.faculty_timetable enable row level security;
create policy faculty_timetable_select on public.faculty_timetable for select using (true);
create policy faculty_timetable_write on public.faculty_timetable for all using (public.auth_is_admin()) with check (public.auth_is_admin());
```

- [ ] **Step 2: 로컬 적용**

Run: `npx supabase db reset`
Expected: 마이그레이션 적용 성공. (reset이 public 스키마 grant를 지우므로 다음 단계에서 복구)

- [ ] **Step 3: grant 복구(로컬 한정, 커밋 안 함)**

로컬 DB 컨테이너에 접속해 실행(`docker exec -i <supabase_db_*> psql -U postgres -d postgres`):

```sql
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to anon, authenticated, service_role;
```

- [ ] **Step 4: 타입 재생성**

Run: `npx supabase gen types typescript --local > src/lib/database.types.ts`
Expected: `faculty_timetable` 타입이 추가됨. `grep -n "faculty_timetable" src/lib/database.types.ts`로 확인.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/ src/lib/database.types.ts
git commit -m "feat: faculty_timetable 테이블·RLS 마이그레이션"
```

---

## Task 2: lib 변환기·타입 (faculty.ts) + mock 삭제

**Files:**
- Modify: `src/lib/faculty.ts`
- Modify: `src/lib/faculty-data.ts`

- [ ] **Step 1: `faculty.ts` import에 타입 추가**

`src/lib/faculty.ts`의 `./faculty-data` import에 `FacultyQuote`·`FacultyTimetableItem`을 추가:

```ts
import type {
  FacultyDept,
  FacultyMember,
  FacultyCover,
  FacultyQuote,
  FacultyTimetableItem,
} from "./faculty-data";
```

- [ ] **Step 2: 변환기 추가**

`src/lib/faculty.ts` 끝에 append:

```ts
// 한마디 — quote가 빈 값이 아닌 교수 최대 4명을 인용 목록으로.
export function toQuoteList(rows: FacultyRow[]): FacultyQuote[] {
  return rows
    .filter((r) => r.quote && r.quote.trim().length > 0)
    .slice(0, 4)
    .map((r) => ({ name: r.name, q: r.quote }));
}

// 시간표 평면 행 → 디자인 뷰모델. host=false면 host 키 생략(타입이 host?).
export type TimetableRow = {
  day: string;
  time: string;
  course: string;
  prof: string;
  room: string;
  host: boolean;
};

export function toTimetableItem(row: TimetableRow): FacultyTimetableItem {
  return {
    day: row.day,
    time: row.time,
    course: row.course,
    prof: row.prof,
    room: row.room,
    ...(row.host ? { host: true } : {}),
  };
}
```

- [ ] **Step 3: mock 상수 삭제**

`src/lib/faculty-data.ts`에서 `export const FACULTY_TIMETABLE …` 블록(336~344행)과 `export const FACULTY_QUOTES …` 블록(349~354행)을 삭제한다. **타입** `FacultyTimetableItem`(326~333행)·`FacultyQuote`(346행)는 유지.

- [ ] **Step 4: 타입 확인(부분)**

Run: `pnpm exec tsc --noEmit`
Expected: `FACULTY_QUOTES`/`FACULTY_TIMETABLE`를 쓰던 컴포넌트(QuoteStrip·ScheduleSection·FacultyMobile)에서 에러 — Task 4·5에서 해소(예상된 중간 상태).

---

## Task 3: 서비스 (faculty.ts) — quotes·시간표 조회

**Files:**
- Modify: `src/server/services/faculty.ts`

- [ ] **Step 1: import 보강**

상단 `@/lib/faculty` import에 `toTimetableItem`·`toQuoteList`·`TimetableRow`를, `@/lib/faculty-data` import에 `FacultyQuote`·`FacultyTimetableItem`을 추가:

```ts
import {
  toFacultyMemberView,
  toFacultyCoverView,
  toTimetableItem,
  toQuoteList,
  FACULTY_DEPT_META,
  type FacultyRow,
  type TimetableRow,
} from "@/lib/faculty";
import type {
  FacultyMember,
  FacultyCover,
  FacultyDeptItem,
  FacultyDept,
  FacultyQuote,
  FacultyTimetableItem,
} from "@/lib/faculty-data";
```

- [ ] **Step 2: `FacultyDirectoryData`에 quotes 추가 + 파생**

`FacultyDirectoryData` 타입에 `quotes: FacultyQuote[];` 추가. `getFacultyDirectoryData`의 `return { cover, members, depts };`를 다음으로 교체(이미 가져온 `memberRows` 재사용):

```ts
  const quotes = toQuoteList(memberRows);

  return { cover, members, depts, quotes };
```

- [ ] **Step 3: 시간표 조회 함수 추가**

파일 끝에 append:

```ts
// 공개 시간표 — sort_order→day→time 순.
export async function getFacultyTimetable(): Promise<FacultyTimetableItem[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("faculty_timetable")
    .select("day, time, course, prof, room, host")
    .order("sort_order", { ascending: true })
    .order("day", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as TimetableRow[]).map(toTimetableItem);
}

// admin 목록 — 전체, sort_order순.
export type TimetableAdminRow = {
  id: string;
  day: string;
  time: string;
  course: string;
  prof: string;
  room: string;
  host: boolean;
  sortOrder: number;
};

export async function listTimetableForAdmin(): Promise<TimetableAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("faculty_timetable")
    .select("id, day, time, course, prof, room, host, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    day: r.day,
    time: r.time,
    course: r.course,
    prof: r.prof,
    room: r.room,
    host: r.host,
    sortOrder: r.sort_order,
  }));
}

export async function getTimetableRowForEdit(
  id: string,
): Promise<TimetableAdminRow | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("faculty_timetable")
    .select("id, day, time, course, prof, room, host, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  return {
    id: r.id,
    day: r.day,
    time: r.time,
    course: r.course,
    prof: r.prof,
    room: r.room,
    host: r.host,
    sortOrder: r.sort_order,
  };
}
```

---

## Task 4: 공개 배선 (page·FacultyDesktop·QuoteStrip·ScheduleSection)

**Files:**
- Modify: `src/app/faculty/page.tsx`
- Modify: `src/app/faculty/_components/desktop/FacultyDesktop.tsx`
- Modify: `src/app/faculty/_components/desktop/QuoteStrip.tsx`
- Modify: `src/app/faculty/_components/desktop/ScheduleSection.tsx`

- [ ] **Step 1: page.tsx — 시간표 조회·전달**

import에 `getFacultyTimetable` 추가. 데스크톱 분기에서만 시간표가 필요하므로 분기 안에서 조회한다:

```tsx
import { getFacultyDirectoryData, getFacultyTimetable } from "@/server/services/faculty";
```
데스크톱 분기를 다음으로 교체:
```tsx
  if (device === "desktop") {
    const timetable = await getFacultyTimetable();
    return (
      <>
        <DesktopNav variant="solid" />
        <FacultyDesktop
          cover={data.cover}
          members={data.members}
          depts={data.depts}
          quotes={data.quotes}
          timetable={timetable}
        />
      </>
    );
  }
```
모바일 분기 `<FacultyMobile>`에 `quotes={data.quotes}` 추가.

- [ ] **Step 2: FacultyDesktop — props 중계**

import 타입에 `FacultyQuote`·`FacultyTimetableItem` 추가(`@/lib/faculty-data`). Props·시그니처 수정:

```tsx
type Props = {
  cover: FacultyCover | null;
  members: FacultyMember[];
  depts: FacultyDeptItem[];
  quotes: FacultyQuote[];
  timetable: FacultyTimetableItem[];
};

export default function FacultyDesktop({ cover, members, depts, quotes, timetable }: Props) {
```
`<QuoteStrip palette={palette} />` → `<QuoteStrip palette={palette} quotes={quotes} />`
`<ScheduleSection palette={palette} />` → `<ScheduleSection palette={palette} timetable={timetable} />`

- [ ] **Step 3: QuoteStrip — prop 사용**

`import { FACULTY_QUOTES } from "@/lib/faculty-data";`를 타입 import로 교체하고 prop을 받는다:

```tsx
import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyQuote } from "@/lib/faculty-data";

type Props = { palette: Palette; quotes: FacultyQuote[] };

export default function QuoteStrip({ palette, quotes }: Props) {
```
본문 `{FACULTY_QUOTES.map((q) => (` → `{quotes.map((q) => (`.

- [ ] **Step 4: ScheduleSection — prop 사용**

`import { FACULTY_TIMETABLE } from "@/lib/faculty-data";`를 타입 import로 교체:

```tsx
import type { Palette } from "@/app/_components/shared/palette";
import type { FacultyTimetableItem } from "@/lib/faculty-data";

type Props = { palette: Palette; timetable: FacultyTimetableItem[] };

export default function ScheduleSection({ palette, timetable }: Props) {
```
본문 `{FACULTY_TIMETABLE.map((row, i) => (` → `{timetable.map((row, i) => (`.

---

## Task 5: 모바일 배선 (FacultyMobile)

**Files:**
- Modify: `src/app/faculty/_components/mobile/FacultyMobile.tsx`

- [ ] **Step 1: import 교체 + Props/시그니처에 quotes 추가**

`@/lib/faculty-data` import 블록에서 `FACULTY_QUOTES`(값) 제거하고 `FacultyQuote`(타입) 추가. `Props`에 `quotes: FacultyQuote[];` 추가, 구조분해 `{ deviceType, cover, members, depts, quotes }`.

- [ ] **Step 2: 렌더에서 prop 사용**

`{FACULTY_QUOTES.map((q) => (` → `{quotes.map((q) => (`.

---

## Task 6: 시간표 admin 액션

**Files:**
- Create: `src/server/actions/timetable.ts`

- [ ] **Step 1: 액션 파일 작성**

```ts
"use server";
// faculty_timetable 생성/수정/삭제. admin 전용(RLS + requireAdmin), zod 검증.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";

const schema = z.object({
  day: z.string().trim().min(1, "요일을 입력해주세요."),
  time: z.string().trim().min(1, "시간을 입력해주세요."),
  course: z.string().trim().min(1, "강좌명을 입력해주세요."),
  prof: z.string().trim().min(1, "교수명을 입력해주세요."),
  room: z.string().trim().min(1, "강의실을 입력해주세요."),
  host: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

export interface TimetableFormState {
  error?: string;
}

function parse(formData: FormData) {
  return schema.safeParse({
    day: formData.get("day"),
    time: formData.get("time"),
    course: formData.get("course"),
    prof: formData.get("prof"),
    room: formData.get("room"),
    host: formData.get("host") === "on" || formData.get("host") === "true",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

function toRow(d: z.infer<typeof schema>) {
  return {
    day: d.day,
    time: d.time,
    course: d.course,
    prof: d.prof,
    room: d.room,
    host: d.host,
    sort_order: d.sortOrder,
  };
}

export async function createTimetable(
  _prev: TimetableFormState,
  formData: FormData,
): Promise<TimetableFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("faculty_timetable").insert(toRow(r.data));
  if (error) return { error: "저장에 실패했습니다." };
  redirect("/admin/timetable");
}

export async function updateTimetable(
  id: string,
  _prev: TimetableFormState,
  formData: FormData,
): Promise<TimetableFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("faculty_timetable")
    .update(toRow(r.data))
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect("/admin/timetable");
}

export async function deleteTimetable(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("faculty_timetable").delete().eq("id", id);
  redirect("/admin/timetable");
}
```

---

## Task 7: 시간표 admin 라우트 + 대시보드 링크

**Files:**
- Create: `src/app/(admin)/admin/timetable/EditorForm.tsx`
- Create: `src/app/(admin)/admin/timetable/page.tsx`
- Create: `src/app/(admin)/admin/timetable/new/page.tsx`
- Create: `src/app/(admin)/admin/timetable/[id]/edit/page.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: EditorForm**

`src/app/(admin)/admin/timetable/EditorForm.tsx`:

```tsx
"use client";
import { useActionState } from "react";
import type { TimetableFormState } from "@/server/actions/timetable";

type Initial = {
  day?: string;
  time?: string;
  course?: string;
  prof?: string;
  room?: string;
  host?: boolean;
  sortOrder?: number;
};

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function EditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: TimetableFormState, formData: FormData) => Promise<TimetableFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input name="day" defaultValue={initial?.day ?? ""} required placeholder="요일 (예: 월)" style={inputStyle} />
        <input name="time" defaultValue={initial?.time ?? ""} required placeholder="시간 (예: 10:00)" style={inputStyle} />
      </div>
      <input name="course" defaultValue={initial?.course ?? ""} required placeholder="강좌명" style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input name="prof" defaultValue={initial?.prof ?? ""} required placeholder="교수명" style={inputStyle} />
        <input name="room" defaultValue={initial?.room ?? ""} required placeholder="강의실" style={inputStyle} />
      </div>
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} min={0} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="host" defaultChecked={initial?.host ?? false} /> 학장 강의(강조)
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 목록 페이지**

`src/app/(admin)/admin/timetable/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listTimetableForAdmin } from "@/server/services/faculty";

export default async function AdminTimetablePage() {
  await requireAdmin();
  const rows = await listTimetableForAdmin();

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>강의 시간표 관리</h1>
        <Link href="/admin/timetable/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 강의
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>요일</th>
            <th style={{ padding: "8px 6px" }}>시간</th>
            <th style={{ padding: "8px 6px" }}>강좌</th>
            <th style={{ padding: "8px 6px" }}>교수</th>
            <th style={{ padding: "8px 6px" }}>강의실</th>
            <th style={{ padding: "8px 6px" }}>학장</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.day}</td>
              <td style={{ padding: "8px 6px" }}>{r.time}</td>
              <td style={{ padding: "8px 6px" }}>{r.course}</td>
              <td style={{ padding: "8px 6px" }}>{r.prof}</td>
              <td style={{ padding: "8px 6px" }}>{r.room}</td>
              <td style={{ padding: "8px 6px" }}>{r.host ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <Link href={`/admin/timetable/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: "16px 6px", color: "#888" }}>등록된 강의가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 3: 생성 페이지**

`src/app/(admin)/admin/timetable/new/page.tsx`:

```tsx
import { requireAdmin } from "@/server/auth/current-user";
import { createTimetable } from "@/server/actions/timetable";
import EditorForm from "../EditorForm";

export default async function NewTimetablePage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 강의</h1>
      <EditorForm action={createTimetable} submitLabel="저장" />
    </main>
  );
}
```

- [ ] **Step 4: 수정 페이지**

`src/app/(admin)/admin/timetable/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getTimetableRowForEdit } from "@/server/services/faculty";
import { updateTimetable, deleteTimetable } from "@/server/actions/timetable";
import EditorForm from "../../EditorForm";

export default async function EditTimetablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await getTimetableRowForEdit(id);
  if (!row) notFound();

  const update = updateTimetable.bind(null, id);
  const remove = deleteTimetable.bind(null, id);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/timetable" style={{ fontSize: 13, color: "#666" }}>← 목록</Link>
      <h1 style={{ fontSize: 22 }}>강의 수정</h1>
      <EditorForm
        action={update}
        initial={{
          day: row.day,
          time: row.time,
          course: row.course,
          prof: row.prof,
          room: row.room,
          host: row.host,
          sortOrder: row.sortOrder,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          강의 삭제
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: 대시보드 링크**

`src/app/(admin)/admin/page.tsx`의 네비 단락에 추가:

```tsx
        <Link href="/admin/timetable">강의 시간표 관리 →</Link>
```

---

## Task 8: 검증·커밋

- [ ] **Step 1: 타입·lint·build**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: 모두 통과(에러 0).

- [ ] **Step 2: mock 잔존 없음 확인**

Run: `grep -rn "FACULTY_QUOTES\|FACULTY_TIMETABLE" src`
Expected: 출력 없음.

- [ ] **Step 3: 코드 커밋**

```bash
git add src "src/app/(admin)/admin/timetable"
git commit -m "feat: 교수 시간표·한마디 실데이터화"
```

---

## Task 9: 로컬 e2e 검증·문서 커밋

**전제:** 로컬 Supabase 127.0.0.1 확인. 계정·콘텐츠 없으면 `pnpm seed`. (Task 1에서 db reset 했으므로 seed 필요)

- [ ] **Step 1: 한마디 확인**

`pnpm dev` 후 `/faculty` 데스크톱 → 한마디 스트립이 시드 교수의 quote로 표시. 모바일 뷰도 확인. (seed 교수에 quote가 있는지 확인; 4명 미만이면 보이는 만큼만 표시)

- [ ] **Step 2: 시간표 admin e2e**

admin 로그인 → `/admin/timetable` 빈 목록 → "새 강의"로 강의 3건(학장 강의 1건 포함) 생성 → 공개 `/faculty` 시간표에 반영·학장 행 강조 확인.

- [ ] **Step 3: 수정·삭제 e2e**

강의 1건 수정(강의실·정렬) → 반영 확인. 1건 삭제 → 목록·공개 페이지에서 제거 확인.

- [ ] **Step 4: 빈 상태 확인**

시간표를 모두 삭제했을 때 `/faculty` 시간표 표가 헤더만 남고 깨지지 않는지 확인. 이후 검증 데이터는 정리(또는 유지). 

- [ ] **Step 5: plan 문서 커밋**

```bash
git add docs/superpowers/plans/2026-06-24-faculty-timetable.md
git commit -m "docs: 교수 시간표·한마디 실데이터화 실행 plan"
```

---

## Self-Review 결과

- **스펙 커버리지:** 마이그레이션(Task 1)·lib 변환기+mock삭제(Task 2)·서비스 quotes/시간표(Task 3)·공개 배선(Task 4)·모바일(Task 5)·admin 액션(Task 6)·admin 라우트+대시보드(Task 7)·검증(Task 8)·e2e(Task 9). 스펙 전 항목 매핑.
- **타입 일관성:** `TimetableRow`·`toTimetableItem`·`toQuoteList`(lib) ↔ 서비스 사용부, `FacultyDirectoryData.quotes`·`getFacultyTimetable` ↔ page/Desktop/QuoteStrip/ScheduleSection/Mobile prop, `TimetableFormState`(액션) ↔ EditorForm, `TimetableAdminRow.sortOrder` ↔ edit initial 일치.
- **마이그레이션 주의:** db reset이 grant를 지우는 알려진 이슈 → Task 1 Step 3에서 복구(로컬 한정, 커밋 안 함). `db:types` 스크립트의 bare `supabase` 문제 회피 위해 `npx supabase gen types` 사용.
- **디자인 보존:** 공개 컴포넌트는 데이터 출처만 prop 교체, 마크업·문구 유지.
