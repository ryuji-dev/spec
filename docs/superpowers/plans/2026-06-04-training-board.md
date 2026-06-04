# 교역자수련회(training) 게시판 DB 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development 또는 executing-plans. 본 plan은 committee 섹션을 **소스 오브 트루스**로 삼아 training으로 복제한다. 각 태스크에서 명시된 committee 원본 파일을 읽고, 아래 **치환 규칙**을 적용해 옮긴다.

**Goal:** 교역자수련회(training) 섹션의 게시물 목록을 DB 연동한다 — committee 패턴(뷰모델 서비스 + 첨부 + 댓글 + admin CRUD) 복제, 이벤트 콘텐츠는 mock 유지.

**Architecture:** posts(section='training') + attachments/comments 재사용. 순수 매퍼 → 서비스 → 서버 페이지 props(게시물 영역만) → 디자인 컴포넌트 마크업 보존.

**Tech Stack:** Next.js 16, Drizzle/postgres-js, zod, 공용 업로드 코어(`server/uploads/core`)·`AttachmentManager`·comments.

---

## 공통 치환 규칙 (committee → training)
| committee | training |
|-----------|----------|
| `section = "committee"` | `section = "training"` |
| 카테고리 공지/회의록/수련회/자료실/나눔 (NOTICE/MINUTES/TRAINING/LIBRARY/SHARE) | 예정/신청/후기/강의자료/Q&A (UPCOMING/OPEN/REVIEW/MATERIALS/QNA) |
| `COMMITTEE_CATEGORIES_KO`, `CATEGORY_EN` | `TRAINING_CATEGORIES_KO`, `CATEGORY_EN` |
| `/committee`, `/admin/committee`, `/api/committee` | `/training`, `/admin/training`, `/api/training` |
| `uploads/committee` | `uploads/training` |
| `COMMITTEE_UPLOAD` | `TRAINING_UPLOAD` |
| `getCommittee*` | `getTraining*` |

**디자인 보존**: training 게시물 컴포넌트(PostCard·PostListRow·FilterBar·Sidebar·TrainingDesktop·TrainingMobile)는 mock→props·라우팅만. Hero/Schedule/Speakers/Next/Past/Archive 컴포넌트는 **손대지 않는다**.

---

## Task 1: comments SECTION_PATH에 training 추가

**Files:** Modify `web/src/server/actions/comments.ts`

- [ ] **Step 1**: `SECTION_PATH` 맵에 `training: "/training"` 추가.
- [ ] **Step 2**: `cd web && pnpm exec tsc --noEmit` (에러 없음).
- [ ] **Step 3**: 커밋 `chore: 댓글 SECTION_PATH에 training 경로 추가`.

---

## Task 2: 매퍼 lib/training.ts + verify

**Files:** Create `web/src/lib/training.ts`, `web/scripts/verify-training.mjs`; Modify `web/package.json`(scripts), `web/src/lib/training-data.ts`(필요시 id string화)

- [ ] **Step 1**: `web/src/lib/committee.ts`를 읽고 `lib/training.ts`로 복제. 치환:
  - `CATEGORY_EN`: 예정→UPCOMING, 신청→OPEN, 후기→REVIEW, 강의자료→MATERIALS, "Q&A"→QNA
  - `TRAINING_CATEGORIES_KO = ["예정","신청","후기","강의자료","Q&A"]`
  - `TrainingRow`(committee의 CommitteeRow와 동일 필드: id·category·title·excerpt·viewCount·createdAt·authorName·authorTitle·commentCount·attachCount)
  - `toTrainingPostView(row, now): TrainingPost` (committee 로직 그대로, 타입만 training-data의 `TrainingPost`)
  - import 타입은 `./training-data`의 `TrainingPost`·`TrainingCategoryKo`·`TrainingCategoryEn` 사용. `formatDate`·`formatAuthor`는 `./format.ts`.
- [ ] **Step 2: id 타입 정합** — `training-data.ts`의 `TrainingPost.id`가 `number`다(현재 mock). DB는 uuid(string). `TrainingPost.id`를 `string`으로 바꾸고 mock 상수(`TR_BOARD`의 id)를 문자열로(`11`→`"11"` 등) 변경. `TR_PAST.id`(number)는 이벤트 정적이라 유지(매퍼 무관).
- [ ] **Step 3: verify** — `web/scripts/verify-committee.mjs`를 본떠 `verify-training.mjs` 작성(카테고리 EN 맵·매퍼 필드·isNew·폴백 검증). `package.json`에 `"training:verify": "node scripts/verify-training.mjs"`.
- [ ] **Step 4**: `pnpm training:verify` 통과, `pnpm exec tsc --noEmit`.
- [ ] **Step 5**: 커밋 `feat: 교역자수련회 순수 매퍼·카테고리 맵 추가`.

---

## Task 3: 업로드 정책·모듈 (training-upload, uploads/training)

**Files:** Create `web/src/lib/training-upload.ts`, `web/src/server/uploads/training.ts`

- [ ] **Step 1**: `web/src/lib/committee-upload.ts`를 읽고 `lib/training-upload.ts`로 복제. `COMMITTEE_UPLOAD`→`TRAINING_UPLOAD`(allowedExt·용량 동일), `preCheck`/`resolveMime`/`extOf` 래퍼 그대로.
- [ ] **Step 2**: `web/src/server/uploads/committee.ts`를 읽고 `server/uploads/training.ts`로 복제. `createAttachmentStore({ uploadDir: uploads/training, section: "training", policy: TRAINING_UPLOAD, ...메시지 })`. export(uploadPath/storeAttachment/deleteAttachment/deletePostFiles/UploadError/StoredAttachment) 동일.
- [ ] **Step 3**: `pnpm exec tsc --noEmit`.
- [ ] **Step 4**: 커밋 `feat: 교역자수련회 업로드 정책·저장 모듈 추가`.

---

## Task 4: 서비스 server/services/training.ts

**Files:** Create `web/src/server/services/training.ts`

- [ ] **Step 1**: `web/src/server/services/committee.ts`를 읽고 `services/training.ts`로 복제. `SECTION="training"`, 매퍼·타입을 training 것으로 교체. 함수: `getTrainingListData`/`getTrainingPost`/`incrementTrainingView`/`getTrainingPostForEdit`. 반환 타입(TrainingListData/TrainingDetail/TrainingEditData) 정의. 댓글 수 집계는 alias-safe 리터럴(`c.post_id`), 첨부 수도 동일 패턴.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 교역자수련회 목록·상세 서비스 추가`.

---

## Task 5: 액션 server/actions/training.ts

**Files:** Create `web/src/server/actions/training.ts`

- [ ] **Step 1**: `web/src/server/actions/committee.ts`를 읽고 `actions/training.ts`로 복제. `requireAdmin`, zod(category=TRAINING_CATEGORIES_KO), `createPost`(insert section='training', redirect `/admin/training/${id}/edit`), `updatePost`(redirect `/training/${id}`), `deletePost`(`deletePostFiles` from `@/server/uploads/training`, redirect `/training`). `PostFormState` export.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 교역자수련회 admin 작성·수정·삭제 Server Action`.

---

## Task 6: 업로드 Route Handler 3종

**Files:** Create `web/src/app/api/training/[postId]/uploads/route.ts`, `web/src/app/api/training/attachments/[id]/route.ts`, `web/src/app/api/training/files/[id]/route.ts`

- [ ] **Step 1**: committee의 동일 3개 라우트(`web/src/app/api/committee/...`)를 읽고 training으로 복제. import를 `@/server/uploads/training`으로, admin 가드·isUuid·응답 스키마({ok,data}/{ok,error}) 동일. files 라우트는 attachments 테이블 조회 + `uploadPath`(training) 사용.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 교역자수련회 첨부 업로드·삭제·파일 Route Handler`.

---

## Task 7: 상세 페이지 training/[id]/page.tsx

**Files:** Create `web/src/app/training/[id]/page.tsx`

- [ ] **Step 1**: `web/src/app/committee/[id]/page.tsx`를 읽고 training으로 복제. `getTrainingPost`/`incrementTrainingView`, 첨부 다운로드 링크 `/api/training/files/${a.id}`, admin 수정 링크 `/admin/training/${id}/edit`, 삭제 폼 `deletePost`(training), 댓글: 공용 `CommentForm`(postId) + `deleteComment` 재사용. `← 교역자수련회` 링크는 `/training`.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 교역자수련회 상세 페이지(첨부·댓글·admin 수정삭제)`.

---

## Task 8: admin 페이지 (EditorForm·new·edit)

**Files:** Create `web/src/app/(admin)/admin/training/EditorForm.tsx`, `.../new/page.tsx`, `.../[id]/edit/page.tsx`

- [ ] **Step 1**: committee admin(`web/src/app/(admin)/admin/committee/`)의 EditorForm·new·edit를 읽고 training으로 복제.
  - EditorForm: 카테고리 select를 `TRAINING_CATEGORIES_KO`로. (committee EditorForm이 카테고리를 prop으로 받지 않고 하드코딩이면, training 전용 EditorForm을 둔다 — committee 회귀 방지.)
  - new: `requireAdmin` + `<EditorForm action={createPost} submitLabel="저장하고 첨부하기" />`.
  - edit: `requireAdmin` + `getTrainingPostForEdit` + `<EditorForm action={updatePost.bind(null,id)} initial={...} />` + `<AttachmentManager postId={id} initial={post.attachments} apiBase="/api/training" policy={TRAINING_UPLOAD} />` + 삭제 폼(`deletePost.bind(null,id)`).
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 교역자수련회 admin 작성·수정 페이지(첨부 관리 포함)`.

---

## Task 9: 목록 페이지 배선 (training/page.tsx + 게시물 컴포넌트)

**Files:** Modify `web/src/app/training/page.tsx`, `web/src/app/training/_components/desktop/TrainingDesktop.tsx`, `.../PostCard.tsx`, `.../PostListRow.tsx`, `.../FilterBar.tsx`, `.../Sidebar.tsx`, `.../mobile/TrainingMobile.tsx` (게시물 영역에 관련된 것만)

- [ ] **Step 1**: 현재 `training/page.tsx`와 `TrainingDesktop`/`TrainingMobile`을 읽어 게시물 영역이 어떤 mock(TR_BOARD·TR_CATEGORIES 등)을 쓰는지 파악.
- [ ] **Step 2**: committee `page.tsx`(서비스 호출 + 디바이스 분기 + props 주입)를 참고해 `training/page.tsx`를 서버 컴포넌트로: `getTrainingListData()` → `TrainingDesktop`/`TrainingMobile`에 게시물 props(posts·categories·popular·pinned 해당하는 것) 주입. **이벤트 콘텐츠 props는 추가하지 않음**(컴포넌트가 mock 그대로 사용).
- [ ] **Step 3**: TrainingDesktop/Mobile + 하위 게시물 컴포넌트의 게시물 영역만 mock→props. PostCard/PostListRow onClick → `/training/${id}` 라우팅(committee 카드 패턴 참고). FilterBar·Sidebar 카테고리/인기글 props. **마크업·style·className·이벤트 컴포넌트 불변**.
- [ ] **Step 4**: `grep -rn "TR_BOARD\|TR_CATEGORIES\|TR_POPULAR" src/app/training` → 게시물 영역에서 mock 제거 확인(이벤트 mock TR_UPCOMING/SCHEDULE/SPEAKERS/NEXT/PAST/ARCHIVE는 잔존 정상).
- [ ] **Step 5**: `pnpm lint && pnpm build` (라우트표 `ƒ /training`, `ƒ /training/[id]`, `/admin/training/*`, `/api/training/*`).
- [ ] **Step 6**: 커밋 `feat: 교역자수련회 목록 DB 연동 배선 (마크업 보존)`.

---

## Task 10: dev-db seed + 통합 검증 + PR

**Files:** Modify `web/scripts/dev-db.mjs`

- [ ] **Step 1**: dev-db에 training seed 추가(멱등, `select 1 from posts where section='training'`). 카테고리별 글 몇 개(강의자료엔 첨부 placeholder 1개 — resource seed 패턴 참고), 작성자 adminId. `uploads/training/` 디렉터리 생성.
- [ ] **Step 2: 회귀 verify** — `pnpm training:verify && pnpm committee:verify && pnpm resource:verify && pnpm board:verify` 모두 통과.
- [ ] **Step 3: Preview e2e** — dev:db + web-dev. 확인:
  - `/training` 목록에 seed 글 표시(카테고리·첨부·조회수), 이벤트 콘텐츠(Hero·일정·강사) 정상 표시(정적).
  - 카드 클릭 → `/training/[id]` 상세(본문·첨부 다운로드·댓글).
  - 회원 로그인 → 댓글 작성/삭제(section-aware redirect `/training/[id]`).
  - admin 로그인 → `/admin/training/new` 작성 → 첨부 업로드 → `/training/[id]` 노출. 수정·삭제.
  - 비admin은 `/admin/training/*` 가드(리다이렉트), 업로드 API 403.
  - 회귀: committee/board 정상.
- [ ] **Step 4: 최종 홀리스틱 리뷰**(서브에이전트) → 블로커 없으면 푸시+PR(사용자 승인 후).

---

## Self-Review 체크
- **범위**: 게시물만 DB, 이벤트 콘텐츠 mock 유지. ✓
- **재사용**: comments(SECTION_PATH+training)·attachments·uploads/core·AttachmentManager·CommentForm·upload-policy. ✓
- **신규**: 매퍼·업로드정책·업로드모듈·서비스·액션·라우트3·상세·admin3·페이지배선. ✓
- **보안**: 작성/수정/삭제·업로드 admin 재확인(requireAdmin + API 403), 파라미터 바인딩, 실 MIME 검사(core), 파일명 재생성. ✓
- **디자인 보존**: 게시물 컴포넌트만 mock→props, 이벤트 컴포넌트 불변. ✓
- **타입 정합**: TrainingPost.id string화, 서비스/매퍼/페이지 일관. ✓
