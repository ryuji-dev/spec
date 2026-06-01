# 교육위원회 게시판 — 설계 문서 (Phase 4 첫 슬라이스)

작성일: 2026-06-01
대상 브랜치: `feat/committee-board`

## 배경 / 목표

Phase 3(인증)이 완료됐다. Phase 4는 7개 콘텐츠 섹션의 mock 데이터를 실제 DB로 교체하는 큰 작업이라, **한 섹션을 수직 슬라이스로 먼저 완성하고 그 패턴을 다른 섹션에 확장**한다.

첫 대상은 **교육위원회 게시판**(`committee`). 공지·회의록 중심의 표준 게시판으로, 이미 만든 `posts` 스키마와 거의 1:1이며 노회 교육 행정 포털의 핵심이다.

### 확정된 결정 (사용자 승인)

| 항목 | 결정 |
|------|------|
| 읽기 권한 | **누구나 공개** (비로그인 포함) |
| 쓰기·수정·삭제 | **admin 전용** |
| 본문 형식 | **일반 텍스트**(줄바꿈 보존, `whitespace-pre-wrap`). HTML 미사용 → XSS 차단 |
| 댓글 | **로그인 회원**(admin·member) 작성 / **작성자 본인 또는 admin** 삭제 / 비로그인 읽기 |
| 첨부 | 이미지·문서 **다수**(한 이벤트에 수십 장). 한도는 아래 |
| 신규 화면(상세·에디터·댓글) | **최소 기능 페이지 먼저**. 기존 목록 페이지는 마크업 변경 없이 mock→DB만 교체. 추후 Claude Design 폴리시 교체 |

## 아키텍처 — 접근법 A (뷰모델 서비스 계층)

디자인의 `Post`·사이드바 **타입을 계약으로 유지**하고, `server/services/committee.ts`가 Drizzle로 DB를 조회해 **동일 shape로 매핑**해 반환한다. 목록 페이지(서버 컴포넌트)는 mock 상수 대신 이 서비스를 호출 → **마크업·Tailwind 0 변경**(헌법 보존). CLAUDE.md 데이터 경로 1순위(서버 컴포넌트 → 서비스 → DB)와 일치.

> 기각된 대안: (B) 컴포넌트가 정규화 DB 타입을 직접 소비 → 이식 마크업 대거 변경, 디자인 드리프트 위험. (C) 목록도 Route Handler+클라이언트 fetch → 서버 컴포넌트 직접 조회가 더 단순. fetch는 업로드처럼 꼭 필요할 때만.

## 데이터 모델 (Drizzle 마이그레이션)

### posts (기존 테이블 활용)
- `section = 'committee'`로 한정.
- 사용 컬럼: `category`(공지/회의록/수련회/자료실/나눔), `title`, `excerpt`, `body`(plain text), `authorId`(FK users), `viewCount`, `createdAt`, `isPublished`.
- **추가 컬럼**: `isPinned boolean not null default false` — 고정글(`BD_PINNED`) 대응. (신규 마이그레이션)

### comments (신규 테이블)
```
id          uuid pk default random
postId      uuid not null FK → posts(id) ON DELETE CASCADE
authorId    uuid FK → users(id) ON DELETE SET NULL
body        text not null
createdAt   timestamptz not null default now()
```
인덱스: `(postId, createdAt)`.

### attachments (기존 테이블 활용)
- `postId`(FK posts, ON DELETE CASCADE), `originalName`, `storedName`(서버 재생성), `mime`, `sizeBytes`(bigint).
- 이미지 다수 첨부 대응 — 게시물당 여러 행.

## 읽기 경로 (공개)

`server/services/committee.ts` (server-only):
- `listPosts({ category?, page })` → `{ pinned, posts, totalPages }`
- `getPost(id)` → 상세 뷰모델 (본문·첨부·댓글 포함)
- `getCategoryCounts()` → `BD_CATEGORIES` 형태
- `getPopular()` → `BD_POPULAR` 형태 (viewCount 상위)

### DB 행 → 디자인 `Post` 뷰모델 매핑
- `catEn`: KO→EN 맵(`공지→NOTICE` …) — `lib/`의 순수 맵.
- `author`: `${users.name} ${users.title}` (예: "한경수 목사"), `authorInit`: `name[0]`.
  - 비고: 원본 mock의 "교육위원장/총무/서기" 같은 **위원회 직책 접두어**는 현재 스키마에 없어 1차에서는 생략. 추후 직책 필드 도입 시 보강.
- `date`: `createdAt` → `"YYYY.MM.DD"`.
- `views`: `viewCount`. `comments`: 댓글 수(집계). `attach`: 첨부 수(집계).
- `isNew`: `createdAt`이 최근 7일 이내.

### 페이지 배선
- `app/committee/page.tsx`(서버 컴포넌트): 서비스 호출로 mock 교체. 컴포넌트(행/카드/페이지네이션/사이드바) **그대로**.
- **태그(`BD_TAGS`)·작성자 사이드바(`SIDE_AUTHORS`)는 장식**이라 1차에서는 정적 유지(추후 집계로 전환).
- 페이지네이션: offset 기반(`page` 쿼리 파라미터).

### 상세 페이지 (신규 최소 화면)
- `app/committee/[id]/page.tsx`: 제목·메타(작성자·날짜·조회)·본문(`whitespace-pre-wrap`)·첨부 목록(이미지면 썸네일)·댓글 영역.
- 진입 시 `viewCount` 1 증가.

## 쓰기 경로 (admin 전용)

`server/actions/committee.ts` (`'use server'`):
- `createPost`, `updatePost`, `deletePost` — 진입부 `requireAdmin()`, zod 검증, Drizzle.
- 삭제 시 댓글·첨부는 FK `ON DELETE CASCADE`로 함께 제거(저장 파일도 디스크에서 정리).

에디터 (신규 최소 화면):
- `app/(admin)/admin/committee/new/page.tsx`, `app/(admin)/admin/committee/[id]/edit/page.tsx`.
- 폼: 제목·카테고리 select·요약·본문 textarea·고정 체크박스·첨부 업로드.

## 파일 업로드 (수십 장 대응)

- **Route Handler** `app/api/committee/uploads/route.ts` + `lib/api.ts` 래퍼.
  - 다중 파일·진행 표시에 적합 → CLAUDE.md 데이터 경로 3순위(클라이언트 fetch가 꼭 필요한 경우) 정당화.
- 서버 검증(헌법 보안):
  1. 확장자 화이트리스트
  2. **매직바이트 기반 실 MIME 검사**(확장자만 신뢰하지 않음)
  3. 파일당 용량 한도
  4. 게시물당 개수 캡 + 합계 용량 캡
  5. **저장 파일명 서버 재생성**(uuid) — 원본명은 `originalName`에 별도 보관
- 저장 위치: `web/uploads/committee/`(gitignore, 컨테이너 볼륨). 실행 권한 없음.
- **한도(승인됨, 추후 조정 가능)**: 파일당 ≤ 20MB, 게시물당 ≤ 50개, 합계 ≤ 300MB.
- **허용 형식**: 문서 `pdf·hwp·hwpx·docx·pptx·xlsx`, 이미지 `png·jpg·jpeg·gif·webp`.
- 파일 제공: `GET /api/committee/files/[attachmentId]` 스트리밍(공개 읽기, 올바른 content-type·다운로드 disposition). public/ 직접 노출 대신 핸들러 스트리밍으로 실행 차단·접근 제어.

## 댓글

`server/actions/comments.ts`:
- `addComment(postId, body)` — 로그인 회원(`getCurrentUser` 필수), zod 검증.
- `deleteComment(commentId)` — 작성자 본인 또는 admin만.
- 비로그인은 읽기만. 상세 페이지 하단 최소 댓글 UI(목록 + 작성 폼).

## 에러 처리 / 검증 규약

- Server Action: `createUser`와 동일 패턴 — zod `safeParse`, 친절한 한국어 메시지 반환, 성공 시 `redirect`.
- Route Handler: `{ ok: true, data }` / `{ ok: false, error: { code, message } }` 고정 스키마 + `lib/api.ts`의 `ApiError`.
- 권한: 모든 쓰기 진입부에서 서버 재확인(`requireAdmin`/`getCurrentUser`). `proxy`는 `/admin` 1차 가드.

## 검증 (PGlite + Preview e2e)

- `pnpm db:verify` 확장: comments·attachments 스키마, cascade 삭제 확인.
- 브라우저 e2e 시나리오:
  1. admin 로그인 → 글 작성(카테고리·본문) → 이미지 다중 업로드
  2. 비로그인 상태로 목록·상세 조회(공개), `viewCount` 증가 확인
  3. 회원 로그인 → 댓글 작성 → 본인 댓글 삭제
  4. admin이 타인 댓글 삭제 가능 / 글 삭제 시 댓글·첨부 cascade
  5. 업로드 검증: 허용 외 확장자·MIME 불일치·용량 초과·개수 초과 거부
- `pnpm lint` / `pnpm build` 통과.

## 범위 밖 (다음 슬라이스/Phase)

- 다른 섹션(자료공유·자유게시판·교역자수련회·웹진·강사진·메인)으로의 패턴 확장.
- 태그·작성자 사이드바 실데이터 집계, 위원회 직책 필드.
- 마크다운/리치 본문, 댓글 대댓글, 검색·무한 스크롤.
- 신규 화면의 Claude Design 폴리시 교체.
- Oracle VM 배포(Phase 5).
