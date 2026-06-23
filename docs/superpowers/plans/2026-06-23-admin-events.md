# training 이벤트 admin CRUD (2단계) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** admin이 `events` 테이블을 생성·수정·삭제하는 CRUD UI를 추가한다(공개 읽기는 1단계 완료).

**Architecture:** 기존 도메인(notice·faculty) admin 패턴을 그대로 따른다. 서버 서비스(읽기)+Server Action(쓰기)+`(admin)/admin/events` 라우트. 강사·일정표 jsonb는 클라이언트 동적 행 에디터가 hidden input에 JSON 직렬화하고, 서버 액션이 기존 zod 스키마로 검증한다. DB·RLS는 1단계 그대로(추가 마이그레이션 없음).

**Tech Stack:** Next.js 16 App Router, TypeScript strict, supabase-js + RLS, zod, Server Actions.

---

## File Structure

- `src/lib/datetime.ts` (수정) — `kstDateStartToIso` 추가
- `src/lib/training.ts` (수정) — `COVER_KINDS` export
- `src/server/services/training.ts` (수정) — `listEventsForAdmin`, `getEventForEdit` 추가
- `src/server/actions/events.ts` (신설) — `createEvent`/`updateEvent`/`deleteEvent`
- `src/app/(admin)/admin/events/EditorForm.tsx` (신설) — `'use client'` 동적 폼
- `src/app/(admin)/admin/events/page.tsx` (신설) — 목록
- `src/app/(admin)/admin/events/new/page.tsx` (신설) — 생성
- `src/app/(admin)/admin/events/[id]/edit/page.tsx` (신설) — 수정+삭제
- `src/app/(admin)/admin/page.tsx` (수정) — 대시보드 링크

---

## Task 1: datetime·lib export 보강

**Files:**
- Modify: `src/lib/datetime.ts`
- Modify: `src/lib/training.ts`

- [ ] **Step 1: `kstDateStartToIso` 추가**

`src/lib/datetime.ts`의 `kstDateEndToIso` 아래에 추가:

```ts
// "YYYY-MM-DD" → 그날 00:00:00(KST)의 ISO. 시작 시각용.
export function kstDateStartToIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00${KST_OFFSET}`).toISOString();
}
```

- [ ] **Step 2: `COVER_KINDS` export**

`src/lib/training.ts`의 기존 비공개 `const COVER_KINDS` 선언을 `export const COVER_KINDS`로 바꾼다(값·순서 유지). 동일 파일 `resolveCover`가 계속 참조하므로 이름 변경 금지.

```ts
export const COVER_KINDS: CoverKind[] = [
  "mountain-dawn", "autumn", "youth", "desert", "pine", "lake", "field",
];
```

- [ ] **Step 3: 타입 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음(기존 코드 영향 없음).

- [ ] **Step 4: Commit**

```bash
git add src/lib/datetime.ts src/lib/training.ts
git commit -m "feat: events admin용 datetime·cover export 보강"
```

---

## Task 2: admin 서비스(목록·편집 조회)

**Files:**
- Modify: `src/server/services/training.ts`

- [ ] **Step 1: 타입·함수 추가**

`getTrainingEventsData` 아래에 append. 상단 import에 `isoToKstDate`는 이미 있음. `EventRow`·`parseSpeakers`·`parseSchedule`도 이미 import됨. `ScheduleDay`·`TrainingSpeaker` 타입도 이미 import됨.

```ts
// ── admin: 미공개 포함 전체 목록 ──
export type AdminEventRow = {
  id: string;
  title: string;
  dates: string; // "YYYY.MM.DD — MM.DD"
  status: "예정" | "지난";
  place: string;
  isPublished: boolean;
};

export async function listEventsForAdmin(): Promise<AdminEventRow[]> {
  const now = Date.now();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, place, is_published")
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const start = new Date(r.starts_at);
    const end = new Date(r.ends_at);
    return {
      id: r.id,
      title: r.title,
      dates: formatEventDates(start, end),
      status: end.getTime() >= now ? "예정" : "지난",
      place: r.place ?? "",
      isPublished: r.is_published,
    };
  });
}

// ── admin: 편집 폼 prefill ──
export type EventEditData = {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  category: string;
  badge: string;
  startsAt: string; // "YYYY-MM-DD"
  endsAt: string;
  place: string;
  note: string;
  cover: string;
  capacity: string; // input value(빈 문자열 허용)
  registered: string;
  participants: string;
  fee: string;
  deadline: string; // "YYYY-MM-DD" or ""
  isPublished: boolean;
  speakers: { name: string; role: string; affiliation: string; talks: number }[];
  schedule: ScheduleDay[];
};

export async function getEventForEdit(id: string): Promise<EventEditData | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("events")
    .select(
      "id, title, subtitle, theme, category, badge, starts_at, ends_at, place, note, cover, capacity, registered, participants, fee, deadline, is_published, speakers, schedule",
    )
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  const numStr = (n: number | null) => (n == null ? "" : String(n));
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? "",
    theme: r.theme ?? "",
    category: r.category ?? "",
    badge: r.badge ?? "",
    startsAt: isoToKstDate(r.starts_at),
    endsAt: isoToKstDate(r.ends_at),
    place: r.place ?? "",
    note: r.note ?? "",
    cover: r.cover,
    capacity: numStr(r.capacity),
    registered: numStr(r.registered),
    participants: numStr(r.participants),
    fee: r.fee ?? "",
    deadline: r.deadline ?? "",
    isPublished: r.is_published,
    speakers: parseSpeakers(r.speakers).map((s) => ({
      name: s.name,
      role: s.role,
      affiliation: s.affiliation,
      talks: s.talks,
    })),
    schedule: parseSchedule(r.schedule),
  };
}
```

- [ ] **Step 2: import 보강 확인**

`formatEventDates`는 아직 import되지 않았을 수 있다. `@/lib/training` import 목록에 `formatEventDates`를 추가한다(이미 있으면 생략).

- [ ] **Step 3: 타입 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add src/server/services/training.ts
git commit -m "feat: events admin 서비스(목록·편집 조회) 추가"
```

---

## Task 3: events 서버 액션(CRUD)

**Files:**
- Create: `src/server/actions/events.ts`

- [ ] **Step 1: 액션 파일 작성**

```ts
"use server";
// events 생성/수정/삭제. admin 전용(events RLS + requireAdmin 재확인), zod 검증.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";
import { SpeakerSchema, ScheduleDaySchema, COVER_KINDS } from "@/lib/training";
import { kstDateStartToIso, kstDateEndToIso } from "@/lib/datetime";
import type { Json } from "@/lib/database.types";

const numNullable = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length ? Number(v) : null))
  .refine((v) => v == null || (Number.isInteger(v) && v >= 0), "숫자는 0 이상의 정수여야 합니다.");

const optText = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null);

const eventSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  subtitle: optText,
  theme: optText,
  category: optText,
  badge: optText,
  startsAt: z.string().trim().min(1, "시작일을 입력해주세요."),
  endsAt: z.string().trim().min(1, "종료일을 입력해주세요."),
  place: optText,
  note: optText,
  cover: z.enum(COVER_KINDS as [string, ...string[]]),
  capacity: numNullable,
  registered: numNullable,
  participants: numNullable,
  fee: optText,
  deadline: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  isPublished: z.coerce.boolean(),
  speakers: z.string().transform((v, ctx) => {
    try {
      return z.array(SpeakerSchema).parse(JSON.parse(v || "[]"));
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "강사 정보 형식이 올바르지 않습니다." });
      return z.NEVER;
    }
  }),
  schedule: z.string().transform((v, ctx) => {
    try {
      return z.array(ScheduleDaySchema).parse(JSON.parse(v || "[]"));
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "일정표 형식이 올바르지 않습니다." });
      return z.NEVER;
    }
  }),
});

export interface EventFormState {
  error?: string;
}

function parse(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    theme: formData.get("theme"),
    category: formData.get("category"),
    badge: formData.get("badge"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    place: formData.get("place"),
    note: formData.get("note"),
    cover: formData.get("cover"),
    capacity: formData.get("capacity"),
    registered: formData.get("registered"),
    participants: formData.get("participants"),
    fee: formData.get("fee"),
    deadline: formData.get("deadline"),
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
    speakers: formData.get("speakers") ?? "[]",
    schedule: formData.get("schedule") ?? "[]",
  });
}

function toRow(d: z.infer<typeof eventSchema>) {
  return {
    title: d.title,
    subtitle: d.subtitle,
    theme: d.theme,
    category: d.category,
    badge: d.badge,
    starts_at: kstDateStartToIso(d.startsAt),
    ends_at: kstDateEndToIso(d.endsAt),
    place: d.place,
    note: d.note,
    cover: d.cover,
    capacity: d.capacity,
    registered: d.registered,
    participants: d.participants,
    fee: d.fee,
    deadline: d.deadline,
    is_published: d.isPublished,
    speakers: d.speakers as unknown as Json,
    schedule: d.schedule as unknown as Json,
  };
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("events")
    .insert(toRow(r.data))
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  redirect(`/admin/events/${data.id}/edit`);
}

export async function updateEvent(
  id: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("events").update(toRow(r.data)).eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect("/admin/events");
}

export async function deleteEvent(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("events").delete().eq("id", id);
  redirect("/admin/events");
}
```

- [ ] **Step 2: 타입 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음. (`z.infer`·`Json` 캐스팅 주의)

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/events.ts
git commit -m "feat: events 서버 액션(CRUD) 추가"
```

---

## Task 4: EditorForm 동적 폼

**Files:**
- Create: `src/app/(admin)/admin/events/EditorForm.tsx`

- [ ] **Step 1: 폼 컴포넌트 작성**

```tsx
"use client";
import { useActionState, useState } from "react";
import type { EventFormState } from "@/server/actions/events";
import { COVER_KINDS } from "@/lib/training";

type Speaker = { name: string; role: string; affiliation: string; talks: number };
type ScheduleItem = { time: string; what: string; place: string; tag: string; highlight?: boolean };
type ScheduleDay = { day: string; date: string; items: ScheduleItem[] };

type Initial = {
  title?: string;
  subtitle?: string;
  theme?: string;
  category?: string;
  badge?: string;
  startsAt?: string;
  endsAt?: string;
  place?: string;
  note?: string;
  cover?: string;
  capacity?: string;
  registered?: string;
  participants?: string;
  fee?: string;
  deadline?: string;
  isPublished?: boolean;
  speakers?: Speaker[];
  schedule?: ScheduleDay[];
};

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;
const smallInput = { padding: 8, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;
const sectionStyle = { border: "1px solid #e2e2e2", borderRadius: 8, padding: 16, display: "grid", gap: 10 } as const;
const removeBtn = { padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", color: "#c00", fontSize: 13 } as const;
const addBtn = { padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, width: "fit-content" } as const;

export default function EditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [speakers, setSpeakers] = useState<Speaker[]>(initial?.speakers ?? []);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(initial?.schedule ?? []);

  const addSpeaker = () =>
    setSpeakers((s) => [...s, { name: "", role: "", affiliation: "", talks: 0 }]);
  const updateSpeaker = (i: number, patch: Partial<Speaker>) =>
    setSpeakers((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeSpeaker = (i: number) => setSpeakers((s) => s.filter((_, idx) => idx !== i));

  const addDay = () =>
    setSchedule((d) => [...d, { day: "", date: "", items: [] }]);
  const updateDay = (i: number, patch: Partial<Omit<ScheduleDay, "items">>) =>
    setSchedule((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeDay = (i: number) => setSchedule((d) => d.filter((_, idx) => idx !== i));
  const addItem = (di: number) =>
    setSchedule((d) =>
      d.map((x, idx) =>
        idx === di
          ? { ...x, items: [...x.items, { time: "", what: "", place: "", tag: "" }] }
          : x,
      ),
    );
  const updateItem = (di: number, ii: number, patch: Partial<ScheduleItem>) =>
    setSchedule((d) =>
      d.map((x, idx) =>
        idx === di
          ? { ...x, items: x.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
          : x,
      ),
    );
  const removeItem = (di: number, ii: number) =>
    setSchedule((d) =>
      d.map((x, idx) =>
        idx === di ? { ...x, items: x.items.filter((_, j) => j !== ii) } : x,
      ),
    );

  return (
    <form action={formAction} style={{ display: "grid", gap: 14, maxWidth: 760 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="제목" style={inputStyle} />
      <input name="subtitle" defaultValue={initial?.subtitle ?? ""} placeholder="부제 (선택)" style={inputStyle} />
      <input name="theme" defaultValue={initial?.theme ?? ""} placeholder="테마 (선택)" style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input name="category" defaultValue={initial?.category ?? ""} placeholder="분류 (예: 봄 정기수련회)" style={inputStyle} />
        <input name="badge" defaultValue={initial?.badge ?? ""} placeholder="배지 (예: 모집중)" style={inputStyle} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          시작일
          <input type="date" name="startsAt" defaultValue={initial?.startsAt ?? ""} required style={inputStyle} />
        </label>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          종료일
          <input type="date" name="endsAt" defaultValue={initial?.endsAt ?? ""} required style={inputStyle} />
        </label>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          신청 마감 (선택)
          <input type="date" name="deadline" defaultValue={initial?.deadline ?? ""} style={inputStyle} />
        </label>
      </div>
      <input name="place" defaultValue={initial?.place ?? ""} placeholder="장소 (선택)" style={inputStyle} />
      <input name="note" defaultValue={initial?.note ?? ""} placeholder="비고 (후속 일정 카드용, 선택)" style={inputStyle} />
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        커버 이미지
        <select name="cover" defaultValue={initial?.cover ?? COVER_KINDS[0]} style={inputStyle}>
          {COVER_KINDS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          정원 (선택)
          <input type="number" name="capacity" min={0} defaultValue={initial?.capacity ?? ""} style={inputStyle} />
        </label>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          신청자수 (선택)
          <input type="number" name="registered" min={0} defaultValue={initial?.registered ?? ""} style={inputStyle} />
        </label>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          참석자수 (지난 행사, 선택)
          <input type="number" name="participants" min={0} defaultValue={initial?.participants ?? ""} style={inputStyle} />
        </label>
      </div>
      <input name="fee" defaultValue={initial?.fee ?? ""} placeholder="회비 (예: 5만원, 선택)" style={inputStyle} />
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
      </label>

      {/* 강사 */}
      <div style={sectionStyle}>
        <strong style={{ fontSize: 14 }}>강사</strong>
        {speakers.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px 40px", gap: 8, alignItems: "center" }}>
            <input value={s.name} onChange={(e) => updateSpeaker(i, { name: e.target.value })} placeholder="이름" style={smallInput} />
            <input value={s.role} onChange={(e) => updateSpeaker(i, { role: e.target.value })} placeholder="역할" style={smallInput} />
            <input value={s.affiliation} onChange={(e) => updateSpeaker(i, { affiliation: e.target.value })} placeholder="소속" style={smallInput} />
            <input type="number" min={0} value={s.talks} onChange={(e) => updateSpeaker(i, { talks: Number(e.target.value) || 0 })} placeholder="강의수" style={smallInput} />
            <button type="button" onClick={() => removeSpeaker(i)} style={removeBtn}>×</button>
          </div>
        ))}
        <button type="button" onClick={addSpeaker} style={addBtn}>+ 강사 추가</button>
      </div>

      {/* 일정표 */}
      <div style={sectionStyle}>
        <strong style={{ fontSize: 14 }}>일정표</strong>
        {schedule.map((d, di) => (
          <div key={di} style={{ border: "1px solid #eee", borderRadius: 6, padding: 12, display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 8, alignItems: "center" }}>
              <input value={d.day} onChange={(e) => updateDay(di, { day: e.target.value })} placeholder="일자 (예: 1일차)" style={smallInput} />
              <input value={d.date} onChange={(e) => updateDay(di, { date: e.target.value })} placeholder="날짜 (예: 5.18 月)" style={smallInput} />
              <button type="button" onClick={() => removeDay(di)} style={removeBtn}>×</button>
            </div>
            {d.items.map((it, ii) => (
              <div key={ii} style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 90px 60px 40px", gap: 6, alignItems: "center", paddingLeft: 12 }}>
                <input value={it.time} onChange={(e) => updateItem(di, ii, { time: e.target.value })} placeholder="시간" style={smallInput} />
                <input value={it.what} onChange={(e) => updateItem(di, ii, { what: e.target.value })} placeholder="내용" style={smallInput} />
                <input value={it.place} onChange={(e) => updateItem(di, ii, { place: e.target.value })} placeholder="장소" style={smallInput} />
                <input value={it.tag} onChange={(e) => updateItem(di, ii, { tag: e.target.value })} placeholder="태그" style={smallInput} />
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="checkbox" checked={it.highlight ?? false} onChange={(e) => updateItem(di, ii, { highlight: e.target.checked })} /> 강조
                </label>
                <button type="button" onClick={() => removeItem(di, ii)} style={removeBtn}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => addItem(di)} style={{ ...addBtn, marginLeft: 12 }}>+ 세션 추가</button>
          </div>
        ))}
        <button type="button" onClick={addDay} style={addBtn}>+ 일자 추가</button>
      </div>

      <input type="hidden" name="speakers" value={JSON.stringify(speakers)} />
      <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />

      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 타입 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/events/EditorForm.tsx"
git commit -m "feat: events admin 동적 에디터 폼"
```

---

## Task 5: admin 라우트(목록·생성·수정)

**Files:**
- Create: `src/app/(admin)/admin/events/page.tsx`
- Create: `src/app/(admin)/admin/events/new/page.tsx`
- Create: `src/app/(admin)/admin/events/[id]/edit/page.tsx`

- [ ] **Step 1: 목록 페이지**

`src/app/(admin)/admin/events/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listEventsForAdmin } from "@/server/services/training";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminEventsPage() {
  await requireAdmin();
  const rows = await listEventsForAdmin();

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>수련회 이벤트 관리</h1>
        <Link href="/admin/events/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
          새 이벤트
        </Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>기간</th>
            <th style={{ padding: "8px 6px" }}>상태</th>
            <th style={{ padding: "8px 6px" }}>장소</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.dates}</td>
              <td style={{ padding: "8px 6px" }}>{r.status}</td>
              <td style={{ padding: "8px 6px" }}>{r.place}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px" }}>
                <Link href={`/admin/events/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "16px 6px", color: "#888" }}>등록된 이벤트가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 2: 생성 페이지**

`src/app/(admin)/admin/events/new/page.tsx`:

```tsx
import { requireAdmin } from "@/server/auth/current-user";
import { createEvent } from "@/server/actions/events";
import EditorForm from "../EditorForm";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 수련회 이벤트</h1>
      <EditorForm action={createEvent} submitLabel="저장" />
    </main>
  );
}
```

- [ ] **Step 3: 수정 페이지**

`src/app/(admin)/admin/events/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getEventForEdit } from "@/server/services/training";
import { updateEvent, deleteEvent } from "@/server/actions/events";
import EditorForm from "../../EditorForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEventForEdit(id);
  if (!event) notFound();

  const update = updateEvent.bind(null, id);
  const remove = deleteEvent.bind(null, id);

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/events" style={{ fontSize: 13, color: "#666" }}>← 목록</Link>
      <h1 style={{ fontSize: 22 }}>이벤트 수정</h1>
      <EditorForm
        action={update}
        initial={{
          title: event.title,
          subtitle: event.subtitle,
          theme: event.theme,
          category: event.category,
          badge: event.badge,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          place: event.place,
          note: event.note,
          cover: event.cover,
          capacity: event.capacity,
          registered: event.registered,
          participants: event.participants,
          fee: event.fee,
          deadline: event.deadline,
          isPublished: event.isPublished,
          speakers: event.speakers,
          schedule: event.schedule,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          이벤트 삭제
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: 타입 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/events"
git commit -m "feat: events admin 라우트(목록·생성·수정)"
```

---

## Task 6: 대시보드 링크 + 빌드 검증

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: 대시보드 링크 추가**

`src/app/(admin)/admin/page.tsx`의 기존 네비 단락을 수정:

```tsx
      <p style={{ marginTop: 16, display: "flex", gap: 16 }}>
        <Link href="/admin/inquiries">문의 접수함 →</Link>
        <Link href="/notice">공지 관리 →</Link>
        <Link href="/admin/events">수련회 이벤트 관리 →</Link>
      </p>
```

- [ ] **Step 2: lint + build**

Run: `pnpm lint && pnpm build`
Expected: 통과(에러 0).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/page.tsx"
git commit -m "feat: admin 대시보드에 이벤트 관리 링크 추가"
```

---

## Task 7: 로컬 e2e 검증·문서 커밋

**전제:** 로컬 Supabase가 127.0.0.1인지 먼저 확인(`npx supabase status`). 운영 DB 절대 금지.

- [ ] **Step 1: 개발 서버·admin 로그인**

`pnpm dev` 후 admin 계정 로그인 → `/admin` 대시보드에 "수련회 이벤트 관리 →" 링크 확인 → `/admin/events` 빈 목록 확인.

- [ ] **Step 2: 생성 e2e**

"새 이벤트"로 강사 2명 + 일정 2일(각 세션 여러 개) 포함 미래 날짜 이벤트 생성 → `/admin/events/{id}/edit`로 리다이렉트 확인 → 공개 `/training`에서 히어로·강사·일정표 노출 확인.

- [ ] **Step 3: 수정 e2e**

필드 변경 + 강사/세션 추가·삭제 후 저장 → 목록·공개 페이지 반영 확인.

- [ ] **Step 4: 공개여부·삭제 e2e**

`is_published` 해제 → 공개 `/training`에서 사라지고 `/admin/events` 목록엔 남는지 확인. 이어 삭제 → 목록·공개 페이지에서 제거 확인.

- [ ] **Step 5: 테스트 데이터 정리**

검증용으로 만든 이벤트는 admin 삭제로 모두 정리.

- [ ] **Step 6: plan·문서 커밋**

```bash
git add docs/superpowers/plans/2026-06-23-admin-events.md
git commit -m "docs: training 이벤트 admin CRUD(2단계) 실행 plan"
```

---

## Self-Review 결과

- **스펙 커버리지:** 라우트 4개(Task 4·5)·서비스 2개(Task 2)·액션 3개(Task 3)·대시보드 링크(Task 6)·동적 에디터(Task 4)·datetime/cover export(Task 1)·검증(Task 7) — 스펙 전 항목 매핑됨.
- **추가 마이그레이션 없음:** 스펙대로 DB·RLS는 1단계 그대로.
- **타입 일관성:** `EventFormState`(액션)↔EditorForm prop, `EventEditData`(서비스)↔edit 페이지 initial, `COVER_KINDS`(lib export)↔액션 enum·폼 select 모두 일치.
- **비범위 유지:** 공개 페이지 인라인 편집 진입점 없음(헌법[7]).
