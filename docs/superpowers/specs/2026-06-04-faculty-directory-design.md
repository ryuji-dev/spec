# 신학원교수소개(faculty) — 설계 문서

작성일: 2026-06-04
대상 브랜치: `feat/faculty-directory`

## 배경 / 목표

마지막 섹션인 **신학원교수소개(faculty)** 를 DB 연동한다. 이 섹션은 게시판이 아니라 **교수진 디렉터리**(상세 페이지 없음, 카드에 정보 인라인)다. posts 패턴과 맞지 않아 **신규 `faculty` 테이블**을 도입한다. 교수 명단은 갱신 빈도가 낮지만, admin이 추가/수정/삭제할 수 있도록 전용 CRUD를 제공한다.

### 확정된 결정 (사용자 승인)
| 항목 | 결정 |
|------|------|
| 모델 | **신규 `faculty` 테이블** (posts 미사용) |
| 연동 범위 | 교수 그리드/리스트 + 부서 필터 + **커버 교수**(featured) |
| 정적 유지 | 시간표(ScheduleSection)·인용 스트립(QuoteStrip)·신학원 CTA(SeminaryCTA) |
| 작성·수정·삭제 | **admin 전용** (admin/faculty 인덱스 + new + edit) |
| 상세 페이지 | **없음** (디자인에 없음 — 카드 인라인) |
| 열람 | 공개 |

## 데이터 모델 — 신규 faculty 테이블

```
faculty
  id         uuid pk default random
  dept       faculty_dept not null      -- enum: ot/nt/st/pt/ch/mn (UI '전체'는 필터값, 저장 안 함)
  name       text not null
  title      text not null              -- 예: "구약학 교수"
  en         text not null              -- 예: "MOON, SEONG-JAE"
  degree     text not null
  tone       faculty_tone not null      -- enum: forest/olive/pine/sage (카드 색조)
  field      text not null              -- 전공 분야
  teaches    jsonb not null default '[]' -- string[] 담당 강좌
  quote      text not null
  years      integer not null default 0  -- 강의 연차
  papers     integer not null default 0  -- 저서·논문 수
  office     text not null
  hours      text not null
  isCover    boolean not null default false  -- 커버 스토리 교수(학장). 0~1명 권장
  about      text                        -- 커버 교수 소개 본문(긴 글). 일반 교수는 null
  sortOrder  integer not null default 0  -- 그리드 정렬
  createdAt  timestamptz not null default now()
```
- enum 2종(`faculty_dept`, `faculty_tone`)을 pgEnum으로 신설. 마이그레이션 생성.
- `init`(이름 첫 글자)은 저장하지 않고 매퍼에서 파생.

## 파생/매핑 (lib/faculty.ts, 순수)
- `FACULTY_DEPT_META`: 각 dept → {ko, en} (구약학/OLD TESTAMENT 등). FacultyDeptItem 카운트는 서비스가 채움.
- `FacultyRow`(DB 행) → `toFacultyMemberView(row)` → `FacultyMember`({id(number? — 디자인 타입은 number지만 DB는 uuid → 타입 string화 필요), dept, name, title, en, degree, init, tone, field, teaches, quote, years, papers, office, hours})
  - **타입 정합**: `FacultyMember.id` number→string, `FacultyTimetableItem`/`FacultyQuote` 등 정적 데이터는 유지.
- `toFacultyCoverView(row)` → `FacultyCover`({id, name, title, en, init, yearsKo=`${years}년차`, tag=COVER_TAG(정적 상수), quote, about=about??"", stats=[{years,"강의 연차"},{papers,"저서·논문"},{teaches.length,"담당 강좌"}], current=teaches})
- `COVER_TAG = "커버 스토리 · 2026 봄"` 정적 상수.

## 서비스 (server/services/faculty.ts, server-only)
- `getFacultyDirectoryData()` → `{ cover: FacultyCover | null, members: FacultyMember[], depts: FacultyDeptItem[] }`.
  - members: 전체 교수 sortOrder·createdAt 순. cover: isCover=true 첫 행(없으면 null).
  - depts: FACULTY_DEPT_META 순서로 카운트 + 전체(all) 카운트. (커버 교수도 멤버 목록·카운트에 포함할지 — 디자인상 커버는 별도 히어로이고 그리드엔 전체 14명. mock은 커버(강민준)가 members에 없음 → **커버는 그리드에서 제외**. 따라서 members = isCover=false, depts 카운트도 isCover=false 기준.)
- `getFacultyMemberForEdit(id)` → admin 편집용(전체 컬럼).

## 쓰기 (server/actions/faculty.ts, 'use server')
- `createFaculty` — `requireAdmin`, zod(name·title·en·degree·dept(enum)·tone(enum)·field·teaches(문자열→줄/쉼표 분할 string[])·quote·years(coerce int)·papers(coerce int)·office·hours·isCover(coerce bool)·about(optional)·sortOrder(coerce int)), insert, redirect `/admin/faculty`.
- `updateFaculty(id, ...)` — `requireAdmin`, update, redirect `/admin/faculty`.
- `deleteFaculty(id)` — `requireAdmin`, delete, redirect `/admin/faculty`.
- (isCover 단일성은 1차 미강제 — 운영자가 1명만 지정. 추후 강제 가능)

## 페이지
- `app/faculty/page.tsx`(서버): `getFacultyDirectoryData()` → `FacultyDesktop`/`FacultyMobile`에 `cover`·`members`·`depts` props. 시간표·인용·CTA는 컴포넌트 내 정적.
- 컴포넌트 배선: FeaturedHero(cover prop), FilterStrip(depts prop), FacultyGrid/FacultyList(members→profs, dept 필터는 클라 유지), FacultyMobile 동일. **마크업·아바타·tone·QuoteStrip·ScheduleSection·SeminaryCTA 불변**.
- 상세 페이지 없음.
- admin: `app/(admin)/admin/faculty/page.tsx`(교수 목록 테이블 + 수정 링크 + 새 교수 버튼), `new/page.tsx`, `[id]/edit/page.tsx`(EditorForm + 삭제 폼). EditorForm은 전 컬럼 입력(dept·tone select, teaches textarea, isCover 체크박스, about textarea).

## 재사용 / 신규
- 재사용: `server/auth/current-user`(requireAdmin), `lib/format`(필요 시).
- 신규: `server/db/schema/faculty.ts`(테이블+enum), 마이그레이션, `lib/faculty.ts`(매퍼·파생), `server/services/faculty.ts`, `server/actions/faculty.ts`, `app/(admin)/admin/faculty/{page,EditorForm,new,[id]/edit}`, verify-faculty.mjs. 수정: `app/faculty/page.tsx`·`FacultyDesktop`·`FacultyMobile`·`FeaturedHero`·`FilterStrip`(props 배선), `faculty-data.ts`(FacultyMember.id string).
- **불사용**: posts·comments·attachments·post_likes.

## 검증
- `pnpm lint`/`build`, `faculty:verify`(매퍼·cover 파생·dept 메타), 기존 verify 회귀.
- 마이그레이션 PGlite 적용 확인, dev-db faculty seed(커버 1 + 부서별 교수 several, mock 기반).
- Preview e2e: 디렉터리(그리드/리스트 토글·부서 필터 DB), 커버 히어로, admin 교수 추가/수정/삭제, 비admin 가드. 시간표·인용·CTA 정적 표시.

## 범위 밖 (후속)
- isCover 단일성 DB 강제, 시간표·인용 DB화, 교수 상세 페이지·사진 업로드.
- 실제 Oracle VM 배포(다음 작업).
