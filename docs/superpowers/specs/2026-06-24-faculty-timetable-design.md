# 교수 시간표·한마디 실데이터화 — 설계

작성일: 2026-06-24

## 목표

`/faculty`의 두 mock 섹션을 실데이터로 전환한다.

1. **한마디(VOICES 스트립)** — 교수별 짧은 인용. 화면 문구("VOICES · 한 학기의 한 줄", "— OOO 교수")는 디자인 보존(헌법[7])으로 그대로 둔다. "어록"은 내부 호칭일 뿐 화면에 없으며, 이 섹션을 문서에서 "한마디"로 부른다.
2. **강의 시간표(TIMETABLE)** — 요일·시간·강좌·교수·강의실·학장여부의 주간 표. 데스크톱 전용 섹션.

비범위:
- 한마디 섹션 제거 — 하지 않음(디자인 변경)
- 시간표를 교수 1인 속성으로 모델링 — 하지 않음(별도 테이블)

## 1. 한마디 — 신규 테이블 없음(배선만)

`faculty` 테이블에 이미 `quote` 컬럼이 있고 admin 교수 편집기에서도 이미 편집한다. 따라서 공급만 추가한다.

- `getFacultyDirectoryData`가 이미 가져오는 교수 목록(`memberRows`, 커버 제외)에서 `quote`가 빈 값이 아닌 교수를 **최대 4명**(sort_order→created_at 순) 골라 `quotes: { name: string; q: string }[]`로 파생해 `FacultyDirectoryData`에 추가한다(추가 쿼리 없음).
- 변환은 `lib/faculty.ts`의 순수 함수로 둔다.
- `QuoteStrip`(데스크톱)·`FacultyMobile`의 VOICES 영역을 `FACULTY_QUOTES` mock 대신 `quotes` prop으로 교체.
- `faculty-data.ts`의 `FACULTY_QUOTES` 상수 삭제(타입 `FacultyQuote`는 유지).

## 2. 시간표 — 신규 테이블 + admin CRUD

### 마이그레이션 (`faculty_timetable`)

```sql
create table public.faculty_timetable (
  id uuid primary key default gen_random_uuid(),
  day text not null,         -- "월"·"화" …
  time text not null,        -- "10:00"
  course text not null,
  prof text not null,
  room text not null,
  host boolean not null default false,  -- 학장 강의 강조
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.faculty_timetable enable row level security;
create policy faculty_timetable_select on public.faculty_timetable for select using (true);
create policy faculty_timetable_write on public.faculty_timetable for all using (public.auth_is_admin()) with check (public.auth_is_admin());
```

- `auth_is_admin()` 헬퍼는 기존 마이그레이션에서 정의됨(재사용).
- `database.types.ts` 재생성.

### 공개 읽기

- `lib/faculty.ts`에 `TimetableRow` 평면 타입 + `toTimetableItem(row)` 변환기(→ 기존 `FacultyTimetableItem`). `host`가 false면 `host` 키 생략(기존 타입이 `host?` 선택).
- `server/services/faculty.ts`에 `getFacultyTimetable(): Promise<FacultyTimetableItem[]>` — `faculty_timetable` 조회(sort_order→day→time 정렬) 후 매핑.
- `faculty/page.tsx`에서 `getFacultyTimetable()` 호출(데스크톱 분기에서만 필요) → `FacultyDesktop`에 `timetable` prop 전달 → `ScheduleSection`이 `FACULTY_TIMETABLE` mock 대신 prop 사용.
- `faculty-data.ts`의 `FACULTY_TIMETABLE` 상수 삭제(타입 `FacultyTimetableItem`은 유지).

### admin CRUD (events 패턴 축소판 — 평면 행)

- 서비스(`server/services/faculty.ts`): `listTimetableForAdmin()`(전체, sort_order순)·`getTimetableRowForEdit(id)`.
- 액션(`server/actions/timetable.ts`, `'use server'`): `createTimetable`·`updateTimetable(id)`·`deleteTimetable(id)` — 진입부 `requireAdmin()` + zod 검증(day·time·course·prof·room 필수, host 불리언, sortOrder 숫자).
- 라우트(`(admin)/admin/timetable/`): `page.tsx`(목록 표 + "새 강의" 버튼), `new/page.tsx`, `[id]/edit/page.tsx`, `EditorForm.tsx`(`'use client'`, 기존 admin 인라인 스타일).
- `(admin)/admin/page.tsx` 대시보드에 "강의 시간표 관리 →" 링크 추가.

## 보안

- RLS가 1차 경계(`faculty_timetable_write` = `auth_is_admin()`), 서버 액션 진입부 `requireAdmin()`가 2차 방어.
- 한마디는 기존 faculty 공개 RLS 범위 내(읽기 전용).
- `dangerouslySetInnerHTML` 미사용.

## 검증 계획

로컬 Supabase(127.0.0.1 확인 후) 시드 데이터로:
1. 교수 편집기에서 quote가 있는 교수가 4명 이상이면 `/faculty` 한마디 스트립이 실제 quote로 표시(데스크톱·모바일).
2. `/admin/timetable`에서 강의 생성(학장 강의 1건 포함)·수정·삭제 → 공개 `/faculty` 시간표 반영, 학장 행 강조 표시 확인.
3. 시간표가 비어 있을 때 섹션이 깨지지 않는지 확인.
4. `pnpm lint`·`pnpm build` 통과.
