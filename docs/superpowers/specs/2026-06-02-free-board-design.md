# 자유게시판 — 설계 문서 (Phase 4 세 번째 섹션)

작성일: 2026-06-02
대상 브랜치: `feat/free-board`

## 배경 / 목표

교육위원회·자료공유 두 섹션 + 공통 추출 + 배포 자산이 완료됐다. 다음으로 **자유게시판(board)** 을 DB 연동한다. 이 섹션은 지금까지와 다른 **회원 작성 모델**(admin 전용이 아닌 로그인 회원이 글 작성)과 **좋아요** 상호작용이 처음 등장한다.

자유게시판은 교회 내부 커뮤니티 피드다: 나눔·Q&A·기도·토론·소식 카테고리로 회원이 글을 쓰고, 좋아요·댓글로 상호작용한다.

### 확정된 결정 (사용자 승인)
| 항목 | 결정 |
|------|------|
| 읽기 권한 | **로그인 회원 전용**(proxy가 `/board` 가드 — 역할 무관, 로그인 필요) |
| 작성 | **로그인 회원**(admin·member) |
| 수정·삭제 | **작성자 본인 또는 admin** |
| 좋아요 | **포함** — `post_likes` 테이블 + 토글 |
| 댓글 | 기존 `comments` 인프라 재사용 |
| 데코(HotThreads·태그·활동멤버·말씀·이미지커버·reactions·prayerCount·isAnswered·heat) | **1차 정적/생략**(추후) |
| 작성 UI | 디자인 inline Composer를 createPost에 배선 |

## 아키텍처 — 뷰모델 서비스 계층 (committee/resource와 동일)

`posts`(section='board') + `comments`(재사용) + 신규 `post_likes`. 순수 매퍼(`lib/board.ts`, 클라 안전)가 DB 행 → 디자인 `FeedPost` 뷰모델로 변환. 목록 페이지(서버 컴포넌트)가 서비스 호출 → props 주입(마크업 보존).

**읽기 회원 전용**이 새 요소다: `proxy.ts`를 확장해 `/board`를 가드한다(현재는 `/admin`만). `/admin`은 admin 역할, `/board`는 로그인이면 역할 무관 허용.

## 데이터 모델

### posts (section='board')
- `category`: 나눔 / Q&A / 기도 / 토론 / 소식 (5종)
- `title`, `excerpt`, `body`(plain text), `authorId`, `viewCount`, `isPublished`(기본 true), `createdAt`
- (isPinned·eventDate·meta 미사용)

### comments (재사용)
- 회원 댓글. 기존 `addComment`/`deleteComment`/뷰모델 그대로.

### post_likes (신규, Plan B)
```
id        uuid pk default random
postId    uuid not null FK → posts(id) ON DELETE CASCADE
userId    uuid not null FK → users(id) ON DELETE CASCADE
createdAt timestamptz not null default now()
unique(postId, userId)
```
인덱스: unique(postId, userId). 좋아요는 멱등 토글(있으면 삭제, 없으면 삽입).

## 뷰모델 매핑 (lib/board.ts, 순수)
- `BOARD_CATEGORY_EN`: 나눔→STORIES, Q&A→QUESTIONS, 기도→PRAYER, 토론→DISCUSS, 소식→NEWS
- `BOARD_CATEGORIES_KO`: 5종
- `categoryToKind(cat)`: 나눔→story, 기도→prayer, Q&A→question, 토론→discuss, 소식→news
- `toFeedPostView(row, now)` → `FeedPost`({id, cat, kind, title, excerpt, author=name, church, avatar=name[0], date, comments, likes, views, isNew, ...})
  - author/church: `users.name`·`users.church`(null이면 "")
  - date: formatDate(공통 lib/format)
  - 데코 필드(image·prayerCount·isAnswered·reactions·heat·lastReply)는 뷰모델에서 미설정(undefined) 또는 생략 — 컴포넌트가 optional 처리

## 읽기 경로 (회원 전용)

### proxy 확장 (`web/src/proxy.ts`)
- 현재: matcher `/admin/:path*`, claims.role!=='admin'이면 /login.
- 변경: matcher에 `/board/:path*` 추가. 로직: `/admin` 경로는 admin 역할 필요, `/board` 경로는 유효 세션(로그인)이면 역할 무관 허용. 둘 다 미충족 시 `/login?next=...`.

### 서비스 (`server/services/board.ts`, server-only)
- `getBoardListData()` → `{ posts: FeedPost[], categories: BoardCategory[] }`. section='board' AND isPublished, 댓글·좋아요 카운트 집계, 최신순. 카테고리 카운트(전체+5).
- `getBoardPost(id)` → 상세(글+댓글+좋아요 수+내가 눌렀는지) | null. viewCount++.
- 정렬(최신/인기/댓글)은 클라 토글 유지(1차 서비스는 최신순; 인기 정렬은 추후 또는 클라 정렬).

### 페이지
- `app/board/page.tsx`(서버 컴포넌트): 서비스 호출 → props. proxy가 이미 회원 가드. 컴포넌트(피드·카테고리바·사이드바) 마크업 보존, mock→props.
- 데코 사이드바(HotThreads·트렌딩태그·활동멤버·말씀)·이미지커버는 정적 유지(추후 파생).
- 상세 페이지 `app/board/[id]/page.tsx`(신규 최소 화면): 제목·작성자(name·church)·본문·좋아요·댓글. 작성자/admin이면 수정·삭제.

## 쓰기 경로 (회원)

`server/actions/board.ts` (`'use server'`):
- `createPost(_prev, formData)` — `getCurrentUser` 필수(로그인 회원 누구나), zod(title·category·body), insert section='board' authorId=user.id, redirect.
- `updatePost(id, _prev, formData)` — `getCurrentUser` + (작성자 본인 또는 admin) 확인, 아니면 거부. zod, update.
- `deletePost(id)` — `getCurrentUser` + (본인 또는 admin), 댓글·좋아요 cascade.

작성 UI: 디자인의 inline `Composer`(`board/_components/desktop/Composer.tsx`)를 createPost에 배선(form action·상태 추가, 마크업·스타일 보존). proxy가 회원 가드라 비로그인 노출 없음. (Composer 배선이 마크업 변경을 요구하면 `/board/new` 최소 화면으로 대체 — 구현 시 판단.)

## 좋아요 (Plan B)
`server/actions/board-like.ts`(또는 board.ts): `toggleLike(postId)` — `getCurrentUser` 필수, post_likes에 (postId,userId) 있으면 delete, 없으면 insert(unique 충돌은 무시). 피드/상세의 좋아요 버튼이 토글(클라 컴포넌트가 lib/api 또는 server action). 카운트·내 상태 반영.

## 에러 처리 / 검증 규약
- Server Action: 기존 패턴(zod safeParse, 친절한 메시지, redirect). 권한(작성=로그인, 수정/삭제=본인/admin)은 서버 재확인.
- proxy 가드 + 서버 액션 진입부 재확인(이중).
- Drizzle 파라미터 바인딩, dangerouslySetInnerHTML 미사용.

## 검증
- `pnpm lint`/`build`, `board:verify`(순수 매퍼·categoryToKind), 기존 verify 회귀.
- Preview e2e: 비로그인 `/board` → /login 가드. 회원 로그인 → 피드(회원 글)·작성·본인 수정/삭제·댓글·좋아요 토글. admin이 타인 글 삭제 가능.

## Plan 분할 (2개 PR)
- **A — 읽기(회원전용)+회원 CRUD+댓글**: proxy 확장, lib/board 매퍼, board 서비스(목록·상세), 목록 페이지 props 배선, 상세 화면, 회원 작성/수정/삭제 액션 + Composer 배선, dev-db board seed. (좋아요 수 0/정적)
- **B — 좋아요**: post_likes 마이그레이션, toggleLike 액션, 피드·상세 좋아요 토글 UI, 서비스에 좋아요 카운트·내 상태.

## 범위 밖 (후속)
- HotThreads·트렌딩태그·활동멤버·말씀 실데이터, 이미지 커버 업로드, reactions·prayerCount·isAnswered·heat, 인기 정렬 서버 구현, 신고/모더레이션 도구.
- 남은 섹션(교역자수련회·웹진·교수소개).
