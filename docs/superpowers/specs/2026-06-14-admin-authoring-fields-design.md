# admin 작성 폼 보강 — 메인 실데이터 입력 경로 (설계)

> 작성일 2026-06-14 · 범위: `/main`이 읽는 **공지·일정**을 admin이 실제로 입력·관리할 수 있게 한다. 사진 실이미지는 별도 후속.

## 배경

`/main`은 `getHomeData()`(`src/server/services/home.ts`)로 posts에서 다음을 읽는다.
- **공지**: `section='notice'` 최신 1건의 제목
- **일정**: `event_date >= now()` 인 글(오름차순 4건), 장소는 `meta.location`
- 사진: 최신 글 메타(이번 범위 아님)

그러나 현재 admin 작성 경로에는 **공지(notice) 작성 수단이 전혀 없고**, 작성 액션(`training.ts`·`committee.ts` 등)은 `event_date`·`meta.location`을 받지 않는다. 따라서 운영에 배포해도 공지·일정 섹션은 (시드 없이는) 항상 비어 있다. 이 설계는 그 입력 경로를 만든다.

## 현재 상태 (확인됨)

- 섹션별 에디터: `committee`·`faculty`·`resources`·`training`·`webzine`에 `EditorForm.tsx` + `new`/`[id]/edit` 라우트. notice·board 에디터는 없음(board는 회원 작성).
- 작성 액션(`src/server/actions/<section>.ts`): zod `postSchema`(title·category·excerpt·body·isPinned) → posts insert/update, `section` 고정, `requireAdmin` + RLS.
- `training.ts`·`committee.ts`는 동일 패턴(카테고리 enum만 다름).
- admin 홈(`src/app/(admin)/admin/page.tsx`): 인라인 스타일 섹션 구성(계정 생성·비밀번호 재설정·문의함 링크).
- posts 컬럼에 `event_date timestamptz`·`meta jsonb` 이미 존재 → **마이그레이션 불필요**.

## 결정 사항 (브레인스토밍 결과)

1. **공지 = 옵션 A(메인 공지 한 줄 관리)**. 공개 `/notice` 페이지가 없고 소비처가 `/main` 한 줄뿐이라, notice 글을 싱글톤으로 관리한다(YAGNI). 추후 공지 이력이 필요하면 공개 페이지와 함께 CRUD로 확장하며, 데이터는 호환된다.
2. **일정 필드 = 옵션 B(training + committee)**. `/main` 일정에 자연스러운 콘텐츠는 수련회/대회(training)와 정기모임/회의(committee). webzine·resource·board는 행사가 아니라 제외.
3. **일정 입력 단위 = 날짜만**. `/main`은 `MM.DD`·요일만 표시하므로 시간 입력 불필요. 같은 날 종일 "다가오는 일정"에 남도록 **KST 당일 23:59:59**로 저장한다.

## 구성 요소

### 1) 메인 공지 한 줄 관리 (옵션 A)

- **액션** — `src/server/actions/notice.ts` (`'use server'`, `import 'server-only'`는 액션 파일엔 불필요):
  - `setAnnouncement(prev, formData)`: zod로 `text`(trim, 1자 이상, 상한 예: 200자) 검증 → notice 글이 있으면 최신 1건의 `title` 갱신, 없으면 1건 insert(`section:'notice'`, `is_pinned:false`, `author_id`). `requireAdmin` 재확인. `revalidatePath('/main')`·`/admin`.
  - `clearAnnouncement(prev, formData)`: notice 글(들) 삭제 → 공지 strip 미표시. `requireAdmin`. `revalidatePath`.
  - 싱글톤 유지: insert 전에 기존 notice를 조회하여 1건이면 update, 0건이면 insert. (다건이 우연히 생겨도 set은 최신 1건 갱신, clear는 전체 삭제로 수렴.)
- **서비스(읽기)** — admin 홈 표시용 현재 공지 조회: 기존 `getHomeData`의 notice 쿼리와 동일 조건으로 admin 홈 page에서 직접 조회(또는 작은 헬퍼). 별도 공개 노출 없음.
- **UI** — `src/app/(admin)/admin/AnnouncementForm.tsx`(client): 현재 공지 표시 + 입력란 + "저장"/"공지 내리기". admin 홈(`page.tsx`)에 "메인 공지" 섹션으로 삽입. 기존 인라인 스타일 톤 유지.
- **`/main` 변경 없음**(이미 notice 최신 1건을 읽음).

### 2) 일정 필드(`event_date`·장소) — training + committee (옵션 B)

- **폼** — `training/EditorForm.tsx`·`committee/EditorForm.tsx`에 선택 입력 2개 추가:
  - `event_date`: `<input type="date" name="eventDate">` (비우면 일정 아님)
  - `location`: `<input type="text" name="location">` (장소)
  - 수정 화면에서는 기존값 prefill: `event_date`(ISO) → `YYYY-MM-DD`(KST), `meta.location` → 텍스트.
- **액션** — `training.ts`·`committee.ts`의 `postSchema`/`parse`/insert/update 확장:
  - `eventDate`: zod `string` optional. 값이 있으면 `YYYY-MM-DD`를 **KST 23:59:59 → ISO(timestamptz)** 로 변환 저장, 비면 `null`.
  - `location`: zod `string` optional(trim). 저장은 `meta`에 머지(`{ ...기존meta, location }`), 비면 `location` 키 제거. 다른 `meta` 키 보존.
  - update 시 기존 `meta`를 먼저 읽어 머지(덮어쓰기 방지). insert는 새 `meta`.
- **호환**: 두 필드 optional → 기존 글·행사 아닌 글 영향 없음. 카테고리·기타 필드 불변.

### 날짜 변환 헬퍼

- `YYYY-MM-DD` + KST 23:59:59 → ISO 변환은 공용 유틸로 둔다(예: `src/lib/datetime.ts`의 `kstDateEndToIso(dateStr): string`). 역변환(`isoToKstDate(iso): string`)도 prefill용으로 함께. 순수 함수(클라이언트·서버 공용 가능, `src/lib`).

## 보안

- 운영 스키마 변경 없음. 모든 쓰기는 `requireAdmin` + RLS(posts admin write 정책) 이중 방어. service-role 미사용.
- notice 싱글톤 조작도 RLS admin 정책 하에서만 가능.
- 입력은 zod 검증(길이 상한·trim). XSS: 제목·장소는 텍스트로 렌더(dangerouslySetInnerHTML 미사용).

## 검증 (lint/build + 로컬)

- admin 로그인 → "메인 공지" 저장/수정/내리기 → `/main` 공지 strip 반영·해제 확인.
- training·committee 글에 `event_date`(미래)·장소 입력 → `/main` "다가오는 일정"에 날짜·요일·장소·태그 반영, 정렬 확인.
- 빈/경계: 공지 없음 → strip 미표시. event_date 없는 글 → 일정 미포함. 과거 event_date → 미포함. 당일 event_date → 종일 표시.
- 기존 글(필드 없이 작성된) 수정 시 일정 필드 공란으로 정상 동작.
- `pnpm lint && pnpm build`.

## 범위 밖 (후속)

- 사진타일 실이미지(공개 이미지 전략·서명 URL).
- 히어로 슬라이드 admin 관리.
- 공지 이력·공개 `/notice` 페이지(옵션 B 확장 시).
- faculty/resources/webzine 등 다른 섹션의 일정 필드(현재 불필요).
