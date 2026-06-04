# 자유게시판 — 읽기(회원전용) + 회원 CRUD + 댓글 구현 Plan (Plan A/2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 로그인 회원이 자유게시판 피드를 보고(비로그인 차단), 글을 작성·수정·삭제하고, 댓글을 단다. 기존 목록 디자인 마크업은 보존.

**Architecture:** 뷰모델 서비스 계층(committee/resource와 동일). `posts(section='board')` + `comments`(재사용). 순수 매퍼(`lib/board.ts`)가 DB 행 → 디자인 `FeedPost` 뷰모델로 변환. **읽기 회원 전용**은 `proxy.ts`를 `/board`까지 확장(로그인이면 역할 무관). **회원 작성**은 `getCurrentUser` 게이트(requireAdmin 아님), 수정·삭제는 본인 또는 admin.

**Tech Stack:** Next.js 16(proxy), Drizzle, PGlite(검증), TypeScript strict, pnpm. 마이그레이션 불필요(기존 posts·comments).

**검증:** `pnpm lint`/`build` + `board:verify`(순수 매퍼) + 기존 verify 회귀 + Preview e2e(비로그인 가드·회원 작성/수정/삭제·댓글).

**범위 밖(Plan B):** 좋아요(post_likes·토글). 데코(HotThreads·태그·멤버·말씀·이미지커버·prayerCount·isAnswered·heat)는 정적/생략.

---

## File Structure

- `web/src/proxy.ts` — `/board` 가드 추가(로그인 필요), `/admin`은 admin 유지 (수정)
- `web/src/lib/board.ts` — 카테고리 맵·categoryToKind·toFeedPostView (신규, 클라 안전)
- `web/src/lib/board-data.ts` — `FeedPost.id`·`HotThread.id` number→string (수정; mock은 seed 참조용)
- `web/src/server/services/board.ts` — getBoardListData·getBoardPost·incrementBoardView (신규, server-only)
- `web/src/server/actions/board.ts` — createPost(회원)·updatePost·deletePost(본인/admin) (신규)
- `web/src/app/board/page.tsx` — 서비스 호출 → props 주입 (수정)
- `web/src/app/board/_components/desktop/BoardDesktop.tsx` · `CategoryStickyBar.tsx` · `FeedCard.tsx` · `Composer.tsx` · `mobile/BoardMobile.tsx` — props·작성·라우팅 배선 (수정)
- `web/src/app/board/[id]/page.tsx` — 상세 최소 화면 + 본인/admin 수정·삭제 + 댓글(재사용) (신규)
- `web/scripts/verify-board.mjs` — 순수 매퍼 검증 (신규)
- `web/scripts/dev-db.mjs` — member 유저 + board 글 seed (수정)
- `web/package.json` — `board:verify` (수정)

---

## Task 1: proxy 확장 (/board 회원 가드)

**Files:** Modify `web/src/proxy.ts`.

- [ ] **Step 1: proxy 로직 확장** — `web/src/proxy.ts`를 다음으로 교체:
```ts
// Next 16 Proxy (구 middleware) — 보호 라우트 가드.
// DB는 쓰지 않고 토큰 클레임의 role만 확인(엣지 안전). 페이지에서 서버 권한 재확인은 별도(헌법).
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/server/auth/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const claims = token ? await verifySessionToken(token) : null;

  const path = request.nextUrl.pathname;
  // /admin: admin 역할 필요. /board: 로그인이면 역할 무관 허용.
  const ok = path.startsWith("/admin")
    ? claims?.role === "admin"
    : claims != null; // /board (matcher로 한정)

  if (!ok) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/board/:path*"],
};
```

- [ ] **Step 2: 빌드** — `cd web && pnpm build && pnpm lint`. 성공. (proxy는 런타임 — e2e는 최종 task.)

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/proxy.ts
git commit -m "feat: proxy에 /board 회원 가드 추가(로그인 필요)"
```
(트레일러: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 2: lib/board.ts 순수 매퍼 + id string + verify

**Files:** Create `web/src/lib/board.ts`, `web/scripts/verify-board.mjs`; Modify `web/src/lib/board-data.ts`, `web/package.json`.

- [ ] **Step 1: 순수 매퍼** — `web/src/lib/board.ts`:
```ts
// 자유게시판 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import { formatDate } from "./format";
import type {
  FeedPost,
  BoardCategoryKo,
  BoardCategoryEn,
  BoardFeedKind,
} from "./board-data";

type Cat = Exclude<BoardCategoryKo, "전체">;

export const BOARD_CATEGORY_EN: Record<Cat, BoardCategoryEn> = {
  나눔: "STORIES",
  "Q&A": "QUESTIONS",
  기도: "PRAYER",
  토론: "DISCUSS",
  소식: "NEWS",
};

export const BOARD_CATEGORIES_KO: Cat[] = ["나눔", "Q&A", "기도", "토론", "소식"];

const CATEGORY_KIND: Record<Cat, BoardFeedKind> = {
  나눔: "story",
  기도: "prayer",
  "Q&A": "question",
  토론: "discuss",
  소식: "news",
};

export function categoryToKind(cat: string | null): BoardFeedKind {
  return cat && cat in CATEGORY_KIND ? CATEGORY_KIND[cat as Cat] : "story";
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type BoardRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  authorName: string | null;
  authorChurch: string | null;
  commentCount: number;
  likeCount: number;
};

export function toFeedPostView(row: BoardRow, now: Date): FeedPost {
  const cat = (row.category && row.category in CATEGORY_KIND ? row.category : "나눔") as Cat;
  const name = row.authorName ?? "익명";
  return {
    id: row.id,
    cat,
    kind: categoryToKind(cat),
    title: row.title,
    excerpt: row.excerpt ?? "",
    author: name,
    church: row.authorChurch ?? "",
    avatar: name.slice(0, 1),
    date: formatDate(row.createdAt),
    comments: row.commentCount,
    likes: row.likeCount,
    views: row.viewCount,
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}
```
비고: `FeedPost`의 image·prayerCount·isAnswered·reactions 등 optional 데코 필드는 미설정(컴포넌트가 optional 처리). likes는 Plan A에서 0(서비스가 0 공급), Plan B에서 실 카운트.

- [ ] **Step 2: id 타입 string화** — `web/src/lib/board-data.ts`:
  - `FeedPost` 타입 `id: number` → `id: string`; `CM_FEED`의 각 `id: 1`…`id: 10` → `"1"`…`"10"`.
  - `HotThread` 타입 `id: number` → `id: string`; `CM_HOT`의 `id: 101`·`102` → `"101"`·`"102"`.
  - (HotThread는 정적 데코로 계속 쓰이므로 타입 일관성 위해 string화.)

- [ ] **Step 3: verify** — `web/scripts/verify-board.mjs`:
```js
// 자유게시판 순수 매퍼 검증 — DB 없이.
//   실행: pnpm board:verify
import { toFeedPostView, categoryToKind, BOARD_CATEGORY_EN } from "../src/lib/board.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

assert(categoryToKind("기도") === "prayer", "기도 → prayer");
assert(categoryToKind("Q&A") === "question", "Q&A → question");
assert(categoryToKind(null) === "story", "미지정 → story 폴백");
assert(BOARD_CATEGORY_EN["토론"] === "DISCUSS", "카테고리 EN 맵");

const now = new Date("2026-06-01T00:00:00Z");
const v = toFeedPostView(
  {
    id: "b1",
    category: "토론",
    title: "출석 감소 고민",
    excerpt: "요약",
    viewCount: 1843,
    createdAt: new Date("2026-05-30T00:00:00Z"),
    authorName: "김도현",
    authorChurch: "서경중앙교회",
    commentCount: 47,
    likeCount: 128,
  },
  now,
);
assert(v.id === "b1" && v.cat === "토론" && v.kind === "discuss", "id·cat·kind 매핑");
assert(v.author === "김도현" && v.church === "서경중앙교회" && v.avatar === "김", "작성자·교회·아바타");
assert(v.comments === 47 && v.likes === 128 && v.views === 1843, "comments·likes·views");
assert(v.date === "2026.05.30" && v.isNew === true, "date·isNew");

const v2 = toFeedPostView(
  { id: "x", category: null, title: "t", excerpt: null, viewCount: 0, createdAt: new Date("2026-01-01T00:00:00Z"), authorName: null, authorChurch: null, commentCount: 0, likeCount: 0 },
  now,
);
assert(v2.cat === "나눔" && v2.kind === "story", "null 카테고리 → 나눔/story");
assert(v2.author === "익명" && v2.church === "" && v2.excerpt === "", "폴백 author/church/excerpt");
assert(v2.isNew === false, "오래된 글 isNew=false");

console.log("\n✅ 자유게시판 순수 매퍼 검증 통과");
```

- [ ] **Step 4: package.json** — scripts에 `"board:verify": "node scripts/verify-board.mjs",` 추가.

- [ ] **Step 5: 검증** — `cd web && pnpm board:verify` → 모든 `✓` 후 성공. `pnpm build`(id string화 타입 OK).

- [ ] **Step 6: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/lib/board.ts web/src/lib/board-data.ts web/scripts/verify-board.mjs web/package.json
git commit -m "feat: 자유게시판 순수 뷰모델 매퍼·카테고리 맵 추가"
```

---

## Task 3: server/services/board.ts

**Files:** Create `web/src/server/services/board.ts`.

- [ ] **Step 1: 서비스** — `web/src/server/services/board.ts`:
```ts
import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { posts, comments, users } from "@/server/db/schema";
import { formatDate } from "@/lib/format";
import {
  toFeedPostView,
  categoryToKind,
  BOARD_CATEGORIES_KO,
  BOARD_CATEGORY_EN,
  type BoardRow,
} from "@/lib/board";
import { formatAuthor } from "@/lib/format";
import type { FeedPost, BoardCategory } from "@/lib/board-data";

const SECTION = "board" as const;

export type BoardListData = {
  posts: FeedPost[];
  categories: BoardCategory[];
};

export async function getBoardListData(): Promise<BoardListData> {
  const now = new Date();
  const db = getDb();
  const rows = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorChurch: users.church,
      commentCount: sql<number>`(select count(*)::int from ${comments} c where c.post_id = ${posts.id})`,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .orderBy(desc(posts.createdAt));
  // Plan A: likeCount 0 (Plan B에서 post_likes 집계로 교체)
  const list = rows.map((r) => toFeedPostView({ ...r, likeCount: 0 } as BoardRow, now));

  const counts = await db
    .select({ category: posts.category, n: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .groupBy(posts.category);
  const byCat = new Map(counts.map((c) => [c.category, c.n]));
  const total = counts.reduce((s, c) => s + c.n, 0);
  const categories: BoardCategory[] = [
    { ko: "전체", en: "ALL", count: total },
    ...BOARD_CATEGORIES_KO.map((ko) => ({ ko, en: BOARD_CATEGORY_EN[ko], count: byCat.get(ko) ?? 0 })),
  ];

  return { posts: list, categories };
}

export type BoardDetail = {
  id: string;
  category: string | null;
  kind: string;
  title: string;
  body: string | null;
  author: string;
  church: string;
  date: string;
  views: number;
  likes: number;
  authorId: string | null;
  comments: { id: string; authorId: string | null; author: string; date: string; body: string }[];
};

export async function getBoardPost(id: string): Promise<BoardDetail | null> {
  const db = getDb();
  const [r] = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      body: posts.body,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.name,
      authorChurch: users.church,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .limit(1);
  if (!r) return null;
  const cms = await db
    .select({
      id: comments.id,
      authorId: comments.authorId,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorTitle: users.title,
    })
    .from(comments)
    .leftJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.postId, id))
    .orderBy(comments.createdAt);
  return {
    id: r.id,
    category: r.category,
    kind: categoryToKind(r.category),
    title: r.title,
    body: r.body,
    author: r.authorName ?? "익명",
    church: r.authorChurch ?? "",
    date: formatDate(r.createdAt),
    views: r.viewCount,
    likes: 0,
    authorId: r.authorId,
    comments: cms.map((c) => ({
      id: c.id,
      authorId: c.authorId,
      author: formatAuthor(c.authorName, c.authorTitle),
      date: formatDate(c.createdAt),
      body: c.body,
    })),
  };
}

export async function incrementBoardView(id: string): Promise<void> {
  await getDb()
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)));
}
```
비고: 댓글 author는 committee처럼 `formatAuthor(name, title)`(이름+직함). 피드/상세 글 author는 `name`(+church 별도). `users.church`가 schema에 있음(확인).

- [ ] **Step 2: 빌드** — `cd web && pnpm build` 성공.

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/server/services/board.ts
git commit -m "feat: 자유게시판 목록·상세 서비스 추가"
```

---

## Task 4: server/actions/board.ts (회원 작성·본인/admin 수정·삭제)

**Files:** Create `web/src/server/actions/board.ts`.

- [ ] **Step 1: 액션** — `web/src/server/actions/board.ts`:
```ts
"use server";
// 자유게시판 글 작성/수정/삭제. 작성=로그인 회원, 수정·삭제=작성자 본인 또는 admin.
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { posts } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth/current-user";
import { BOARD_CATEGORIES_KO } from "@/lib/board";

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(BOARD_CATEGORIES_KO as [string, ...string[]]),
  body: z.string().trim().optional().transform((v) => v || null),
});

export interface BoardFormState {
  error?: string;
}

function parse(formData: FormData) {
  return schema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    body: formData.get("body"),
  });
}

const SECTION = "board" as const;

export async function createPost(_prev: BoardFormState, formData: FormData): Promise<BoardFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const [row] = await getDb()
    .insert(posts)
    .values({
      section: SECTION,
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.body ? r.data.body.slice(0, 120) : null,
      body: r.data.body,
      authorId: user.id,
    })
    .returning({ id: posts.id });
  redirect(`/board/${row.id}`);
}

// 작성자 본인 또는 admin인지 확인하고 대상 글 반환(아니면 null)
async function authorizePost(id: string, userId: string, isAdmin: boolean) {
  const [p] = await getDb()
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.section, SECTION)))
    .limit(1);
  if (!p) return false;
  return isAdmin || p.authorId === userId;
}

export async function updatePost(id: string, _prev: BoardFormState, formData: FormData): Promise<BoardFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  if (!(await authorizePost(id, user.id, user.role === "admin")))
    return { error: "수정 권한이 없습니다." };
  await getDb()
    .update(posts)
    .set({
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.body ? r.data.body.slice(0, 120) : null,
      body: r.data.body,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));
  redirect(`/board/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await authorizePost(id, user.id, user.role === "admin"))) redirect(`/board/${id}`);
  await getDb().delete(posts).where(eq(posts.id, id));
  redirect("/board");
}
```
비고: board 글은 excerpt를 본문 앞 120자에서 자동 생성(피드 미리보기용). 첨부 없음(자유게시판 v1).

- [ ] **Step 2: 빌드** — `cd web && pnpm build` 성공.

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/server/actions/board.ts
git commit -m "feat: 자유게시판 글 작성(회원)·수정·삭제(본인/admin) Server Action"
```

---

## Task 5: dev-db member 유저 + board 글 seed

**Files:** Modify `web/scripts/dev-db.mjs`.

- [ ] **Step 1: member + board seed 추가** — admin 시드 다음(adminId 확보 후), 자료공유 seed 다음, `const server = ...` 앞에 삽입:
```js
// member 유저 seed (없을 때만) — 자유게시판 작성자용
const MEMBER_EMAIL = "member@seogyeong.kr";
const mExists = await db.query(`select id from users where email=$1`, [MEMBER_EMAIL]);
let memberId;
if (mExists.rows.length === 0) {
  const mhash = await argon2.hash("member1234");
  const mr = await db.query(
    `insert into users (email, password_hash, name, title, church, role) values ($1,$2,$3,$4,$5,'member') returning id`,
    [MEMBER_EMAIL, mhash, "이수민", "전도사", "은혜로교회", ],
  );
  memberId = mr.rows[0].id;
  console.log(`[dev-db] member 시드: ${MEMBER_EMAIL} / member1234`);
} else {
  memberId = mExists.rows[0].id;
}

// 자유게시판 seed (없을 때만)
const bExists = await db.query(`select 1 from posts where section='board' limit 1`);
if (bExists.rows.length === 0) {
  const bseed = [
    ["나눔", "아이가 처음 “기도해도 돼요?”라고 물었던 날", memberId],
    ["Q&A", "중고등부 큐티 교재, 요즘 뭐 쓰시나요?", memberId],
    ["기도", "봄학기 새가족을 위해 기도 부탁드립니다", adminId],
    ["토론", "주일학교 출석 감소, 우리 교회만의 문제일까요?", adminId],
    ["소식", "청년부 봄 워십나잇 — 4월 27일", memberId],
  ];
  for (const [cat, title, author] of bseed) {
    await db.query(
      `insert into posts (section, category, title, excerpt, body, author_id)
       values ('board', $1, $2, $3, $4, $5)`,
      [cat, title, title + " (요약)", title + "\n\n(본문 예시)", author],
    );
  }
  console.log(`[dev-db] 자유게시판 글 ${bseed.length}건 seed`);
} else {
  console.log("[dev-db] 자유게시판 글 이미 존재");
}
```
(주의: `users` insert에 church 컬럼 포함. argon2는 dev-db 상단에서 이미 import됨. memberId는 board seed 및 작성자에 사용.)

- [ ] **Step 2: DB 재기동 확인** — `cd web && rm -rf .pglite && pnpm dev:db` → 로그에 `member 시드` + `자유게시판 글 5건 seed`. 확인 후 종료(포트 5432 비우기).

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/scripts/dev-db.mjs
git commit -m "chore: dev-db에 member 유저 + 자유게시판 글 seed 추가"
```

---

## Task 6: 목록 페이지·컴포넌트 배선 (props·작성·라우팅, 마크업 보존)

**Files:** Modify `board/page.tsx`, `BoardDesktop.tsx`, `CategoryStickyBar.tsx`, `FeedCard.tsx`, `Composer.tsx`, `mobile/BoardMobile.tsx`.

> 마크업·스타일 변경 금지. mock import→props, 카드 상세 라우팅(onOpen), Composer를 createPost에 배선(form action·상태만).

- [ ] **Step 1: 서버 페이지** — `web/src/app/board/page.tsx`를 읽고, device 분기 구조를 유지하며 `getBoardListData()` 호출 후 BoardDesktop/BoardMobile에 `posts`·`categories` props 주입. (committee/resource page.tsx와 동일 패턴 — 그 파일들을 참고해 동형 작성.)

- [ ] **Step 2: BoardDesktop props** — `BoardDesktop.tsx`:
  - import에서 `CM_CATEGORIES, CM_FEED` 제거(`BoardSort` 타입 유지), `useRouter` + 타입 import 추가.
  - 시그니처 `({ posts, categories }: { posts: FeedPost[]; categories: BoardCategory[] })`, `const router = useRouter()`.
  - `filtered = activeCat === 0 ? posts : posts.filter((p) => p.cat === categories[activeCat].ko)`.
  - `<CategoryStickyBar ... categories={categories} />`(prop 추가), `<FeedCard key={p.id} post={p} palette={palette} onOpen={() => router.push(\`/board/${p.id}\`)} />`.
  - `<Composer palette={palette} />`는 Step 5에서 배선. HotSection·SideMembers·SideTags·SideGuide는 정적 유지. `<SideCategories palette={palette} />`에 categories 전달(Sidebar가 CM_CATEGORIES 쓰면 props로 — Sidebar 확인).

- [ ] **Step 3: CategoryStickyBar props** — `CategoryStickyBar.tsx`: `CM_CATEGORIES` import 제거, `categories: BoardCategory[]` prop 추가, 본문 map 치환. 마크업 그대로.

- [ ] **Step 4: FeedCard 라우팅** — `FeedCard.tsx`: `Props`에 `onOpen?: () => void` 추가, 최상위 요소에 `onClick={onOpen}`. 스타일 무변경. (post의 likes/comments/views/image/prayerCount 등 기존 표시 그대로 — likes는 0으로 옴.)

- [ ] **Step 5: Composer를 createPost에 배선** — `Composer.tsx`를 읽고 구조 파악. 'use client'로 만들고(이미 client tree), `useActionState(createPost, {})`로 폼 제출 시 글 작성. 입력 필드(제목·카테고리·본문)에 `name` 부여(title·category·body), 폼 `action={formAction}`. **마크업·스타일 보존**, name 속성·form action·error 표시만 추가.
  - Composer가 카테고리 선택 UI를 가지면 `name="category"`로, 없으면 기본 카테고리(예: "나눔") hidden input. 본문/제목 입력에 name 부여.
  - 제출 성공 시 createPost가 `/board/[id]`로 redirect.
  - **만약 Composer 마크업이 form 배선에 부적합(단순 트리거 버튼 등)하면**: Composer는 그대로 두고 `/board/new` 최소 작성 페이지(committee EditorForm류)를 신규로 만들어 Composer의 작성 트리거가 거기로 라우팅하도록 한다. 어느 쪽을 택했는지 보고.

- [ ] **Step 6: BoardMobile props** — `mobile/BoardMobile.tsx`를 읽고 desktop과 동일 원칙으로 mock→props·카드 라우팅 배선.

- [ ] **Step 7: 잔존 점검 + 빌드/린트** — `cd web && grep -rn "CM_FEED\|CM_CATEGORIES" src/app/board` → 결과 없음(데코 CM_HOT/CM_MEMBERS/CM_TAGS/CM_VERSE는 정적 잔존 가능). `pnpm lint && pnpm build` 성공.

- [ ] **Step 8: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/app/board
git commit -m "feat: 자유게시판 목록 DB 연동 + 회원 작성 배선 (마크업 보존)"
```

---

## Task 7: 상세 페이지 (읽기 + 본인/admin 수정·삭제 + 댓글)

**Files:** Create `web/src/app/board/[id]/page.tsx`.

- [ ] **Step 1: 상세 페이지** — `web/src/app/board/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBoardPost, incrementBoardView } from "@/server/services/board";
import { getCurrentUser } from "@/server/auth/current-user";
import { deletePost } from "@/server/actions/board";
import { deleteComment } from "@/server/actions/comments";
import CommentForm from "@/app/committee/_components/CommentForm";

// 최소 기능 상세 화면. 디자인 폴리시는 추후 Claude Design 핸드오프로 교체.
export default async function BoardPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBoardPost(id);
  if (!post) notFound();
  await incrementBoardView(id);
  const user = await getCurrentUser(); // proxy가 이미 회원 가드 — user 존재
  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || (user != null && post.authorId === user.id);

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/board" style={{ fontSize: 13, color: "#666" }}>← 자유게시판</Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {post.category} · {post.author}{post.church ? ` · ${post.church}` : ""} · {post.date} · 조회 {post.views}
      </p>
      <h1 style={{ fontSize: 24, lineHeight: 1.3 }}>{post.title}</h1>
      {canEdit && (
        <div style={{ display: "flex", gap: 12, fontSize: 13, marginTop: 4 }}>
          <Link href={`/board/${id}/edit`} style={{ color: "#06c" }}>수정</Link>
          <form action={deletePost.bind(null, id)}>
            <button type="submit" style={{ color: "#c00", fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0 }}>삭제</button>
          </form>
        </div>
      )}
      <article style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>{post.body}</article>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15 }}>댓글 ({post.comments.length})</h2>
        {post.comments.map((c) => {
          const canDelC = isAdmin || (user != null && c.authorId === user.id);
          return (
            <div key={c.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{c.author} · {c.date}</p>
              <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{c.body}</p>
              {canDelC && (
                <form action={deleteComment.bind(null, c.id)} style={{ marginTop: 4 }}>
                  <button type="submit" style={{ fontSize: 12, color: "#c00" }}>삭제</button>
                </form>
              )}
            </div>
          );
        })}
        <CommentForm postId={id} />
      </section>
    </main>
  );
}
```
비고: 댓글은 기존 `CommentForm`(committee)·`deleteComment`(section-agnostic) 재사용. `/board/[id]/edit`(회원 작성 폼 재사용)는 Composer 배선 방식에 따라 생성 — Step 아래.

- [ ] **Step 2: 편집 페이지(회원 폼 재사용)** — 작성에 `/board/new`/`/board/[id]/edit` 방식을 택했다면 `web/src/app/board/[id]/edit/page.tsx`를 만들어 `getCurrentUser`로 로그인 확인 + `updatePost.bind(null,id)`로 폼 배선(BoardEditorForm 또는 Task6의 작성 컴포넌트 재사용). Composer 인라인 수정이 어려우므로 **수정은 최소 편집 페이지**로 둔다(작성과 별개로 안전). 작성 컴포넌트(제목·카테고리·본문)를 `BoardForm`으로 공통화해 new/edit·composer가 공유해도 좋다. 구현 방식 보고.

- [ ] **Step 3: 빌드** — `cd web && pnpm build` → `ƒ /board/[id]` (및 edit) 표시.

- [ ] **Step 4: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add "web/src/app/board/[id]"
git commit -m "feat: 자유게시판 상세(읽기·본인/admin 수정삭제·댓글)"
```

---

## Task 8: 통합 검증 (Preview e2e)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 회귀** — `cd web && pnpm lint && pnpm build && pnpm db:verify && pnpm committee:verify && pnpm uploads:verify && pnpm resource:verify && pnpm board:verify` 전부 통과.
- [ ] **Step 2: 로컬 DB + Preview** — `rm -rf web/.pglite && pnpm dev:db`(백그라운드, member·board seed) + Preview.
- [ ] **Step 3: 비로그인 가드** — 비로그인으로 `/board` → `/login?next=/board` 리다이렉트(proxy).
- [ ] **Step 4: 회원 흐름** — member(`member@seogyeong.kr`/`member1234`) 로그인 → `/board` 피드(seed 5건, 작성자·교회 표시) → Composer로 글 작성 → 상세 이동 → 본인 글 "수정/삭제" 노출, 댓글 작성. 다른 사람 글엔 수정/삭제 미노출.
- [ ] **Step 5: admin 권한** — admin 로그인 → 타인(member) 글에도 수정/삭제 가능 → member 글 삭제 동작.
- [ ] **Step 6: 정리** — 서버 종료, 포트 비우기.

---

## Self-Review 메모
- **스펙 커버리지:** 회원전용 읽기(proxy)·회원 작성·본인/admin 수정삭제·댓글(재사용)·피드 목록·상세·author(이름+교회)·kind 파생 = 태스크 매핑. 좋아요·데코는 Plan B/생략 명시.
- **타입 일관성:** `FeedPost.id` string ↔ BoardRow ↔ 서비스 ↔ props. `BoardFormState`, `createPost/updatePost(id)/deletePost(id)`, `getBoardPost`(authorId 포함 — canEdit), `BoardDetail.comments`(authorId — 댓글 삭제 권한). proxy 로직.
- **마크업 보존:** Task6은 import→props·onClick·Composer name/action만. 잔존 grep. 데코·HotSection 정적.
- **Composer/편집 미확정:** Composer 인라인 배선 vs /board/new·edit 최소 화면은 Composer 구조 확인 후 결정(실행자 메모). 어느 쪽이든 회원 작성 + 본인/admin 수정 동작이 목표.
- **플레이스홀더:** 코드 스텝은 실제 코드. Composer/모바일/Sidebar 세부는 파일 확인 후 동일 원칙(실행자 메모 명시).
