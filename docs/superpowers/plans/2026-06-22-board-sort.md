# board 정렬(인기·댓글많은) 실동작화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자유게시판 정렬 탭(최신·인기·댓글많은)이 실제 목록 순서를 바꾸도록 클라이언트 정렬을 연결한다.

**Architecture:** `lib/board.ts`에 순수 정렬 함수 `sortFeedPosts`를 추가하고, 데스크톱·모바일 컴포넌트에서 카테고리 필터 결과에 정렬을 적용해 렌더한다. 디자인 마크업은 보존하고 데이터 흐름만 추가한다.

**Tech Stack:** TypeScript(strict), React(클라이언트 컴포넌트), Next.js 16. 단위 테스트 러너 없음 → `pnpm lint && pnpm build` + 로컬 Supabase e2e로 검증.

---

### Task 1: 정렬 순수 함수 추가

**Files:**
- Modify: `src/lib/board.ts`

- [ ] **Step 1: `sortFeedPosts` 구현 추가**

`src/lib/board.ts` 하단(파일 끝, `toFeedPostView` 아래)에 추가. `FeedPost`·`BoardSort` 타입은 이미 `./board-data`에서 import 가능(상단 import에 `BoardSort` 추가).

상단 import 수정 — 기존:
```ts
import type {
  FeedPost,
  BoardCategoryKo,
  BoardCategoryEn,
  BoardFeedKind,
} from "./board-data";
```
→ `BoardSort` 추가:
```ts
import type {
  FeedPost,
  BoardCategoryKo,
  BoardCategoryEn,
  BoardFeedKind,
  BoardSort,
} from "./board-data";
```

파일 끝에 함수 추가:
```ts
// 자유게시판 목록 정렬 — recent는 입력 순서(서비스가 created_at desc로 제공) 유지,
// hot/comments만 복사본을 정렬(안정 정렬이라 동점은 최신순 유지).
export function sortFeedPosts(posts: FeedPost[], sort: BoardSort): FeedPost[] {
  if (sort === "hot") {
    return [...posts].sort((a, b) => b.likes - a.likes || b.views - a.views);
  }
  if (sort === "comments") {
    return [...posts].sort((a, b) => b.comments - a.comments || b.likes - a.likes);
  }
  return posts;
}
```

- [ ] **Step 2: 린트·타입 확인**

Run: `pnpm lint`
Expected: 통과(에러 없음)

---

### Task 2: 데스크톱 정렬 적용

**Files:**
- Modify: `src/app/board/_components/desktop/BoardDesktop.tsx`

- [ ] **Step 1: `sortFeedPosts` import 추가**

기존:
```ts
import { type BoardSort } from "@/lib/board-data";
```
아래(또는 적절한 import 구역)에 추가:
```ts
import { sortFeedPosts } from "@/lib/board";
```

- [ ] **Step 2: 정렬 적용 + 렌더 교체**

기존:
```tsx
  const filtered =
    activeCat === 0
      ? posts
      : posts.filter((p) => p.cat === categories[activeCat].ko);
```
바로 아래에 추가:
```tsx
  const sorted = sortFeedPosts(filtered, sort);
```
그리고 피드 렌더의 `filtered.map((p) => (` 를 `sorted.map((p) => (` 로 교체.

- [ ] **Step 3: 빌드 확인**

Run: `pnpm build`
Expected: 통과

---

### Task 3: 모바일 정렬 적용

**Files:**
- Modify: `src/app/board/_components/mobile/BoardMobile.tsx`

- [ ] **Step 1: `sortFeedPosts` import 추가**

상단 import 구역에 추가:
```ts
import { sortFeedPosts } from "@/lib/board";
```

- [ ] **Step 2: 정렬 적용 + 렌더 교체**

기존:
```tsx
  const filtered =
    activeCat === 0
      ? posts
      : posts.filter((p) => p.cat === categories[activeCat].ko);
```
바로 아래에 추가:
```tsx
  const sorted = sortFeedPosts(filtered, sort);
```
피드 렌더의 `filtered.map((p) => (` 를 `sorted.map((p) => (` 로 교체.
**주의**: "총 N건" 카운트(`filtered.length`)는 그대로 둔다(정렬은 개수 불변).

- [ ] **Step 3: 린트·빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 모두 통과

---

### Task 4: 로컬 e2e 검증

**Files:** (코드 변경 없음)

- [ ] **Step 1: 좋아요·댓글 분포가 다른 board 글 시드**

로컬 Supabase(127.0.0.1 확인)에 작성자·좋아요·댓글 수가 서로 다른 게시글 여러 건 시드. (GoTrue admin API로 테스트 유저 생성 → `posts`·`post_likes`·`comments` insert)

- [ ] **Step 2: 정렬 탭 전환 검증**

로그인 후 `/board` 데스크톱에서 최신→인기→댓글많은 탭 전환 시 목록 순서가 규칙대로 바뀌는지 렌더 DOM으로 확인:
- 인기: `likes` 내림차순(동률 시 views)
- 댓글많은: `comments` 내림차순
- 최신: 원래(created_at desc) 순서

- [ ] **Step 3: 테스트 데이터 정리**

시드한 글·유저를 정확 매치 조건으로 삭제해 로컬 DB를 원상 복구.

---

## Self-Review
- **Spec 커버리지**: 정렬 규칙(recent/hot/comments) → Task 1, 데스크톱 적용 → Task 2, 모바일 적용 → Task 3, 검증 → Task 4. 누락 없음.
- **Placeholder**: 없음(모든 코드 블록 실제 코드).
- **타입 일관성**: `sortFeedPosts(posts: FeedPost[], sort: BoardSort)` 시그니처를 Task 1에서 정의하고 Task 2·3에서 동일하게 호출.
