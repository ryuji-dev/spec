# training 이벤트 admin CRUD (2단계) — 설계

작성일: 2026-06-23
선행: 1단계(공개 읽기, PR #52 머지) — `events` 테이블·RLS·공개 `/training` 실데이터화 완료

## 목표

1단계에서 공개 읽기로 전환한 `events` 테이블을 admin이 직접 **생성·수정·삭제**할 수 있게 한다.
기존 도메인(notice·faculty·committee) admin 패턴을 그대로 따라 일관성을 유지한다.

비범위(이번 PR에서 하지 않음):
- 공개 `/training` 페이지의 admin 인라인 편집 진입점 — 디자인 보존(헌법[7]) 위해 넣지 않는다. 관리는 `/admin/events`로만.
- 신청(등록) 기능 — `registered`는 admin이 직접 입력하는 정적 운영 수치로 유지(1단계 결정 계승).

## 데이터 모델 (기존, 변경 없음)

`events` 테이블(1단계 마이그레이션 `20260623063356_events.sql`)을 그대로 사용한다. RLS도 적용 완료:
- `events_select`: `using (is_published)` — 공개 사용자는 공개 이벤트만
- `events_write`: `for all using (auth_is_admin()) with check (auth_is_admin())` — admin은 미공개 포함 전체 SELECT/INSERT/UPDATE/DELETE

→ **추가 마이그레이션 불필요.**

편집 대상 컬럼: `title`(필수), `subtitle`, `theme`, `category`, `badge`, `starts_at`(필수), `ends_at`(필수), `place`, `note`, `cover`, `capacity`, `registered`, `fee`, `deadline`, `participants`, `is_published`, `speakers`(jsonb), `schedule`(jsonb).

## 구성 요소

### 1. 라우트 (`src/app/(admin)/admin/events/`)

| 파일 | 역할 |
|------|------|
| `page.tsx` | 목록 표(제목·기간·상태·공개여부·수정 링크) + "새 이벤트" 버튼 |
| `new/page.tsx` | 생성 폼 (`requireAdmin` → `EditorForm action={createEvent}`) |
| `[id]/edit/page.tsx` | 수정 폼 + 삭제 폼 (`getEventForEdit` prefill) |
| `EditorForm.tsx` | `'use client'` 공용 폼 (동적 행 에디터 포함) |

추가: `admin/page.tsx` 대시보드에 "수련회 이벤트 관리 →" 링크 추가.

### 2. 서비스 (`src/server/services/training.ts`에 추가)

- `listEventsForAdmin()` — `is_published` 필터 없이 전체 조회(admin은 `events_write` RLS로 미공개도 SELECT 가능), `starts_at` 내림차순. 행마다 상태(예정/지난)를 `ends_at` 기준으로 파생해 평면 타입으로 반환.
- `getEventForEdit(id)` — 폼 prefill용. 전체 편집 필드 + `parseSpeakers`/`parseSchedule`로 변환한 배열. 날짜는 `isoToKstDate`로 "YYYY-MM-DD" 변환, `deadline`은 `date` 그대로.

### 3. 액션 (`src/server/actions/events.ts` 신설, `'use server'`)

- `createEvent(prev, formData)` / `updateEvent(id, prev, formData)` / `deleteEvent(id)`
- 각 진입부 `requireAdmin()` 재확인(헌법: 권한은 서버에서).
- zod 검증:
  - 기본 필드는 `FormData.get`으로 수집해 스키마 검증(title min 1, 숫자 필드 `z.coerce.number().int().min(0)` nullable, 날짜 문자열).
  - **speakers·schedule**: 클라이언트가 동적 행을 `JSON.stringify`해 hidden input(`name="speakers"`, `name="schedule"`)으로 제출 → 서버는 두 문자열을 `JSON.parse` 후 기존 `z.array(SpeakerSchema)` / `z.array(ScheduleDaySchema)`로 검증(검증 로직 재사용, 실패 시 한국어 오류 반환).
- 날짜 변환: `starts_at` = 입력일 00:00(KST), `ends_at` = 입력일 23:59(KST), `deadline` = `date` 문자열 그대로.
  - → `src/lib/datetime.ts`에 `kstDateStartToIso(dateStr)` 추가(`kstDateEndToIso`와 대칭, 00:00:00 KST).
- 반환: 성공 시 `createEvent`→`/admin/events/{id}/edit` redirect, `updateEvent`→`/admin/events` redirect, `deleteEvent`→`/admin/events` redirect. 실패 시 `{ error }` (기존 `PostFormState` 동형).

### 4. EditorForm 동적 에디터 (`'use client'`, `useState` + `useActionState`)

- 기본 필드:
  - input: title(필수)·subtitle·theme·category·badge·place·note·fee
  - select: cover (7종) — `COVER_KINDS`를 `@/lib/training`에서 export해 사용
  - number: capacity·registered·participants
  - date: starts(필수)·ends(필수)·deadline
  - checkbox: is_published(기본 체크)
- **강사(speakers)**: 이름·역할·소속·강의수 4칸짜리 행을 "+ 강사 추가 / × 삭제"로 동적 관리.
- **일정표(schedule)**: "일자 블록"(day·date)을 추가하고, 각 블록 안에 세션 행(time·what·place·tag·highlight 체크)을 "+ 세션 추가 / × 삭제"로 관리.
- speakers/schedule state는 변경 시 hidden input에 `JSON.stringify`로 직렬화(action에서 파싱).
- 스타일은 기존 admin 폼과 동일한 인라인 유틸리티 스타일(운영용 단순 UI).

## 보안

- RLS가 1차 경계(`events_write` = `auth_is_admin()`), 서버 액션 진입부 `requireAdmin()`가 2차 방어.
- `dangerouslySetInnerHTML` 미사용. 사용자 입력은 React가 escape.
- jsonb는 신뢰하지 않고 항상 zod 검증 후 저장.

## 검증 계획

로컬 Supabase(127.0.0.1 확인 후)에서:
1. `/admin/events` 진입(admin 로그인) → 빈 목록 확인
2. "새 이벤트"로 강사 2명·일정 2일(각 세션 여러 개) 포함 이벤트 생성 → 공개 `/training`에서 히어로·강사·일정표 노출 확인
3. 수정(필드·강사·세션 추가/삭제) → 반영 확인
4. `is_published` 해제 → 공개 `/training`에서 사라지고 `/admin/events` 목록엔 남는지 확인
5. 삭제 → 목록·공개 페이지에서 제거 확인
6. `pnpm lint` · `pnpm build` 통과
7. 시드/테스트 데이터 정리

## 작업 후

- admin 로그인은 비개발 운영자(노회 교육부 담당자) 사용을 전제로, 동적 행 UI가 직관적인지 확인.
