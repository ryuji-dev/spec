# training 이벤트 실데이터화 Implementation Plan (1단계)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교역자수련회(`/training`)의 이벤트 영역(예정 히어로·강사·일정표·후속·지난·아카이브)을 mock(`TR_*`)에서 신규 `events` 테이블 실데이터로 전환한다. admin 입력 UI는 다음 PR.

**Architecture:** 전용 `events` 테이블(speakers·schedule은 jsonb) + RLS를 신설하고, `getTrainingEventsData()`가 시작·종료 일시로 featured/next/past/archive를 자동 분류한다. 표시용 값(dates·daysLeft·season·kind)은 서비스/순수함수에서 파생. 디자인 컴포넌트는 `TR_*` import를 props로 교체하되 마크업은 보존한다.

**Tech Stack:** Supabase(PostgreSQL+RLS, CLI 마이그레이션), TypeScript(strict), Next.js 16, zod. 단위 테스트 러너 없음 → `pnpm lint && pnpm build` + 로컬 Supabase e2e로 검증.

**참고:** 뷰 타입(`UpcomingTraining`·`NextTraining`·`PastTraining`·`TrainingSpeaker`·`ScheduleDay`·`ScheduleItem`·`ArchiveYear`·`CoverKind`)은 이미 `src/lib/training-data.ts`에 존재한다. 이 plan은 그 타입을 **재사용**하고 mock const만 제거한다.

---

### Task 1: events 마이그레이션 (테이블·인덱스·RLS)

**Files:**
- Create: `supabase/migrations/<timestamp>_events.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `npx supabase migration new events`
생성된 파일에 아래 SQL을 작성한다. admin 판별은 기존 헬퍼 `public.auth_is_admin()`(posts·faculty 정책과 동일)을 사용:

```sql
-- 교역자수련회 이벤트(예정/지난/강사/일정). 게시판 posts와 분리된 구조화 데이터.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  theme text,
  category text,
  badge text,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  place text,
  note text,
  cover text not null default 'mountain-dawn',
  capacity int,
  registered int,
  fee text,
  deadline date,
  speakers jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  participants int,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index events_starts_at_idx on public.events (starts_at);

alter table public.events enable row level security;

-- 공개: 게시된 이벤트 읽기
create policy events_select on public.events
  for select using (is_published);

-- admin: 전체 쓰기 (admin PR에서 실사용)
create policy events_write on public.events
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());
```

- [ ] **Step 2: 로컬 재적용**

Run: `npx supabase db reset`
Expected: 마이그레이션 전체 재적용 성공(에러 없음). `events` 생성됨.

- [ ] **Step 3: 타입 재생성**

Run: `pnpm db:types`
Expected: `database.types.ts`에 `events` 테이블 타입 반영.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/ src/lib/database.types.ts
git commit -m "feat: events 테이블·RLS 마이그레이션"
```

---

### Task 2: 뷰 변환·파생·zod 유틸 (lib/training.ts)

**Files:**
- Modify: `src/lib/training.ts`

`src/lib/training-data.ts`의 뷰 타입은 그대로 두고, `lib/training.ts`에 이벤트 변환 유틸을 추가한다.

- [ ] **Step 1: zod 설치 확인**

Run: `node -e "require.resolve('zod')" && echo OK`
Expected: `OK`. (이미 다른 곳에서 zod 사용 중. 없다면 `pnpm add zod`.)

- [ ] **Step 2: import 추가 + 파생 헬퍼 + zod + 변환 함수 작성**

`src/lib/training.ts` 파일 끝에 추가한다. 상단 import 블록에 타입을 추가:

```ts
import { z } from "zod";
import type {
  UpcomingTraining,
  NextTraining,
  PastTraining,
  TrainingSpeaker,
  ScheduleDay,
  ArchiveYear,
  CoverKind,
} from "./training-data";
```

파일 끝에 추가:

```ts
// ── 이벤트 표시값 파생 ──
const COVER_KINDS: CoverKind[] = [
  "mountain-dawn", "autumn", "youth", "desert", "pine", "lake", "field",
];
function resolveCover(v: string | null): CoverKind {
  return v && (COVER_KINDS as string[]).includes(v) ? (v as CoverKind) : "mountain-dawn";
}

// "2026.05.18 — 05.20" (같은 해 가정, 끝일은 MM.DD)
export function formatEventDates(start: Date, end: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const s = `${start.getFullYear()}.${p(start.getMonth() + 1)}.${p(start.getDate())}`;
  const e = `${p(end.getMonth() + 1)}.${p(end.getDate())}`;
  return `${s} — ${e}`;
}

// 시작일까지 남은 일수(음수면 0)
export function daysUntil(start: Date, now: Date): number {
  const ms = start.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

// "2025 가을" (월 < 7 → 봄, 그 외 가을)
export function seasonLabel(start: Date): string {
  return `${start.getFullYear()} ${start.getMonth() + 1 < 7 ? "봄" : "가을"}`;
}

// ── speakers / schedule jsonb 검증 ──
export const SpeakerSchema = z.object({
  name: z.string(),
  role: z.string(),
  affiliation: z.string(),
  talks: z.number(),
});
const ScheduleItemSchema = z.object({
  time: z.string(),
  what: z.string(),
  place: z.string(),
  tag: z.string(),
  highlight: z.boolean().optional(),
});
export const ScheduleDaySchema = z.object({
  day: z.string(),
  date: z.string(),
  items: z.array(ScheduleItemSchema),
});

export function parseSpeakers(v: unknown): TrainingSpeaker[] {
  const arr = z.array(SpeakerSchema).safeParse(v);
  if (!arr.success) return [];
  return arr.data.map((s) => ({
    name: s.name,
    role: s.role,
    init: s.name.slice(0, 1),
    talks: s.talks,
    affiliation: s.affiliation,
  }));
}

export function parseSchedule(v: unknown): ScheduleDay[] {
  const arr = z.array(ScheduleDaySchema).safeParse(v);
  return arr.success ? arr.data : [];
}

// ── 서비스가 만든 평면 이벤트 행 ──
export type EventRow = {
  id: string;
  title: string;
  subtitle: string | null;
  theme: string | null;
  category: string | null;
  badge: string | null;
  startsAt: Date;
  endsAt: Date;
  place: string | null;
  note: string | null;
  cover: string | null;
  capacity: number | null;
  registered: number | null;
  fee: string | null;
  deadline: string | null; // "YYYY.MM.DD" 포맷 완료 문자열
  speakers: TrainingSpeaker[];
  participants: number | null;
};

// 평면 행 → 예정 히어로 뷰
export function toUpcomingView(row: EventRow, now: Date): UpcomingTraining {
  return {
    id: row.id,
    badge: row.badge ?? "",
    cat: row.category ?? "",
    title: row.title,
    subtitle: row.subtitle ?? "",
    theme: row.theme ?? "",
    dates: formatEventDates(row.startsAt, row.endsAt),
    daysLeft: daysUntil(row.startsAt, now),
    place: row.place ?? "",
    speakers: row.speakers.map((s) => s.name),
    registered: row.registered ?? 0,
    capacity: row.capacity ?? 0,
    deadline: row.deadline ?? "",
    fee: row.fee ?? "",
    cover: resolveCover(row.cover),
  };
}

// 평면 행 → 후속 예정 뷰
export function toNextView(row: EventRow): NextTraining {
  return {
    id: row.id,
    badge: row.badge ?? "",
    cat: row.category ?? "",
    title: row.title,
    dates: formatEventDates(row.startsAt, row.endsAt),
    place: row.place ?? "",
    note: row.note ?? "",
    cover: resolveCover(row.cover),
  };
}

// 평면 행 → 지난 수련회 뷰. kind는 목록 인덱스로 배정(디자인 4분할).
const PAST_KINDS = ["big", "tall", "wide", "small"] as const;
export function toPastView(row: EventRow, index: number): PastTraining {
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    id: index + 1,
    season: seasonLabel(row.startsAt),
    title: row.title,
    date: `${row.startsAt.getFullYear()}.${p(row.startsAt.getMonth() + 1)}.${p(row.startsAt.getDate())}`,
    participants: row.participants ?? 0,
    cover: resolveCover(row.cover),
    kind: PAST_KINDS[index % PAST_KINDS.length],
  };
}

// 지난 이벤트들 → 연도별 아카이브("계절 · 제목")
export function buildArchive(rows: EventRow[]): ArchiveYear[] {
  const byYear = new Map<string, string[]>();
  for (const r of rows) {
    const y = String(r.startsAt.getFullYear());
    const label = `${r.startsAt.getMonth() + 1 < 7 ? "봄" : "가을"} · ${r.title}`;
    byYear.set(y, [...(byYear.get(y) ?? []), label]);
  }
  return [...byYear.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([y, items]) => ({ y, items }));
}
```

- [ ] **Step 3: 린트·타입 확인**

Run: `pnpm lint`
Expected: 통과.

---

### Task 3: 서비스 getTrainingEventsData

**Files:**
- Modify: `src/server/services/training.ts`

- [ ] **Step 1: import 보강**

`src/server/services/training.ts` 상단 `@/lib/training` import에 변환/파생 함수를 추가하고, `@/lib/training-data`·`@/lib/datetime` 타입을 추가한다. 기존 import에 다음을 더한다:

```ts
import {
  toTrainingPostView,
  toUpcomingView,
  toNextView,
  toPastView,
  buildArchive,
  parseSpeakers,
  parseSchedule,
  TRAINING_CATEGORIES_KO,
  CATEGORY_EN,
  type TrainingRow,
  type EventRow,
} from "@/lib/training";
import type {
  TrainingPost,
  TrainingCategory,
  UpcomingTraining,
  NextTraining,
  PastTraining,
  TrainingSpeaker,
  ScheduleDay,
  ArchiveYear,
} from "@/lib/training-data";
import { isoToKstDate } from "@/lib/datetime";
```

> 주의: `isoToKstDate`는 파일에 이미 import돼 있을 수 있다(있으면 중복 추가 금지). 기존 import 목록은 파일을 열어 확인.

- [ ] **Step 2: 타입·함수 추가**

파일 끝에 추가:

```ts
export type TrainingEventsData = {
  featured: UpcomingTraining | null;
  next: NextTraining[];
  past: PastTraining[];
  archive: ArchiveYear[];
  speakers: TrainingSpeaker[];
  schedule: ScheduleDay[];
};

export async function getTrainingEventsData(): Promise<TrainingEventsData> {
  const now = new Date();
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, subtitle, theme, category, badge, starts_at, ends_at, place, note, cover, capacity, registered, fee, deadline, speakers, schedule, participants",
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];

  // 평면 행 + featured용 schedule 원본 보관
  const events = rows.map((r) => {
    const row: EventRow = {
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      theme: r.theme,
      category: r.category,
      badge: r.badge,
      startsAt: new Date(r.starts_at),
      endsAt: new Date(r.ends_at),
      place: r.place,
      note: r.note,
      cover: r.cover,
      capacity: r.capacity,
      registered: r.registered,
      fee: r.fee,
      deadline: r.deadline ? isoToKstDate(r.deadline) : null,
      speakers: parseSpeakers(r.speakers),
      participants: r.participants,
    };
    return { row, schedule: parseSchedule(r.schedule) };
  });

  // 예정(종료가 아직 안 지남) vs 지난
  const upcoming = events.filter((e) => e.row.endsAt.getTime() >= now.getTime());
  const pastAll = events
    .filter((e) => e.row.endsAt.getTime() < now.getTime())
    .sort((a, b) => b.row.startsAt.getTime() - a.row.startsAt.getTime());

  // featured = 예정 중 가장 임박(starts_at 오름차순 정렬이므로 첫 항목)
  const featuredEntry = upcoming[0] ?? null;
  const featured = featuredEntry ? toUpcomingView(featuredEntry.row, now) : null;
  const speakers = featuredEntry ? featuredEntry.row.speakers : [];
  const schedule = featuredEntry ? featuredEntry.schedule : [];

  const next = upcoming.slice(1).map((e) => toNextView(e.row));
  const past = pastAll.slice(0, 4).map((e, i) => toPastView(e.row, i));
  const archive = buildArchive(pastAll.map((e) => e.row));

  return { featured, next, past, archive, speakers, schedule };
}
```

- [ ] **Step 3: 린트·타입 확인**

Run: `pnpm lint`
Expected: 통과.

---

### Task 4: page.tsx — events 조회·props 전달

**Files:**
- Modify: `src/app/training/page.tsx`

- [ ] **Step 1: events 조회 + 전달**

`getTrainingEventsData`를 import하고 호출해 데스크톱·모바일에 `events` prop으로 넘긴다. 기존 import 줄:
```ts
import { getTrainingListData } from "@/server/services/training";
```
를:
```ts
import { getTrainingListData, getTrainingEventsData } from "@/server/services/training";
```

`const data = await getTrainingListData();` 아래에 추가:
```ts
  const events = await getTrainingEventsData();
```

`<TrainingDesktop posts={posts} categories={data.categories} />`를:
```tsx
        <TrainingDesktop posts={posts} categories={data.categories} events={events} />
```
`<TrainingMobile posts={posts} categories={data.categories} />`를:
```tsx
  return <TrainingMobile posts={posts} categories={data.categories} events={events} />;
```

> Task 5·6에서 두 컴포넌트가 `events` prop을 받기 전까진 타입 에러가 날 수 있다 → Task 6까지 끝낸 뒤 빌드.

---

### Task 5: 데스크톱 컨테이너·자식 컴포넌트 props화

**Files:**
- Modify: `src/app/training/_components/desktop/TrainingDesktop.tsx`
- Modify: `src/app/training/_components/desktop/UpcomingHero.tsx`
- Modify: `src/app/training/_components/desktop/ScheduleSection.tsx`
- Modify: `src/app/training/_components/desktop/SpeakersSection.tsx`
- Modify: `src/app/training/_components/desktop/NextSection.tsx`
- Modify: `src/app/training/_components/desktop/PastBento.tsx`
- Modify: `src/app/training/_components/desktop/Sidebar.tsx`

- [ ] **Step 1: TrainingDesktop — events prop 수신·분배**

import에 타입 추가:
```ts
import type { TrainingPost, TrainingCategory } from "@/lib/training-data";
import type { TrainingEventsData } from "@/server/services/training";
```
Props 타입·시그니처:
```ts
type Props = {
  posts: TrainingPost[];
  categories: TrainingCategory[];
  events: TrainingEventsData;
};

export default function TrainingDesktop({ posts, categories, events }: Props) {
```
이벤트 컴포넌트 호출부를 props 전달로 교체:
```tsx
      <HeroSection />
      <UpcomingHero palette={palette} featured={events.featured} speakers={events.speakers} />
      <ScheduleSection palette={palette} schedule={events.schedule} />
      <SpeakersSection palette={palette} speakers={events.speakers} />
      <NextSection palette={palette} next={events.next} />
      <PastBento palette={palette} past={events.past} />
```
사이드바 호출부:
```tsx
          <SideRegister palette={palette} featured={events.featured} />
          <SideArchive palette={palette} archive={events.archive} />
          <SideContact palette={palette} />
```

- [ ] **Step 2: UpcomingHero — props화 + null 가드**

import 줄 `import { TR_UPCOMING, TR_SPEAKERS } from "@/lib/training-data";`를 제거하고 타입 import 추가:
```ts
import type { UpcomingTraining, TrainingSpeaker } from "@/lib/training-data";
```
Props·본문 상단(`const u = TR_UPCOMING;` 포함부)을 교체:
```tsx
type Props = { palette: Palette; featured: UpcomingTraining | null; speakers: TrainingSpeaker[] };

export default function UpcomingHero({ palette, featured, speakers }: Props) {
  if (!featured) return null;
  const u = featured;
  const pct = u.capacity > 0 ? Math.round((u.registered / u.capacity) * 100) : 0;
```
본문의 `TR_SPEAKERS.map(...)`(약 395행)을 `speakers.map(...)`으로 교체. 나머지 `u.*` 참조는 그대로 둔다.

- [ ] **Step 3: ScheduleSection — props화 + 빈 가드**

import 줄 `import { TR_SCHEDULE } from "@/lib/training-data";`를 제거하고:
```ts
import type { ScheduleDay } from "@/lib/training-data";
```
Props·시그니처:
```tsx
type Props = { palette: Palette; schedule: ScheduleDay[] };

export default function ScheduleSection({ palette, schedule }: Props) {
  if (schedule.length === 0) return null;
```
본문 `TR_SCHEDULE.map(...)`을 `schedule.map(...)`으로 교체.

- [ ] **Step 4: SpeakersSection — props화 + 빈 가드**

import 줄 `import { TR_SPEAKERS } from "@/lib/training-data";`를 제거하고:
```ts
import type { TrainingSpeaker } from "@/lib/training-data";
```
Props·시그니처:
```tsx
type Props = { palette: Palette; speakers: TrainingSpeaker[] };

export default function SpeakersSection({ palette, speakers }: Props) {
  if (speakers.length === 0) return null;
```
본문 `TR_SPEAKERS.map(...)`을 `speakers.map(...)`으로 교체.

- [ ] **Step 5: NextSection — props화**

import 줄 `import { TR_NEXT } from "@/lib/training-data";`를 제거하고:
```ts
import type { NextTraining } from "@/lib/training-data";
```
Props·시그니처:
```tsx
type Props = { palette: Palette; next: NextTraining[] };

export default function NextSection({ palette, next }: Props) {
```
본문 `TR_NEXT.map(...)`을 `next.map(...)`으로 교체.

- [ ] **Step 6: PastBento — props화**

import 줄 `import { TR_PAST, type PastTraining } from "@/lib/training-data";`를:
```ts
import type { PastTraining } from "@/lib/training-data";
```
Props·시그니처:
```tsx
type Props = { palette: Palette; past: PastTraining[] };

export default function PastBento({ palette, past }: Props) {
```
본문 `TR_PAST[0]`·`TR_PAST[1]`·`TR_PAST[2]`·`TR_PAST[3]`을 각각 `past[0]`·`past[1]`·`past[2]`·`past[3]`으로 교체. `PastCard`의 `item` prop은 `PastTraining`이므로 옵셔널 접근 대비 빈 배열 시 `past[i]`가 undefined일 수 있다 → 호출 직전 가드 추가:
```tsx
  if (past.length < 4) return null;
```
(시드가 past 6건을 보장하므로 1단계에선 항상 통과. admin PR에서 부족분 처리.)

- [ ] **Step 7: Sidebar — SideRegister·SideArchive props화**

import 줄 `import { TR_UPCOMING, TR_ARCHIVE } from "@/lib/training-data";`를 제거하고:
```ts
import type { UpcomingTraining, ArchiveYear } from "@/lib/training-data";
```
`SideRegister`:
```tsx
export function SideRegister({ palette, featured }: { palette: Palette; featured: UpcomingTraining | null }) {
  if (!featured) return null;
  const u = featured;
  const pct = u.capacity > 0 ? Math.round((u.registered / u.capacity) * 100) : 0;
```
`SideArchive`:
```tsx
export function SideArchive({ palette, archive }: { palette: Palette; archive: ArchiveYear[] }) {
```
본문 `TR_ARCHIVE.map((g) => ...)`을 `archive.map((g) => ...)`으로 교체. `SideContact`는 변경 없음.

> 주의: `Sidebar.tsx`의 기존 `type Props = { palette: Palette }`는 `SideContact`가 계속 쓰면 유지, 아니면 각 함수 인라인 타입으로 충분. 파일을 열어 `SideContact` 시그니처를 깨지 않게 한다.

---

### Task 6: 모바일 props화

**Files:**
- Modify: `src/app/training/_components/mobile/TrainingMobile.tsx`

- [ ] **Step 1: import 교체**

import 블록의
```ts
import {
  TR_PAST,
  TR_SCHEDULE,
  TR_SPEAKERS,
  TR_UPCOMING,
  type TrainingPost,
  type TrainingCategory,
} from "@/lib/training-data";
```
를:
```ts
import type {
  TrainingPost,
  TrainingCategory,
} from "@/lib/training-data";
import type { TrainingEventsData } from "@/server/services/training";
```

- [ ] **Step 2: Props·본문 상단 교체**

```tsx
type Props = {
  posts: TrainingPost[];
  categories: TrainingCategory[];
  events: TrainingEventsData;
};

export default function TrainingMobile({ posts, categories, events }: Props) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);
  const filtered =
    activeCat === 0
      ? posts
      : posts.filter((p) => p.cat === categories[activeCat].ko);
  const u = events.featured;
  const pct = u && u.capacity > 0 ? Math.round((u.registered / u.capacity) * 100) : 0;
```

- [ ] **Step 3: featured(`u`) 사용부 null 가드**

`u.*`를 쓰는 히어로 블록(약 197~360행)을 `{u && ( ... )}`로 감싼다. 즉 해당 `<section>`(또는 최상위 래퍼)을 조건부 렌더로 바꾼다. 파일을 열어 히어로 블록의 시작/끝 JSX 경계를 확인한 뒤 `{u && ( ...히어로... )}`로 감싼다.

- [ ] **Step 4: 배열 mock 사용부 교체**

- `TR_SPEAKERS.map(...)`(약 430행) → `events.speakers.map(...)`
- `TR_SCHEDULE.map(...)`(약 546행) → `events.schedule.map(...)`
- `TR_PAST.map(...)`(약 951행) → `events.past.map(...)`

(빈 배열이면 자연히 아무것도 안 그려짐 — 별도 가드 불필요.)

- [ ] **Step 5: 린트 확인**

Run: `pnpm lint`
Expected: 통과.

---

### Task 7: TR_* mock const 제거

**Files:**
- Modify: `src/lib/training-data.ts`

- [ ] **Step 1: 이벤트 mock const 제거**

`TR_UPCOMING`·`TR_NEXT`·`TR_PAST`·`TR_SPEAKERS`·`TR_SCHEDULE`·`TR_ARCHIVE` `export const` 블록을 삭제한다. **타입(`UpcomingTraining` 등)과 `TR_CATEGORIES`·`TR_BOARD`는 유지**한다(여전히 사용 여부 확인).

- [ ] **Step 2: 잔존 참조 확인**

Run: `grep -rn "TR_UPCOMING\|TR_NEXT\|TR_PAST\|TR_SPEAKERS\|TR_SCHEDULE\|TR_ARCHIVE" src/`
Expected: 결과 없음(0건).

> 만약 `TR_BOARD`·`TR_CATEGORIES`가 더 이상 import되지 않으면 함께 제거하되, 사용처가 있으면 둔다. `grep -rn "TR_BOARD\|TR_CATEGORIES" src/`로 확인.

---

### Task 8: 검증 (lint·build·시드·e2e·정리)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 린트·빌드**

Run: `pnpm lint && pnpm build`
Expected: 모두 통과.

- [ ] **Step 2: 이벤트 시드 (로컬)**

`npx supabase status`로 API URL이 `127.0.0.1`인지 확인 후, db 컨테이너에 SQL로 이벤트를 시드한다. featured 1(미래) + next 2(미래) + past 6(과거: 2025·2024·2023 봄/가을):

```sql
insert into public.events
  (title, subtitle, theme, category, badge, starts_at, ends_at, place, note, cover, capacity, registered, fee, deadline, speakers, schedule, participants)
values
 ('2026 봄 교역자 수련회','말씀 앞에 다시 서다','"너희는 가만히 있어 내가 하나님 됨을 알지어다" (시 46:10)','봄 정기','신청 접수 중',
  now() + interval '20 day', now() + interval '22 day','강원도 평창 · 알펜시아 컨벤션', null,'mountain-dawn',120,87,'180,000원', (now()+interval '12 day')::date,
  '[{"name":"이정훈 교수","role":"키노트 · 광야 신학","affiliation":"장로회신학대학교","talks":3},{"name":"박세영 목사","role":"말씀 강해 · 시편 46","affiliation":"광림감리교회","talks":2},{"name":"김명숙 사모","role":"대담 · 사역자의 가정","affiliation":"한신대학교","talks":1}]'::jsonb,
  '[{"day":"DAY 1","date":"개회","items":[{"time":"14:00","what":"등록 및 입소","place":"로비","tag":"체크인"},{"time":"19:30","what":"개회예배 · 키노트 1강","place":"채플","tag":"예배","highlight":true}]},{"day":"DAY 2","date":"본집회","items":[{"time":"06:00","what":"새벽기도","place":"채플","tag":"기도"},{"time":"09:30","what":"말씀 강해 1","place":"채플","tag":"강의","highlight":true}]},{"day":"DAY 3","date":"파송","items":[{"time":"09:30","what":"키노트 3강 · 결단","place":"채플","tag":"예배","highlight":true},{"time":"11:30","what":"폐회 및 파송","place":"채플","tag":"예배"}]}]'::jsonb,
  null),
 ('2026 가을 교역자 수련회',null,null,'가을 정기','사전 예고', now()+interval '150 day', now()+interval '152 day','충남 보령 · 천주교피정의집','주제 · 강사 7월 중 공지 예정','autumn',null,null,null,null,'[]'::jsonb,'[]'::jsonb,null),
 ('청년부 사역자 1박 모임',null,null,'청년사역','특별 세미나', now()+interval '40 day', now()+interval '41 day','서울 양화진 게스트하우스','청년부 담당 교역자 한정 · 25명','youth',null,null,null,null,'[]'::jsonb,'[]'::jsonb,null),
 ('광야의 은혜를 기억하다',null,null,'가을 정기',null, '2025-10-07','2025-10-09','강원도','후기','desert',null,null,null,null,'[]'::jsonb,'[]'::jsonb,104),
 ('다시, 처음의 자리에서',null,null,'봄 정기',null, '2025-05-13','2025-05-15','경기도','후기','pine',null,null,null,null,'[]'::jsonb,'[]'::jsonb,96),
 ('깊은 데로 가서',null,null,'가을 정기',null, '2024-10-15','2024-10-17','충남','후기','lake',null,null,null,null,'[]'::jsonb,'[]'::jsonb,88),
 ('말씀의 사람으로',null,null,'봄 정기',null, '2024-05-21','2024-05-23','전북','후기','field',null,null,null,null,'[]'::jsonb,'[]'::jsonb,92),
 ('작은 자의 길',null,null,'가을 정기',null, '2023-10-10','2023-10-12','강원도','후기','desert',null,null,null,null,'[]'::jsonb,'[]'::jsonb,80),
 ('함께 부르심',null,null,'봄 정기',null, '2023-05-16','2023-05-18','경기도','후기','pine',null,null,null,null,'[]'::jsonb,'[]'::jsonb,77);
```

실행:
```bash
CID=$(docker ps --format '{{.Names}}' | grep supabase_db)
docker exec -i $CID psql -U postgres -d postgres < <SQL파일 또는 heredoc>
```

- [ ] **Step 3: 데스크톱 e2e**

Preview(`web-dev`, 3000) `/training` 데스크톱에서 렌더 DOM 확인:
- 예정 히어로: "2026 봄 교역자 수련회"·주제·"강원도 평창"·D-day·"87 / 120명"·진행바.
- 강사 섹션: 이정훈/박세영/김명숙 3인.
- 일정표: DAY 1·2·3.
- 지난 수련회 벤토: 4건(광야의 은혜 / 다시, 처음의 / 깊은 데로 / 말씀의 사람).
- 사이드 아카이브: 2025·2024·2023 그룹.

- [ ] **Step 4: 모바일 e2e**

`/training` 모바일(ios/android UA)에서 히어로·강사·일정표·지난 수련회가 동일 데이터로 렌더되는지 확인. (UA 강제가 어려우면 코드 동치 + build 통과로 갈음하고 정직히 보고.)

- [ ] **Step 5: 콘솔 에러 확인**

`preview_console_logs(level=error)`로 이번 기능발 에러 없는지 확인(기존 stale 세션 토큰 에러는 무관).

- [ ] **Step 6: 시드 정리**

```sql
delete from public.events;
```
로컬 DB 원상 복구(이벤트 전체 삭제 — 시드 외 데이터 없음).

---

## Self-Review
- **Spec 커버리지**: events 스키마+RLS→Task 1, 파생/zod/변환→Task 2, 자동 분류 서비스→Task 3, page 연결→Task 4, 공개 페이지 props화(데스크톱)→Task 5, (모바일)→Task 6, mock 제거→Task 7, 시드+검증→Task 8. 신청 진행바(registered 유지)→Task 5 Step 2·7 + Task 6 Step 2. 누락 없음.
- **범위 제외 준수**: admin CRUD·신청 시스템 미포함(쓰기 RLS만 선반영). 게시판 영역 무변경.
- **Placeholder**: 없음(모든 코드 블록 실제 코드). 모바일 히어로 가드(Task 6 Step 3)는 JSX 경계 확인 후 `{u && (...)}` 래핑으로 구체 지시.
- **타입 일관성**: `EventRow`·`TrainingEventsData`·변환 함수 시그니처를 Task 2·3에서 정의하고 Task 4·5·6에서 동일 사용. 뷰 타입은 기존 training-data.ts 재사용. `getTrainingEventsData` 반환 필드(featured/next/past/archive/speakers/schedule)가 컴포넌트 props명과 일치.
