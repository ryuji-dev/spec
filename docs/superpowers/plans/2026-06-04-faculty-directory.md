# 신학원교수소개(faculty) DB 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. 신규 `faculty` 테이블 기반 교수 디렉터리. posts 미사용. spec: docs/superpowers/specs/2026-06-04-faculty-directory-design.md.

**Goal:** 교수진 디렉터리(그리드/리스트·부서 필터·커버 교수)를 신규 faculty 테이블로 DB 연동하고 admin CRUD를 제공. 시간표·인용·CTA는 정적.

**Architecture:** 신규 `faculty` 테이블(enum dept/tone, teaches jsonb, isCover, about). 순수 매퍼가 DB행 → FacultyMember/FacultyCover 뷰모델 파생. 서버 페이지가 cover·members·depts props 주입.

## 공통 제약
- **디자인 보존**: 교수 영역(FeaturedHero·FilterStrip·FacultyGrid/List)만 mock→props. 아바타·tone·QuoteStrip·ScheduleSection·SeminaryCTA 마크업 불변.
- admin 전용 쓰기, 공개 열람. 한국어 주석. 커밋 트레일러 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- 상세 페이지·posts·comments·attachments 불사용.

---

## Task 1: faculty 스키마 + 마이그레이션

**Files:** Create `web/src/server/db/schema/faculty.ts`; Modify `web/src/server/db/schema/index.ts`; Create migration.

- [ ] **Step 1**: `schema/faculty.ts` — pgEnum `facultyDept`(["ot","nt","st","pt","ch","mn"]), `facultyTone`(["forest","olive","pine","sage"]). pgTable `faculty`:
  id uuid pk defaultRandom; dept facultyDept notNull; name/title/en/degree text notNull; tone facultyTone notNull; field text notNull; teaches jsonb notNull default '[]' ($type<string[]>); quote text notNull; years/papers integer notNull default 0; office/hours text notNull; isCover boolean notNull default false; about text(nullable); sortOrder integer notNull default 0; createdAt timestamptz notNull defaultNow. export Faculty/NewFaculty 타입.
- [ ] **Step 2**: 배럴 `index.ts`에 `export * from "./faculty";` 추가.
- [ ] **Step 3**: `cd web && pnpm db:generate` → 0003 마이그레이션(CREATE TYPE 2개, CREATE TABLE faculty).
- [ ] **Step 4**: `.pglite` 리셋 후 dev-db로 0003 적용 확인(`rm -rf .pglite && node scripts/dev-db.mjs` 출력에 0003 포함, 후 종료).
- [ ] **Step 5**: 커밋 `feat: faculty 테이블·enum·마이그레이션 추가`.

---

## Task 2: 매퍼 lib/faculty.ts + verify

**Files:** Create `web/src/lib/faculty.ts`, `web/scripts/verify-faculty.mjs`; Modify `web/src/lib/faculty-data.ts`(id string), `web/package.json`.

- [ ] **Step 1**: `lib/faculty.ts`(순수):
  - `FACULTY_DEPT_META: Record<dept, {ko,en}>`: ot→{구약학,OLD TESTAMENT}, nt→{신약학,NEW TESTAMENT}, st→{조직신학,SYSTEMATIC}, pt→{실천신학,PRACTICAL}, ch→{교회사,CHURCH HISTORY}, mn→{선교/디아스포라,MISSIONS}
  - `COVER_TAG = "커버 스토리 · 2026 봄"`
  - `FacultyRow` 타입(DB 컬럼 평면)
  - `toFacultyMemberView(row): FacultyMember` — init=name.slice(0,1), teaches=row.teaches, 나머지 직접. id=row.id(string)
  - `toFacultyCoverView(row): FacultyCover` — id, name, title, en, init, yearsKo=`${years}년차`, tag=COVER_TAG, quote, about=about??"", stats=[{k:String(years),l:"강의 연차"},{k:String(papers),l:"저서·논문"},{k:String(teaches.length),l:"담당 강좌"}], current=teaches
  - 타입 import from `./faculty-data`.
- [ ] **Step 2**: `faculty-data.ts`의 `FacultyMember.id` number→string, `FACULTY_MEMBERS` id(1~14)를 "1"~"14"로. (FACULTY_COVER.id "cover" 유지, 정적 TIMETABLE/QUOTES/DEPTS 유지)
- [ ] **Step 3**: `verify-faculty.mjs`(매퍼 필드·init 파생·cover stats/current·dept 메타 단언) + package.json `"faculty:verify"`.
- [ ] **Step 4**: `pnpm faculty:verify` + `pnpm exec tsc --noEmit`.
- [ ] **Step 5**: 커밋 `feat: 신학원교수 순수 매퍼·cover 파생 추가`.

---

## Task 3: 서비스 server/services/faculty.ts

**Files:** Create `web/src/server/services/faculty.ts`

- [ ] **Step 1**: `import "server-only"`.
  - `getFacultyDirectoryData()` → `{ cover, members, depts }`. members = isCover=false 전체 orderBy sortOrder,createdAt → toFacultyMemberView[]. cover = isCover=true 첫 행 → toFacultyCoverView(없으면 null). depts: FACULTY_DEPT_META 순서로 dept별 카운트(isCover=false 기준) + 전체(all) 카운트 → FacultyDeptItem[]({id,ko,en,count}, 맨 앞 all).
  - `getFacultyMemberForEdit(id)` → 전체 컬럼 | null.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 신학원교수 디렉터리 서비스 추가`.

---

## Task 4: 액션 server/actions/faculty.ts

**Files:** Create `web/src/server/actions/faculty.ts`

- [ ] **Step 1**: `"use server"`. requireAdmin. zod: name·title·en·degree·field·quote·office·hours(min1), dept z.enum(dept값), tone z.enum(tone값), teaches(string→split(/[\n,]/) trim 비어있지 않은 것만 string[]), years·papers·sortOrder z.coerce.number().int().min(0), isCover z.coerce.boolean(), about optional→null. `createFaculty`(insert, redirect /admin/faculty), `updateFaculty(id,...)`(redirect /admin/faculty), `deleteFaculty(id)`(redirect /admin/faculty). FacultyFormState export.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 신학원교수 admin 추가·수정·삭제 Server Action`.

---

## Task 5: admin 페이지 (index + EditorForm + new + edit)

**Files:** Create `web/src/app/(admin)/admin/faculty/{page.tsx,EditorForm.tsx,new/page.tsx,[id]/edit/page.tsx}`

- [ ] **Step 1**:
  - `page.tsx`(admin 인덱스): requireAdmin + 전체 교수 목록(서비스에 `listFacultyForAdmin()` 추가하거나 getFacultyDirectoryData의 members+cover) 테이블(이름·부서·커버여부·수정 링크) + `새 교수` 링크(/admin/faculty/new).
  - `EditorForm.tsx`(클라): name·title·en·degree·field·quote·office·hours 입력, dept·tone select, teaches textarea(줄바꿈 구분), years·papers·sortOrder number, isCover checkbox, about textarea. FacultyFormState 에러 표시.
  - `new/page.tsx`: requireAdmin + `<EditorForm action={createFaculty} submitLabel="교수 추가" />`.
  - `[id]/edit/page.tsx`: requireAdmin + getFacultyMemberForEdit + `<EditorForm action={updateFaculty.bind(null,id)} initial={...} submitLabel="수정 저장" />` + 삭제 폼(deleteFaculty.bind).
  - teaches 초기값은 join("\n").
- [ ] **Step 2**: `pnpm exec tsc --noEmit` + `pnpm build`(라우트 /admin/faculty, /admin/faculty/new, /admin/faculty/[id]/edit).
- [ ] **Step 3**: 커밋 `feat: 신학원교수 admin 목록·추가·수정 페이지`.

---

## Task 6: 디렉터리 페이지 배선

**Files:** Modify `web/src/app/faculty/page.tsx`, `FacultyDesktop.tsx`, `FacultyMobile.tsx`, `FeaturedHero.tsx`, `FilterStrip.tsx`

- [ ] **Step 1**: page.tsx 서버: `getFacultyDirectoryData()` → device 분기 → `FacultyDesktop`/`FacultyMobile`에 `cover`·`members`·`depts` props.
- [ ] **Step 2**: FacultyDesktop — props 받기. `FACULTY_MEMBERS`→`members`, dept 필터 클라 유지(activeDept). FeaturedHero에 cover, FilterStrip에 depts 전달. Grid/List에 filtered(members) 전달. QuoteStrip·ScheduleSection·SeminaryCTA 불변.
- [ ] **Step 3**: FeaturedHero — `cover: FacultyCover | null` prop 받아 FACULTY_COVER 대신 사용(null 가드). 마크업 불변.
- [ ] **Step 4**: FilterStrip — `depts: FacultyDeptItem[]` prop 받아 FACULTY_DEPTS 대신 사용. 마크업 불변.
- [ ] **Step 5**: FacultyMobile — 동일하게 cover·members·depts 배선. 정적 영역 보존.
- [ ] **Step 6**: `grep -rn "FACULTY_MEMBERS\|FACULTY_COVER\|FACULTY_DEPTS" src/app/faculty` → 교수 영역 제거 확인(FACULTY_TIMETABLE·FACULTY_QUOTES 잔존 정상).
- [ ] **Step 7**: `pnpm lint && pnpm build`.
- [ ] **Step 8**: 커밋 `feat: 신학원교수 디렉터리 DB 연동 배선 (마크업 보존)`.

---

## Task 7: seed + e2e + 리뷰 + PR

**Files:** Modify `web/scripts/dev-db.mjs`

- [ ] **Step 1**: dev-db faculty seed(멱등, `select 1 from faculty limit 1`). 커버 1명(isCover=true, about 포함) + 부서별 교수 several(FACULTY_MEMBERS mock 기반, teaches 배열, tone/dept). sortOrder 부여.
- [ ] **Step 2**: 회귀 `faculty:verify` + 기존 verify(committee/resource/board/training/webzine).
- [ ] **Step 3**: Preview e2e — 디렉터리(그리드/리스트 토글·부서 필터 DB), 커버 히어로, admin 교수 추가→목록→수정→삭제, 비admin /admin/faculty 가드, 시간표·인용·CTA 정적.
- [ ] **Step 4**: 최종 홀리스틱 리뷰 → 푸시+PR(승인 후).

## Self-Review
- 범위: 교수 그리드/리스트·필터·커버 DB, 시간표·인용·CTA 정적, 상세 없음. ✓
- 모델: 신규 faculty 테이블(enum 2·jsonb·isCover·about). ✓
- 보안: admin CRUD requireAdmin, 파라미터 바인딩. ✓
- 디자인 보존: 교수 영역만 props, 정적 영역·아바타 불변. ✓
- 타입: FacultyMember.id string, 매퍼/서비스/페이지 일관. ✓
