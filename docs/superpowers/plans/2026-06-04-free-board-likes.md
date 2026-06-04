# 자유게시판 좋아요(Plan B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자유게시판 글에 로그인 회원이 좋아요를 멱등 토글하고, 피드·상세에 실시간 카운트와 내가 누른 상태를 반영한다.

**Architecture:** 신규 `post_likes` 테이블(unique(postId,userId)) + `toggleLike` Server Action(멱등 토글, 새 카운트 반환, `revalidatePath`). 서비스(`getBoardListData`/`getBoardPost`)가 좋아요 카운트와 `likedByMe`를 집계해 뷰모델에 실어 보내고, 클라 `LikeButton`(useOptimistic + useTransition)이 디자인 하트 마크업을 보존한 채 토글한다.

**Tech Stack:** Next.js 16(App Router, Server Actions), Drizzle ORM + postgres-js, PostgreSQL/PGlite, zod, React 19(useOptimistic/useTransition).

---

## 배경 / 제약 (반드시 준수)
- 설계 근거: `docs/superpowers/specs/2026-06-02-free-board-design.md` §"좋아요 (Plan B)", "Plan 분할". Plan A(읽기·회원 CRUD·댓글)는 PR #26으로 머지 완료.
- **디자인 100% 보존**: 피드·상세의 하트 마크업·인라인 style은 유지. 좋아요 버튼화는 onClick·상태 추가만(클래스/구조 변경 금지). liked 시 하트 채움은 인터랙션 피드백으로 허용.
- 권한: 좋아요는 **로그인 회원 누구나**. 서버 액션 진입부에서 세션 재확인. proxy가 `/board`를 이미 회원 가드.
- mutation은 **Server Action** 경로(직접 fetch 금지). Drizzle 파라미터 바인딩.
- 한국어 주석·UI·커밋 본문.

## 파일 구조 (생성/수정)
- Create: `web/src/server/db/schema/post-likes.ts` — post_likes 테이블 정의
- Modify: `web/src/server/db/schema/index.ts` — 배럴에 export 추가
- Create: `web/src/server/db/migrations/0002_*.sql` — drizzle-kit 생성
- Create: `web/src/server/actions/board-like.ts` — `toggleLike` Server Action
- Modify: `web/src/lib/board.ts` — `BoardRow.likedByMe`, 매퍼가 `likedByMe` 전달
- Modify: `web/src/lib/board-data.ts` — `FeedPost`에 `likedByMe?: boolean` 추가
- Modify: `web/src/server/services/board.ts` — 목록·상세에 좋아요 카운트·`likedByMe` 집계
- Create: `web/src/app/board/_components/LikeButton.tsx` — 클라 토글 버튼(하트 마크업 보존)
- Modify: `web/src/app/board/_components/desktop/FeedCard.tsx` — 비-기도 하트 → LikeButton
- Modify: `web/src/app/board/_components/mobile/BoardMobile.tsx` — 비-기도 하트 → LikeButton
- Modify: `web/src/app/board/[id]/page.tsx` — 상세에 LikeButton 추가
- Modify: `web/scripts/verify-board.mjs` — 매퍼 `likedByMe` 검증 추가
- (선택) Modify: `web/scripts/dev-db.mjs` — 좋아요 seed(멱등)

---

## Task 1: post_likes 스키마 + 마이그레이션

**Files:**
- Create: `web/src/server/db/schema/post-likes.ts`
- Modify: `web/src/server/db/schema/index.ts`
- Create: `web/src/server/db/migrations/0002_*.sql` (생성물)

- [ ] **Step 1: 스키마 파일 작성** — `web/src/server/db/schema/post-likes.ts`:

```ts
// 글 좋아요 — 회원당 글 1회. (postId, userId) 유니크로 멱등 토글 보장.
import { pgTable, uuid, timestamp, unique, index } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { users } from "./users";

export const postLikes = pgTable(
  "post_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("post_likes_post_user_uq").on(t.postId, t.userId),
    index("post_likes_post_id_idx").on(t.postId),
  ],
);

export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
```

- [ ] **Step 2: 배럴 export 추가** — `web/src/server/db/schema/index.ts` 끝에 한 줄 추가:

```ts
export * from "./post-likes";
```

- [ ] **Step 3: 마이그레이션 생성**

Run: `cd web && pnpm db:generate`
Expected: `src/server/db/migrations/0002_*.sql` 생성. 내용에 `CREATE TABLE "post_likes"`, FK 2개(ON DELETE CASCADE), `post_likes_post_user_uq` UNIQUE, `post_likes_post_id_idx` 인덱스 포함.

- [ ] **Step 4: 마이그레이션이 PGlite에 적용되는지 확인**

`web/.pglite`는 기존 스키마가 이미 있어 dev-db가 마이그레이션을 건너뛴다. 신규 마이그레이션 적용 확인을 위해 **로컬 .pglite를 1회 리셋**한 뒤 dev-db로 재적용한다(데이터는 seed로 복원):

Run:
```bash
cd web && rm -rf .pglite && node scripts/dev-db.mjs &
sleep 6
```
Expected 출력: `[dev-db] 마이그레이션 적용: 0000_*.sql, 0001_*.sql, 0002_*.sql` + admin/committee/resource/member/board seed 로그. 확인 후 dev-db 프로세스 종료.

- [ ] **Step 5: 커밋**

```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add "web/src/server/db/schema/post-likes.ts" "web/src/server/db/schema/index.ts" "web/src/server/db/migrations"
git commit -m "feat: post_likes 테이블·마이그레이션 추가(좋아요)"
```

---

## Task 2: toggleLike Server Action

**Files:**
- Create: `web/src/server/actions/board-like.ts`

- [ ] **Step 1: 액션 작성** — `web/src/server/actions/board-like.ts`:

```ts
"use server";
// 자유게시판 글 좋아요 멱등 토글. 로그인 회원 누구나. board 섹션 글만 대상.
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db";
import { postLikes, posts } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth/current-user";

const SECTION = "board" as const;

export type LikeResult =
  | { ok: true; liked: boolean; count: number }
  | { ok: false; error: string };

export async function toggleLike(postId: string): Promise<LikeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  const db = getDb();
  // 대상이 board 글인지 확인 (비정상 postId·타 섹션 차단)
  const [p] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.section, SECTION)))
    .limit(1);
  if (!p) return { ok: false, error: "게시물을 찾을 수 없습니다." };
  // 토글: 있으면 삭제, 없으면 삽입(유니크 충돌 무시)
  const [existing] = await db
    .select({ id: postLikes.id })
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)))
    .limit(1);
  if (existing) {
    await db.delete(postLikes).where(eq(postLikes.id, existing.id));
  } else {
    await db
      .insert(postLikes)
      .values({ postId, userId: user.id })
      .onConflictDoNothing();
  }
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));
  // 서버 렌더 카운트 동기화 (목록·상세)
  revalidatePath("/board");
  revalidatePath(`/board/${postId}`);
  return { ok: true, liked: !existing, count: n };
}
```

- [ ] **Step 2: 타입체크**

Run: `cd web && pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/server/actions/board-like.ts
git commit -m "feat: 좋아요 토글 Server Action(toggleLike) 추가"
```

---

## Task 3: 서비스·매퍼에 좋아요 카운트·내 상태 반영

**Files:**
- Modify: `web/src/lib/board-data.ts` (FeedPost에 likedByMe 추가)
- Modify: `web/src/lib/board.ts` (BoardRow.likedByMe + 매퍼)
- Modify: `web/src/server/services/board.ts` (집계)

- [ ] **Step 1: FeedPost에 likedByMe 추가** — `web/src/lib/board-data.ts`의 `FeedPost` 타입에 필드 추가(다른 필드 옆, optional):

```ts
  likedByMe?: boolean;
```

- [ ] **Step 2: BoardRow·매퍼 수정** — `web/src/lib/board.ts`:

`BoardRow`에 필드 추가:
```ts
  likedByMe: boolean;
```
`toFeedPostView` 반환 객체에 추가(`likes` 다음 줄):
```ts
    likedByMe: row.likedByMe,
```

- [ ] **Step 3: getBoardListData 집계 수정** — `web/src/server/services/board.ts`:

상단 import에 `getCurrentUser` 추가:
```ts
import { getCurrentUser } from "@/server/auth/current-user";
import { postLikes } from "@/server/db/schema";
```
(`postLikes`는 기존 `posts, comments, users` import 줄에 합쳐도 됨)

`getBoardListData` 내부 — `const db = getDb();` 다음에 현재 사용자 조회:
```ts
  const user = await getCurrentUser();
```
select에 두 컬럼 추가(commentCount 옆):
```ts
      likeCount: sql<number>`(select count(*)::int from ${postLikes} pl where pl.post_id = ${posts.id})`,
      likedByMe: user
        ? sql<boolean>`exists(select 1 from ${postLikes} pl where pl.post_id = ${posts.id} and pl.user_id = ${user.id})`
        : sql<boolean>`false`,
```
매핑 라인에서 더이상 `likeCount: 0`을 덮어쓰지 않도록 수정:
```ts
  const list = rows.map((r) => toFeedPostView(r as BoardRow, now));
```

- [ ] **Step 4: getBoardPost 집계 수정** — `web/src/server/services/board.ts`:

`BoardDetail` 타입에 `likedByMe: boolean;` 추가.
`getBoardPost` 시작부에 사용자 조회:
```ts
  const user = await getCurrentUser();
```
글 select에 likedByMe는 별도 카운트 쿼리로 처리(상세는 단건이라 명료하게):
글 행 조회 후 댓글 조회 부근에 좋아요 카운트·내 상태 쿼리 추가:
```ts
  const [{ likes }] = await db
    .select({ likes: sql<number>`count(*)::int` })
    .from(postLikes)
    .where(eq(postLikes.postId, id));
  const likedByMe = user
    ? (
        await db
          .select({ id: postLikes.id })
          .from(postLikes)
          .where(and(eq(postLikes.postId, id), eq(postLikes.userId, user.id)))
          .limit(1)
      ).length > 0
    : false;
```
반환 객체에서 `likes: 0` → `likes,` 로 바꾸고 `likedByMe,` 추가.

- [ ] **Step 5: 매퍼 verify 갱신** — `web/scripts/verify-board.mjs`에 likedByMe 검증 케이스 추가. 기존 mock 행에 `likedByMe: true`를 넣고 결과의 `likedByMe`가 그대로 전달되는지 단언:

```js
// likedByMe 전달
{
  const v = toFeedPostView({ ...base, likedByMe: true }, now);
  assert(v.likedByMe === true, "likedByMe 전달");
}
```
(파일의 기존 `base` 객체 구성에 `likeCount`가 이미 있으면 거기에 `likedByMe` 키를 더한다. 기존 케이스의 base에도 `likedByMe: false`를 추가해 타입 일관성 유지.)

- [ ] **Step 6: 검증**

Run: `cd web && pnpm board:verify && pnpm exec tsc --noEmit`
Expected: 매퍼 검증 통과(✅), 타입 에러 없음.

- [ ] **Step 7: 커밋**

```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/lib/board.ts web/src/lib/board-data.ts web/src/server/services/board.ts web/scripts/verify-board.mjs
git commit -m "feat: 자유게시판 서비스에 좋아요 카운트·내 상태 집계"
```

---

## Task 4: LikeButton 클라 컴포넌트 + 피드·상세 배선

**Files:**
- Create: `web/src/app/board/_components/LikeButton.tsx`
- Modify: `web/src/app/board/_components/desktop/FeedCard.tsx`
- Modify: `web/src/app/board/_components/mobile/BoardMobile.tsx`
- Modify: `web/src/app/board/[id]/page.tsx`

- [ ] **Step 1: LikeButton 작성** — `web/src/app/board/_components/LikeButton.tsx`:

디자인 하트 svg를 그대로 품되, 클릭 시 토글 + 낙관적 카운트. `render`는 기존 마크업과 동일한 span/svg를 출력하고 liked일 때 채움색만 바꾼다.

```tsx
"use client";
import { useOptimistic, useTransition } from "react";
import type { Palette } from "@/app/_components/shared/palette";
import { toggleLike } from "@/server/actions/board-like";

type Props = {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  palette: Palette;
};

// 좋아요 토글 — 디자인 하트 마크업 보존(span + svg). liked 시 채움색만 반영.
export default function LikeButton({ postId, initialLiked, initialCount, palette }: Props) {
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(
    { liked: initialLiked, count: initialCount },
    (_prev, next: { liked: boolean; count: number }) => next,
  );
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 onClick(상세 이동) 차단
    startTransition(async () => {
      setOptimistic({
        liked: !state.liked,
        count: state.count + (state.liked ? -1 : 1),
      });
      await toggleLike(postId);
    });
  };
  return (
    <span
      role="button"
      aria-pressed={state.liked}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
        color: state.liked ? palette.primary : "inherit",
        fontWeight: state.liked ? 700 : "inherit",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 10 C6 10 1.5 7 1.5 4 a2.5 2.5 0 0 1 4.5 -1.5 a2.5 2.5 0 0 1 4.5 1.5 C10.5 7 6 10 6 10 Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill={state.liked ? "currentColor" : "none"}
        />
      </svg>
      {state.count}
    </span>
  );
}
```

- [ ] **Step 2: 데스크톱 FeedCard 배선** — `web/src/app/board/_components/desktop/FeedCard.tsx`:

상단 import 추가: `import LikeButton from "../LikeButton";`
비-기도 분기(`isPrayer ? (...) : (<span ...>{post.likes}</span>)`)의 **else 쪽 좋아요 span**을 LikeButton으로 교체(기도 분기는 그대로 — 기도 카운트는 Plan B 범위 밖):

```tsx
            ) : (
              <LikeButton
                postId={post.id}
                initialLiked={post.likedByMe ?? false}
                initialCount={post.likes}
                palette={palette}
              />
            )}
```

- [ ] **Step 3: 모바일 피드 배선** — `web/src/app/board/_components/mobile/BoardMobile.tsx`:

상단 import 추가: `import LikeButton from "../LikeButton";`
피드 카드 푸터의 비-기도 좋아요 span(하트 + `{p.likes}`)을 LikeButton으로 교체:

```tsx
                ) : (
                  <LikeButton
                    postId={p.id}
                    initialLiked={p.likedByMe ?? false}
                    initialCount={p.likes}
                    palette={palette}
                  />
                )}
```
(HOT THREADS 카드의 `♥ {p.likes}`는 정적 mock(CM_HOT)이라 그대로 둔다.)

- [ ] **Step 4: 상세 페이지 배선** — `web/src/app/board/[id]/page.tsx`:

`getBoardPost` 결과에 likedByMe·likes가 포함된다. 제목 아래 메타(`<p>{post.category} · ...</p>`) 다음에 LikeButton 추가. 상세는 palette가 없으므로 FOREST_PALETTE를 import해 전달:

```tsx
import LikeButton from "@/app/board/_components/LikeButton";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
```
제목 `<h1>` 다음 줄에:
```tsx
      <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
        <LikeButton
          postId={id}
          initialLiked={post.likedByMe}
          initialCount={post.likes}
          palette={FOREST_PALETTE}
        />
      </div>
```

- [ ] **Step 5: 빌드·린트**

Run: `cd web && pnpm lint && pnpm build`
Expected: 린트 통과, 빌드 성공. 라우트 표 `ƒ /board`, `ƒ /board/[id]` 표시.

- [ ] **Step 6: 커밋**

```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/app/board
git commit -m "feat: 좋아요 토글 UI(LikeButton) 피드·상세 배선 (마크업 보존)"
```

---

## Task 5: 통합 검증 (Preview e2e) + PR

**Files:** 없음(검증·정리)

- [ ] **Step 1: 회귀 verify**

Run: `cd web && pnpm board:verify && pnpm committee:verify && pnpm resource:verify`
Expected: 모두 ✅.

- [ ] **Step 2: Preview e2e** — `.claude/launch.json`의 `web-dev`로 dev 서버 기동(별도 PGlite `dev:db` 필요). 다음을 확인:
  - 회원 로그인 → `/board` 피드의 좋아요 버튼 클릭 → 카운트 +1, 하트 채움(낙관적). 새로고침 후에도 +1 유지(서버 반영).
  - 같은 버튼 재클릭 → 카운트 -1, 하트 비움. 새로고침 후 유지.
  - 상세 페이지 좋아요 토글 동일 동작. 카드 클릭(상세 이동)과 좋아요 클릭이 분리(stopPropagation).
  - 비로그인은 proxy가 `/board` 자체를 가드하므로 노출 안 됨(별도 확인 불필요).
  - 회귀: 댓글·작성·수정·삭제(Plan A) 정상.

- [ ] **Step 3: dev-db 좋아요 seed (선택)** — e2e 후 필요하면 `web/scripts/dev-db.mjs`에 board 글 일부에 member 좋아요를 멱등 seed. 범위 최소화를 위해 생략 가능.

- [ ] **Step 4: 푸시 + PR** (사용자 승인 후)

```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git push -u origin feat/board-likes
gh pr create --base main --head feat/board-likes --title "feat: 자유게시판 Plan B — 좋아요 토글" --body-file <본문>
```

---

## Self-Review 체크
- **스펙 커버리지**: post_likes 테이블(unique 토글) ✓, toggleLike 멱등 ✓, 서비스 카운트+내 상태 ✓, 피드·상세 토글 UI ✓.
- **타입 일관성**: `FeedPost.likedByMe?`, `BoardRow.likedByMe`, `BoardDetail.likedByMe`, LikeButton props가 일치. 매퍼는 `likedByMe`를 그대로 전달.
- **보안**: toggleLike가 로그인·board 섹션 재확인. 파라미터 바인딩. proxy 가드 유지.
- **디자인 보존**: 하트 span/svg 구조 유지, liked 채움색·커서·stopPropagation만 추가.
- **범위 밖**: 기도(prayerCount)·HOT mock·인기 정렬 서버구현은 후속.
