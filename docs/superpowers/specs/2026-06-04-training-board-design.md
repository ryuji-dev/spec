# 교역자수련회(training) 게시판 — 설계 문서

작성일: 2026-06-04
대상 브랜치: `feat/training-board`

## 배경 / 목표

자유게시판(board)까지 DB 연동이 끝났다. 다음으로 **교역자수련회(training)** 섹션의 **게시물 목록(board)** 을 DB 연동한다. training은 committee와 구조가 가장 유사한 **공개 안내 게시판**(admin이 작성, 누구나 열람)이며, committee/resource에서 확립한 **뷰모델 서비스 계층 + 첨부 + 댓글 + admin CRUD** 패턴을 거의 그대로 복제한다.

### 확정된 결정 (사용자 승인)
| 항목 | 결정 |
|------|------|
| 연동 범위 | **게시물 목록(TR_BOARD)만** DB 연동 |
| 이벤트 콘텐츠 | Hero(TR_UPCOMING)·일정표(TR_SCHEDULE)·강사(TR_SPEAKERS)·예고(TR_NEXT)·지난수련회(TR_PAST)·아카이브(TR_ARCHIVE)는 **mock 정적 유지** |
| DB | 기존 `posts` 테이블 `section='training'` 사용 (스키마 변경 없음) |
| 카테고리 | 예정/신청/후기/강의자료/Q&A (5종) |
| 작성·수정·삭제 | **admin 전용** (committee 선례) |
| 첨부 | 기존 `attachments` + `server/uploads/core` 팩토리 + 공용 `AttachmentManager` 재사용 |
| 댓글 | 기존 `comments` 인프라 재사용 — `comments.ts`의 `SECTION_PATH`에 `training` 추가 |
| 열람 | 공개 (proxy 가드 없음 — committee와 동일) |

## 아키텍처 — committee 패턴 복제

`posts`(section='training') + `attachments`(재사용) + `comments`(재사용). 순수 매퍼(`lib/training.ts`)가 DB행 → 디자인 `TrainingPost` 뷰모델로 변환. 목록 페이지(서버 컴포넌트)가 서비스 호출 → **게시물 영역에만** props 주입(이벤트 콘텐츠는 mock 유지). admin이 `/admin/training`에서 작성/수정/삭제, 첨부는 `/api/training/*` Route Handler.

### 데이터 모델 (posts, section='training')
- `category`: 예정 / 신청 / 후기 / 강의자료 / Q&A
- `title`, `excerpt`, `body`, `authorId`, `viewCount`, `isPublished`(기본 true), `isPinned`, `createdAt`
- (eventDate·meta 미사용 — 이벤트 정보는 mock 정적)

### 뷰모델 매핑 (lib/training.ts, 순수)
- `CATEGORY_EN`: 예정→UPCOMING, 신청→OPEN, 후기→REVIEW, 강의자료→MATERIALS, Q&A→QNA
- `TRAINING_CATEGORIES_KO`: 5종
- `TrainingRow`(DB 평면 행) → `toTrainingPostView(row, now)` → `TrainingPost`({id, cat, catEn, title, excerpt, author, authorInit, date, views, comments, attach?, isNew?})
  - author: `formatAuthor(name, title)`; authorInit: 이름 첫 글자; date: `formatDate`; isNew: 7일 이내; attach: attachCount>0이면 수

### 서비스 (server/services/training.ts, server-only)
- `getTrainingListData()` → `{ pinned, posts, categories, popular }` — section='training' AND isPublished, 댓글·첨부 수 집계, isPinned·최신순, 카테고리 카운트, 인기글 top N. (committee getCommitteeListData와 동일 구조)
- `getTrainingPost(id)` → 상세(글+첨부+댓글) | null. viewCount++.
- `incrementTrainingView(id)`.
- `getTrainingPostForEdit(id)` → admin 편집용(isPublished 필터 없음, 첨부 포함).

### 쓰기 (server/actions/training.ts, 'use server')
- `createPost` — `requireAdmin`, zod(title·category(예정 등 5종)·excerpt·body·isPinned), insert section='training', redirect `/admin/training/${id}/edit`(첨부 단계).
- `updatePost(id, ...)` — `requireAdmin`, zod, update, redirect `/training/${id}`.
- `deletePost(id)` — `requireAdmin`, `deletePostFiles(id)`(디스크 정리) + posts delete(cascade), redirect `/training`.

### 업로드 (server/uploads/training.ts + lib/training-upload.ts)
- `lib/training-upload.ts`: `TRAINING_UPLOAD` 정책(committee와 동일 확장자/용량) + `preCheck`/`resolveMime`/`extOf` 래퍼.
- `server/uploads/training.ts`: `createAttachmentStore({ uploadDir: uploads/training, section: 'training', policy: TRAINING_UPLOAD, ... })` → `uploadPath`/`storeAttachment`/`deleteAttachment`/`deletePostFiles`.
- Route Handler: `/api/training/[postId]/uploads`(POST, admin), `/api/training/attachments/[id]`(DELETE, admin), `/api/training/files/[id]`(GET, inline/attachment). committee 라우트와 동일 패턴.

### 페이지
- `app/training/page.tsx`: 서버에서 `getTrainingListData()` 호출 → 디바이스 분기 → `TrainingDesktop`/`TrainingMobile`에 **게시물 영역 props**(posts·categories·popular·pinned) 주입. 이벤트 영역(Hero·Schedule·Speakers·Next·Past·Archive)은 mock 그대로.
- 컴포넌트 배선: PostCard·PostListRow·FilterBar·Sidebar(게시물·카테고리·인기글) mock→props. **마크업 보존**. Hero/Schedule/Speakers/Past/Archive 컴포넌트는 손대지 않음.
- 상세 `app/training/[id]/page.tsx`(신규 최소 화면, committee 상세와 동일): 제목·작성자·본문·첨부 다운로드·조회수 + admin 수정/삭제 + 댓글(CommentForm 재사용).
- admin `app/(admin)/admin/training/new/page.tsx`·`[id]/edit/page.tsx`: `requireAdmin`, EditorForm(training 카테고리) + AttachmentManager(apiBase=`/api/training`, policy=TRAINING_UPLOAD) + 삭제 폼.

## 재사용 (수정 없음)
`lib/format.ts`, `lib/upload-policy.ts`, `server/uploads/core.ts`, `server/auth/current-user.ts`(requireAdmin), `app/_components/AttachmentManager.tsx`, `server/actions/comments.ts`(SECTION_PATH에 training 추가만), `app/committee/_components/CommentForm.tsx`, DB 테이블(posts·attachments·comments).

## 신규 작성
`lib/training.ts`, `lib/training-upload.ts`, `server/uploads/training.ts`, `server/services/training.ts`, `server/actions/training.ts`, `app/training/[id]/page.tsx`, `app/(admin)/admin/training/EditorForm.tsx`(또는 committee EditorForm 일반화), `.../new/page.tsx`, `.../[id]/edit/page.tsx`, `app/api/training/[postId]/uploads/route.ts`, `app/api/training/attachments/[id]/route.ts`, `app/api/training/files/[id]/route.ts`. 수정: `app/training/page.tsx`, training 게시물 컴포넌트(PostCard·PostListRow·FilterBar·Sidebar·TrainingDesktop·TrainingMobile), `server/actions/comments.ts`(SECTION_PATH).

## 검증
- `pnpm lint`/`build`, training 매퍼 verify(`training:verify` 신설), 기존 verify 회귀(committee/resource/board).
- dev-db에 training seed 추가(멱등).
- Preview e2e: training 목록(DB 글)·상세·첨부 다운로드·댓글, admin 작성/첨부/수정/삭제. 비admin은 작성 차단. 이벤트 콘텐츠(Hero 등) 정상 표시(정적).

## 범위 밖 (후속)
- 이벤트 정보(수련회 일정·강사·신청 현황·지난수련회) DB화, 수련회 신청(등록/정원/마감) 기능.
- 남은 섹션(신학원웹진·교수소개), 실제 VM 배포.
