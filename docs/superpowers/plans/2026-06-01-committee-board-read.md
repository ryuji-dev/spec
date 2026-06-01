# 교육위원회 게시판 — 읽기 경로 구현 Plan (Plan 1/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비로그인 포함 누구나 교육위원회 게시판 글을 PostgreSQL에서 읽는다(목록 + 상세). 기존 목록 디자인 마크업은 100% 보존한다.

**Architecture:** 접근법 A(뷰모델 서비스 계층). 순수 매핑(`lib/committee.ts`, DB 무관·클라이언트 안전)으로 DB 행을 디자인 `Post` 뷰모델로 변환하고, `server/services/committee.ts`가 Drizzle 조회 후 이 매퍼를 호출한다. 서버 컴포넌트(`committee/page.tsx`)가 서비스를 호출해 클라이언트 컴포넌트에 **props로 주입**한다(마크업·Tailwind 무변경, 데이터 바인딩·라우팅만 추가).

**Tech Stack:** Next.js 16, Drizzle ORM(postgres-js), PGlite(로컬 검증), TypeScript strict.

**검증 방식(이 저장소 관례):** 단위 테스트 러너(jest/vitest) 없음. 대신 ① 순수 함수는 `node`로 직접 import하는 `scripts/verify-committee.mjs`(타입 스트리핑), ② 스키마·DB는 PGlite 스모크(`scripts/verify-db.mjs` 확장), ③ `pnpm lint`/`pnpm build`, ④ Preview 브라우저 e2e로 검증한다.

**범위 밖(후속 plan):** 글 작성/수정/삭제·에디터·파일 업로드(Plan 2), 댓글 작성/삭제 UI(Plan 3), 실데이터 태그·작성자 사이드바, 위원회 직책 필드, 마크다운, 검색·무한스크롤, 서버 페이지네이션(1차는 클라이언트 필터 유지).

---

## File Structure

- `web/src/server/db/schema/posts.ts` — `isPinned` 컬럼 추가 (수정)
- `web/src/server/db/schema/comments.ts` — 댓글 테이블 (신규; 카운트 표시용으로 Plan 1에서 생성, 액션/UI는 Plan 3)
- `web/src/server/db/schema/index.ts` — comments 재export (수정)
- `web/src/server/db/migrations/0001_*.sql` — `pnpm db:generate` 산출물 (신규)
- `web/src/lib/committee.ts` — KO↔EN 카테고리 맵 + 순수 뷰모델 매퍼 (신규, 클라이언트 안전)
- `web/src/lib/committee-data.ts` — `Post.id` 타입 `number`→`string` (수정; mock 상수는 seed 참조용으로 유지)
- `web/src/server/services/committee.ts` — 목록/상세/카운트/인기 서비스 (신규, server-only)
- `web/src/app/committee/page.tsx` — 서비스 호출 → props 주입 (수정)
- `web/src/app/committee/_components/desktop/CommitteeDesktop.tsx` — props 수용 (수정)
- `web/src/app/committee/_components/desktop/Sidebar.tsx` — `popular` props 수용 (수정)
- `web/src/app/committee/_components/mobile/CommitteeMobile.tsx` — props 수용 (수정)
- `web/src/app/committee/[id]/page.tsx` — 상세 최소 화면 (신규)
- `web/scripts/verify-committee.mjs` — 순수 매퍼 검증 (신규)
- `web/scripts/verify-db.mjs` — comments·isPinned·cascade 검증 추가 (수정)
- `web/scripts/dev-db.mjs` — 교육위원회 글 seed 추가 (수정)
- `web/package.json` — `committee:verify` 스크립트 추가 (수정)

---

## Task 1: posts.isPinned 컬럼 + comments 테이블 + 마이그레이션

**Files:**
- Modify: `web/src/server/db/schema/posts.ts`
- Create: `web/src/server/db/schema/comments.ts`
- Modify: `web/src/server/db/schema/index.ts`
- Modify: `web/scripts/verify-db.mjs`

- [ ] **Step 1: posts에 isPinned 추가**

`web/src/server/db/schema/posts.ts`의 `viewCount` 줄 바로 아래에 추가:

```ts
    viewCount: integer("view_count").notNull().default(0),
    // 고정글(상단 핀) 여부 — 섹션 목록 최상단 노출
    isPinned: boolean("is_pinned").notNull().default(false),
```

(`boolean`은 이미 import됨.)

- [ ] **Step 2: comments 테이블 생성**

`web/src/server/db/schema/comments.ts` 신규 작성:

```ts
// 게시글 댓글 — 로그인 회원이 작성. 작성자 삭제 시 댓글은 남기고 작성자만 비운다.
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { users } from "./users";

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("comments_post_id_idx").on(t.postId, t.createdAt)],
);

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
```

- [ ] **Step 3: 스키마 배럴에 comments 추가**

`web/src/server/db/schema/index.ts`:

```ts
// 스키마 배럴 — drizzle.config·db 클라이언트가 이 진입점을 사용
export * from "./users";
export * from "./posts";
export * from "./attachments";
export * from "./comments";
```

- [ ] **Step 4: 마이그레이션 생성**

Run: `cd web && pnpm db:generate`
Expected: `src/server/db/migrations/0001_*.sql` 생성. 출력에 `posts`의 `is_pinned` 추가와 `comments` 테이블 CREATE 포함. `meta` 폴더 갱신.

- [ ] **Step 5: verify-db.mjs에 검증 추가 (실패 확인용 먼저 작성)**

`web/scripts/verify-db.mjs`의 마지막 `console.log("\n✅ DB 스키마 검증 통과");` **앞**에 삽입:

```js
// 9) comments 테이블 + isPinned 컬럼
assert(names.includes("comments"), "comments 테이블 생성됨");
const pin = await db.query(
  `insert into posts (section, title, is_pinned) values ('committee','핀글', true) returning is_pinned`,
);
assert(pin.rows[0].is_pinned === true, "posts.is_pinned 저장됨");

// 10) 댓글 cascade — 글 삭제 시 댓글도 삭제
const cp = await db.query(
  `insert into posts (section, title) values ('committee','댓글대상') returning id`,
);
const cpid = cp.rows[0].id;
await db.query(`insert into comments (post_id, body) values ($1,'안녕')`, [cpid]);
await db.query(`delete from posts where id=$1`, [cpid]);
const cleft = await db.query(`select count(*)::int as n from comments`);
assert(cleft.rows[0].n === 0, "글 삭제 시 댓글 cascade 삭제");
```

- [ ] **Step 6: 검증 실행**

Run: `cd web && pnpm db:verify`
Expected: 모든 `✓` 출력 후 `✅ DB 스키마 검증 통과`. (마이그레이션이 0000+0001 적용으로 표시됨.)

- [ ] **Step 7: 커밋**

```bash
git add web/src/server/db/schema web/src/server/db/migrations web/scripts/verify-db.mjs
git commit -m "feat: posts.isPinned·comments 테이블 추가 + 마이그레이션"
```

---

## Task 2: lib/committee.ts (순수 매퍼·카테고리 맵) + Post.id 타입 변경

**Files:**
- Create: `web/src/lib/committee.ts`
- Modify: `web/src/lib/committee-data.ts`
- Create: `web/scripts/verify-committee.mjs`
- Modify: `web/package.json`

- [ ] **Step 1: 순수 매퍼·맵 작성**

`web/src/lib/committee.ts` 신규:

```ts
// 교육위원회 게시판 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import type {
  Post,
  PostCategoryKo,
  PostCategoryEn,
} from "./committee-data";

// 한국어 카테고리 → 영문 라벨 (디자인 뷰모델 catEn 용)
export const CATEGORY_EN: Record<PostCategoryKo, PostCategoryEn> = {
  공지: "NOTICE",
  회의록: "MINUTES",
  수련회: "TRAINING",
  자료실: "LIBRARY",
  나눔: "SHARE",
};

export const COMMITTEE_CATEGORIES_KO: PostCategoryKo[] = [
  "공지",
  "회의록",
  "수련회",
  "자료실",
  "나눔",
];

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// 서비스가 만든 평면 행 → 디자인 Post 뷰모델
export type CommitteeRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  authorName: string | null;
  authorTitle: string | null;
  commentCount: number;
  attachCount: number;
};

export function toCommitteePostView(row: CommitteeRow, now: Date): Post {
  const cat = (
    row.category && row.category in CATEGORY_EN ? row.category : "나눔"
  ) as PostCategoryKo;
  const name = row.authorName ?? "익명";
  const author = row.authorTitle ? `${name} ${row.authorTitle}` : name;
  return {
    id: row.id,
    cat,
    catEn: CATEGORY_EN[cat],
    title: row.title,
    excerpt: row.excerpt ?? "",
    author,
    authorInit: name.slice(0, 1),
    date: formatDate(row.createdAt),
    views: row.viewCount,
    comments: row.commentCount,
    attach: row.attachCount > 0 ? row.attachCount : undefined,
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}
```

- [ ] **Step 2: Post.id 타입을 string으로 변경**

`web/src/lib/committee-data.ts`의 `Post` 타입에서:

```ts
export type Post = {
  id: string;
```

(기존 `id: number;` → `id: string;`. mock 상수의 숫자 id는 컴파일 호환을 위해 문자열로 바꾼다: `BD_PINNED`의 `id: 0` → `id: "0"`, `BD_POSTS`의 각 `id: 1`→`"1"` … `id: 10`→`"10"`. `BD_POPULAR`/`PopularPost`의 id는 sidebar 전용이므로 그대로 둔다.)

- [ ] **Step 3: 순수 매퍼 검증 스크립트 작성 (실패 확인용 먼저)**

`web/scripts/verify-committee.mjs` 신규:

```js
// 교육위원회 순수 매퍼 검증 — DB 없이 실행.
//   실행: pnpm committee:verify
import { toCommitteePostView, CATEGORY_EN, formatDate } from "../src/lib/committee.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

const now = new Date("2026-06-01T00:00:00Z");

const v = toCommitteePostView(
  {
    id: "abc",
    category: "회의록",
    title: "제5차 회의록",
    excerpt: "요약",
    viewCount: 42,
    createdAt: new Date("2026-05-30T00:00:00Z"),
    authorName: "박혜진",
    authorTitle: "전도사",
    commentCount: 3,
    attachCount: 2,
  },
  now,
);

assert(v.id === "abc", "id 전달");
assert(v.cat === "회의록" && v.catEn === "MINUTES", "카테고리 KO→EN 매핑");
assert(v.author === "박혜진 전도사" && v.authorInit === "박", "작성자·이니셜 조합");
assert(v.date === "2026.05.30", "날짜 포맷 YYYY.MM.DD");
assert(v.attach === 2 && v.comments === 3, "첨부·댓글 카운트");
assert(v.isNew === true, "7일 이내 isNew=true");

// 첨부 0이면 attach undefined, 작성자 없으면 익명, 오래된 글 isNew=false
const v2 = toCommitteePostView(
  {
    id: "x",
    category: null,
    title: "t",
    excerpt: null,
    viewCount: 0,
    createdAt: new Date("2026-04-01T00:00:00Z"),
    authorName: null,
    authorTitle: null,
    commentCount: 0,
    attachCount: 0,
  },
  now,
);
assert(v2.attach === undefined, "첨부 0 → attach undefined");
assert(v2.author === "익명" && v2.excerpt === "", "작성자/요약 폴백");
assert(v2.isNew === false, "오래된 글 isNew=false");
assert(CATEGORY_EN["공지"] === "NOTICE", "CATEGORY_EN 맵");

console.log("\n✅ 교육위원회 순수 매퍼 검증 통과");
```

- [ ] **Step 4: package.json 스크립트 추가**

`web/package.json`의 `scripts`에 추가:

```json
    "committee:verify": "node scripts/verify-committee.mjs",
```

- [ ] **Step 5: 검증 실행**

Run: `cd web && pnpm committee:verify`
Expected: 모든 `✓` 후 `✅ 교육위원회 순수 매퍼 검증 통과`.

- [ ] **Step 6: 타입 검사 통과 확인**

Run: `cd web && pnpm build`
Expected: 빌드 성공(`Post.id` 문자열화로 인한 타입 오류 없음). 실패하면 mock 상수 id 문자열화 누락을 점검.

- [ ] **Step 7: 커밋**

```bash
git add web/src/lib/committee.ts web/src/lib/committee-data.ts web/scripts/verify-committee.mjs web/package.json
git commit -m "feat: 교육위원회 순수 뷰모델 매퍼·카테고리 맵 추가"
```

---

## Task 3: server/services/committee.ts (목록 데이터)

**Files:**
- Create: `web/src/server/services/committee.ts`

- [ ] **Step 1: 서비스 작성**

`web/src/server/services/committee.ts` 신규:

```ts
import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { posts, comments, attachments, users } from "@/server/db/schema";
import {
  toCommitteePostView,
  COMMITTEE_CATEGORIES_KO,
  CATEGORY_EN,
  type CommitteeRow,
} from "@/lib/committee";
import type {
  Post,
  PostCategory,
  PopularPost,
} from "@/lib/committee-data";

const SECTION = "committee" as const;

// 목록 행 공통 SELECT (작성자 조인 + 댓글/첨부 카운트 서브쿼리)
function baseRows() {
  const db = getDb();
  return db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      isPinned: posts.isPinned,
      authorName: users.name,
      authorTitle: users.title,
      commentCount: sql<number>`(select count(*)::int from ${comments} c where c.post_id = ${posts.id})`,
      attachCount: sql<number>`(select count(*)::int from ${attachments} a where a.post_id = ${posts.id})`,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)));
}

export type CommitteeListData = {
  pinned: Post | null;
  posts: Post[];
  categories: PostCategory[];
  popular: PopularPost[];
};

export async function getCommitteeListData(): Promise<CommitteeListData> {
  const now = new Date();
  const rows = await baseRows().orderBy(desc(posts.isPinned), desc(posts.createdAt));

  let pinned: Post | null = null;
  const list: Post[] = [];
  for (const r of rows) {
    const view = toCommitteePostView(r as CommitteeRow, now);
    if (r.isPinned && !pinned) pinned = view;
    else list.push(view);
  }

  // 카테고리 카운트 ('전체' + 5개)
  const counts = await getDb()
    .select({ category: posts.category, n: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .groupBy(posts.category);
  const byCat = new Map(counts.map((c) => [c.category, c.n]));
  const total = counts.reduce((s, c) => s + c.n, 0);
  const categories: PostCategory[] = [
    { ko: "전체", en: "ALL", count: total },
    ...COMMITTEE_CATEGORIES_KO.map((ko) => ({
      ko,
      en: CATEGORY_EN[ko],
      count: byCat.get(ko) ?? 0,
    })),
  ];

  // 인기글 — 조회수 상위 5
  const pop = await getDb()
    .select({ id: posts.id, title: posts.title, views: posts.viewCount })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .orderBy(desc(posts.viewCount))
    .limit(5);
  const popular: PopularPost[] = pop.map((p) => ({
    id: p.id,
    title: p.title,
    views: p.views,
  }));

  return { pinned, posts: list, categories, popular };
}
```

비고: `PopularPost.id`는 sidebar 전용(클릭 비활성)이라 string 할당으로 충분하다. 타입 오류 시 `lib/committee-data.ts`의 `PopularPost.id`를 `string`으로 바꾼다.

- [ ] **Step 2: 빌드로 타입 확인**

Run: `cd web && pnpm build`
Expected: 성공. (서비스는 아직 어디서도 호출되지 않으므로 트리쉐이크되지만 타입 검사는 됨.)

- [ ] **Step 3: 커밋**

```bash
git add web/src/server/services/committee.ts
git commit -m "feat: 교육위원회 목록 데이터 서비스 추가"
```

---

## Task 4: dev-db.mjs에 교육위원회 글 seed

**Files:**
- Modify: `web/scripts/dev-db.mjs`

- [ ] **Step 1: seed 블록 추가**

`web/scripts/dev-db.mjs`의 admin 시드 블록 **다음**, `const server = new PGLiteSocketServer(...)` **앞**에 삽입:

```js
// 교육위원회 게시판 seed (없을 때만) — admin을 작성자로 몇 개 생성
const adminRow = await db.query(`select id from users where email=$1`, [ADMIN_EMAIL]);
const adminId = adminRow.rows[0].id;
const cExists = await db.query(`select 1 from posts where section='committee' limit 1`);
if (cExists.rows.length === 0) {
  const seed = [
    ["공지", "2026년 상반기 교육위원회 정기총회 안내", "5월 24일 주일 오후 2시, 서경교회 본당. 안건과 일정 안내.", true],
    ["회의록", "제 4차 임원회의 회의록 (2026.04.18)", "교사 수련회 일정 확정, 성경고사 본선 진행 안내.", false],
    ["수련회", "2026 봄 교사 수련회 — 사전 신청 마감 안내", "4월 30일까지 각 교회별 명단 제출 바랍니다.", false],
    ["자료실", "주일학교 봄학기 공과 PDF 일괄 다운로드", "유년부·초등부·중고등부 공과 일괄 제공.", false],
    ["나눔", "주일학교 부서 운영, 작은 교회의 한 사례", "학생 9명 교회의 1년 통합 운영 사례를 나눕니다.", false],
  ];
  for (const [cat, title, excerpt, pinned] of seed) {
    await db.query(
      `insert into posts (section, category, title, excerpt, body, author_id, is_pinned)
       values ('committee', $1, $2, $3, $4, $5, $6)`,
      [cat, title, excerpt, excerpt + "\n\n(본문 예시)", adminId, pinned],
    );
  }
  console.log(`[dev-db] 교육위원회 글 ${seed.length}건 seed`);
} else {
  console.log("[dev-db] 교육위원회 글 이미 존재");
}
```

- [ ] **Step 2: DB 재기동으로 seed 확인**

Run:
```bash
cd web && rm -rf .pglite && pnpm dev:db
```
Expected 로그: `[dev-db] 교육위원회 글 5건 seed` 후 `listening`. (확인 후 Ctrl-C로 종료해도 되고, 다음 태스크 위해 켜둬도 됨.)

- [ ] **Step 3: 커밋**

```bash
git add web/scripts/dev-db.mjs
git commit -m "chore: 로컬 dev-db에 교육위원회 글 seed 추가"
```

---

## Task 5: 목록 페이지·컴포넌트 배선 (props 주입, 마크업 보존)

**Files:**
- Modify: `web/src/app/committee/page.tsx`
- Modify: `web/src/app/committee/_components/desktop/CommitteeDesktop.tsx`
- Modify: `web/src/app/committee/_components/desktop/Sidebar.tsx`
- Modify: `web/src/app/committee/_components/mobile/CommitteeMobile.tsx`

> 원칙: **마크업·Tailwind·스타일 변경 금지.** import를 props로 바꾸고, 카드/행에 상세 링크(라우팅)만 추가한다.

- [ ] **Step 1: 서버 페이지에서 서비스 호출 → props 주입**

`web/src/app/committee/page.tsx`를 다음으로 교체:

```tsx
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getCommitteeListData } from "@/server/services/committee";
import DesktopNav from "@/app/_components/DesktopNav";
import CommitteeDesktop from "./_components/desktop/CommitteeDesktop";
import CommitteeMobile from "./_components/mobile/CommitteeMobile";

/**
 * 서경노회 교육위원회 게시판 — DB 연동(읽기). 디자인 마크업 보존.
 * 데이터는 server/services/committee.ts 에서 조회해 클라이언트 컴포넌트에 props로 주입.
 */
export default async function CommitteePage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const data = await getCommitteeListData();
  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <CommitteeDesktop
          pinned={data.pinned}
          posts={data.posts}
          categories={data.categories}
          popular={data.popular}
        />
      </>
    );
  }
  return (
    <CommitteeMobile
      pinned={data.pinned}
      posts={data.posts}
      categories={data.categories}
      popular={data.popular}
    />
  );
}
```

- [ ] **Step 2: CommitteeDesktop이 props 수용**

`web/src/app/committee/_components/desktop/CommitteeDesktop.tsx` 상단을 수정:

1. import에서 mock 상수 제거, 타입 import 추가:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Post,
  PostCategory,
  PopularPost,
} from "@/lib/committee-data";
import { FOREST_PALETTE } from "@/app/_components/shared/palette";
```

(기존 `import { BD_CATEGORIES, BD_PINNED, BD_POSTS } from "@/lib/committee-data";` 줄 삭제.)

2. 컴포넌트 시그니처·본문 상단:

```tsx
type Props = {
  pinned: Post | null;
  posts: Post[];
  categories: PostCategory[];
  popular: PopularPost[];
};

export default function CommitteeDesktop({
  pinned,
  posts,
  categories,
  popular,
}: Props) {
  const router = useRouter();
  const palette = FOREST_PALETTE;
  const [activeCat, setActiveCat] = useState(0);
  const [view, setView] = useState<ViewMode>("mixed");

  const filtered =
    activeCat === 0
      ? posts
      : posts.filter((p) => p.cat === categories[activeCat].ko);
```

3. 본문에서 식별자 치환(마크업 그대로, 참조명만):
   - `BD_POSTS` → `posts`
   - `BD_CATEGORIES` → `categories`
   - `<PinnedCard post={BD_PINNED} .../>` → 핀이 있을 때만 렌더:
     ```tsx
     {pinned && <PinnedCard post={pinned} palette={palette} />}
     ```
   - `<Sidebar palette={palette} />` → `<Sidebar palette={palette} popular={popular} />`
   - `이번 달 새 글 ... {BD_POSTS.filter((p) => p.isNew).length + 1}` 의 `BD_POSTS` → `posts` (장식 통계의 "142"·"38" 하드코딩 숫자는 1차에서 그대로 둔다 — 마크업 보존).

4. 카드/행 클릭 시 상세 이동(라우팅 추가). 각 렌더 지점에 `onClick` 추가:
   - `<PinnedCard ...>` 래퍼가 어렵다면 PinnedCard/PostCard/PostListRow/PostTableRow는 Task 5 Step 4에서 일괄로 `onClick` prop을 받게 한다. **본 스텝에서는** CommitteeDesktop이 `onOpen={(id) => router.push(\`/committee/${id}\`)}`를 각 카드/행에 내려준다:
     ```tsx
     <PostCard key={p.id} post={p} palette={palette} onOpen={() => router.push(`/committee/${p.id}`)} />
     ```
     동일하게 `PinnedCard`, `PostListRow`, `PostTableRow`에 `onOpen` 전달.

- [ ] **Step 3: 카드/행 컴포넌트에 onOpen 라우팅 추가**

`PinnedCard.tsx`, `PostCard.tsx`, `PostListRow.tsx`, `PostTableRow.tsx` 각각:
- `type Props`에 `onOpen?: () => void;` 추가.
- 최상위 `<article>`(또는 루트 요소)에 `onClick={onOpen}` 추가. **스타일/클래스 변경 없음**(이미 `cursor: "pointer"`). 예) `PostListRow.tsx`:
  ```tsx
  type Props = {
    post: Post;
    palette: Palette;
    onOpen?: () => void;
  };

  export default function PostListRow({ post, palette, onOpen }: Props) {
    return (
      <article onClick={onOpen} style={{ /* 기존 그대로 */ }}>
  ```

- [ ] **Step 4: Sidebar가 popular props 수용**

`web/src/app/committee/_components/desktop/Sidebar.tsx`:
- import에서 `BD_POPULAR` 제거(태그·작성자 정적 유지: `BD_TAGS`, `SIDE_AUTHORS`는 그대로 import).
  ```tsx
  import { BD_TAGS, SIDE_AUTHORS } from "@/lib/committee-data";
  import type { PopularPost } from "@/lib/committee-data";
  ```
- `Sidebar`와 `SidePopular` 시그니처에 `popular` 전달:
  ```tsx
  function SidePopular({ palette, popular }: SideProps & { popular: PopularPost[] }) {
    // 본문: BD_POPULAR → popular 로 치환 (map 부분만)
  ```
  ```tsx
  export default function Sidebar({ palette, popular }: SideProps & { popular: PopularPost[] }) {
    return (
      <aside style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <SidePopular palette={palette} popular={popular} />
        <SideTags palette={palette} />
        <SideAuthorsBlock palette={palette} />
      </aside>
    );
  }
  ```

- [ ] **Step 5: CommitteeMobile이 props 수용**

`web/src/app/committee/_components/mobile/CommitteeMobile.tsx`를 열어 desktop과 동일 패턴 적용:
- mock 상수 import → `Props`(pinned/posts/categories/popular)로 교체.
- 내부 자식(PostListMobile/PostCardMobile 등)에 데이터 전달, 카드 클릭 시 `router.push(\`/committee/${id}\`)`.
- **마크업 그대로**, 참조명·props만 교체. (모바일 자식 컴포넌트도 desktop과 같은 방식으로 mock 상수 대신 props/onOpen 수용.)

> 실행자 메모: 모바일 컴포넌트 구조는 파일을 열어 확인 후 동일 원칙으로 배선한다. mock 상수 직접 참조가 남지 않도록 `grep -rn "BD_\|SIDE_AUTHORS" src/app/committee` 로 점검.

- [ ] **Step 6: mock 상수 직접 참조 잔존 점검**

Run: `cd web && grep -rn "BD_PINNED\|BD_POSTS\|BD_CATEGORIES\|BD_POPULAR" src/app/committee`
Expected: 결과 없음(모두 props로 대체). (`BD_TAGS`/`SIDE_AUTHORS`는 정적이라 잔존 가능.)

- [ ] **Step 7: 빌드·린트**

Run: `cd web && pnpm lint && pnpm build`
Expected: 둘 다 성공.

- [ ] **Step 8: 커밋**

```bash
git add web/src/app/committee
git commit -m "feat: 교육위원회 목록 DB 연동 (props 주입, 마크업 보존)"
```

---

## Task 6: 상세 페이지(읽기 전용) + 조회수 증가

**Files:**
- Create: `web/src/app/committee/[id]/page.tsx`
- Modify: `web/src/server/services/committee.ts`

- [ ] **Step 1: 서비스에 상세 조회 + 조회수 증가 추가**

`web/src/server/services/committee.ts` 하단에 추가:

```ts
import { attachments as attachmentsTable } from "@/server/db/schema";

export type CommitteeDetail = {
  id: string;
  category: string | null;
  title: string;
  body: string | null;
  author: string;
  date: string;
  views: number;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
  comments: { id: string; author: string; date: string; body: string }[];
};

export async function getCommitteePost(id: string): Promise<CommitteeDetail | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      body: posts.body,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorTitle: users.title,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .limit(1);
  const r = rows[0];
  if (!r) return null;

  const atts = await db
    .select({
      id: attachmentsTable.id,
      name: attachmentsTable.originalName,
      sizeBytes: attachmentsTable.sizeBytes,
      mime: attachmentsTable.mime,
    })
    .from(attachmentsTable)
    .where(eq(attachmentsTable.postId, id));

  const cms = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorTitle: users.title,
    })
    .from(comments)
    .leftJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.postId, id))
    .orderBy(comments.createdAt);

  const name = r.authorName ?? "익명";
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    body: r.body,
    author: r.authorTitle ? `${name} ${r.authorTitle}` : name,
    date: formatDate(r.createdAt),
    views: r.viewCount,
    attachments: atts.map((a) => ({ ...a, sizeBytes: Number(a.sizeBytes) })),
    comments: cms.map((c) => {
      const cn = c.authorName ?? "익명";
      return {
        id: c.id,
        author: c.authorTitle ? `${cn} ${c.authorTitle}` : cn,
        date: formatDate(c.createdAt),
        body: c.body,
      };
    }),
  };
}

export async function incrementCommitteeView(id: string): Promise<void> {
  await getDb()
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(and(eq(posts.id, id), eq(posts.section, SECTION)));
}
```

(`formatDate`는 `@/lib/committee`에서 이미 import되어 있지 않다면 추가: `import { ..., formatDate } from "@/lib/committee";` — Task 2의 export 사용.)

- [ ] **Step 2: 상세 페이지(최소 화면) 작성**

`web/src/app/committee/[id]/page.tsx` 신규:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCommitteePost,
  incrementCommitteeView,
} from "@/server/services/committee";

// 최소 기능 상세 화면. 디자인 폴리시는 추후 Claude Design 핸드오프로 교체.
export default async function CommitteePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getCommitteePost(id);
  if (!post) notFound();
  await incrementCommitteeView(id);

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/committee" style={{ fontSize: 13, color: "#666" }}>
        ← 목록으로
      </Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {post.category} · {post.author} · {post.date} · 조회 {post.views}
      </p>
      <h1 style={{ fontSize: 26, lineHeight: 1.3 }}>{post.title}</h1>
      <article style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
        {post.body}
      </article>

      {post.attachments.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 15 }}>첨부 ({post.attachments.length})</h2>
          <ul>
            {post.attachments.map((a) => (
              <li key={a.id}>
                {a.name} ({Math.round(a.sizeBytes / 1024)} KB)
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15 }}>댓글 ({post.comments.length})</h2>
        {post.comments.map((c) => (
          <div key={c.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
              {c.author} · {c.date}
            </p>
            <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{c.body}</p>
          </div>
        ))}
        {/* 댓글 작성 폼은 Plan 3에서 추가 */}
      </section>
    </main>
  );
}
```

비고(조회수 증가): 서버 컴포넌트 렌더 중 DB 쓰기는 저트래픽에서 허용. 정확 카운팅·중복 방지는 후속 개선 대상.

- [ ] **Step 3: 빌드**

Run: `cd web && pnpm build`
Expected: 성공. 라우트 목록에 `ƒ /committee/[id]` 표시.

- [ ] **Step 4: 커밋**

```bash
git add web/src/app/committee/[id] web/src/server/services/committee.ts
git commit -m "feat: 교육위원회 글 상세 페이지(읽기) + 조회수 증가"
```

---

## Task 7: 통합 검증 (Preview 브라우저 e2e)

**Files:** (코드 변경 없음 — 동작 확인)

- [ ] **Step 1: 로컬 DB + dev 서버 기동**

Run (별도 백그라운드):
```bash
cd web && rm -rf .pglite && pnpm dev:db
```
그 후 Preview 서버(`.claude/launch.json`의 `web-dev`) 기동, 또는 `pnpm dev`.

- [ ] **Step 2: 목록 페이지 확인 (공개·비로그인)**

브라우저로 `http://localhost:3000/committee` 접속.
Expected: 핀 글("정기총회 안내")이 상단, seed된 5건이 카테고리·작성자(관리자 교육위원회)·날짜와 함께 표시. 카테고리 필터 버튼 카운트가 실제 분포 반영. **레이아웃/스타일이 기존과 동일**.

- [ ] **Step 3: 상세 이동·조회수 증가**

목록에서 글 클릭 → `/committee/[id]` 이동. 제목·본문(pre-wrap)·"조회 N" 표시.
새로고침 시 조회수 1씩 증가 확인.

- [ ] **Step 4: 모바일 뷰 확인**

Preview를 mobile preset으로 리사이즈 후 `/committee` 재방문 → 모바일 레이아웃에서도 seed 글이 표시되고 클릭 시 상세 이동.

- [ ] **Step 5: 회귀 — 빌드/린트/검증 일괄**

Run:
```bash
cd web && pnpm lint && pnpm build && pnpm db:verify && pnpm committee:verify
```
Expected: 모두 성공.

- [ ] **Step 6: (해당 시) 정리**

dev:db·dev 서버 종료. `.pglite`는 gitignore이므로 커밋 대상 아님.

---

## Self-Review 메모 (작성자 확인 완료)

- **스펙 커버리지:** 읽기 공개·목록 mock→DB·상세 최소 화면·뷰모델 매핑·카테고리/인기 사이드바·조회수 = 모두 태스크에 매핑. (쓰기·업로드·댓글 작성은 Plan 2/3로 명시 분리.)
- **타입 일관성:** `Post.id: string`(Task 2) ↔ 서비스 반환(Task 3) ↔ 컴포넌트 props(Task 5) 일치. `toCommitteePostView`/`CommitteeRow`/`getCommitteeListData`/`getCommitteePost`/`incrementCommitteeView` 시그니처 태스크 간 일치.
- **플레이스홀더:** 없음. 모든 코드 스텝에 실제 코드 포함. (모바일 배선 Task 5 Step 5는 파일 구조 확인 후 동일 원칙 적용 — 실행자 메모로 명시.)
- **마크업 보존:** Task 5는 import→props·라우팅 onClick만 추가, 스타일/클래스 무변경. 잔존 점검 grep 스텝 포함.
