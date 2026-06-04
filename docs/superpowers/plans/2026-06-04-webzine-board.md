# 신학원웹진(webzine) 기사 DB 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development 또는 executing-plans. committee 패턴을 따르되 **첨부·댓글 없이**, 매거진 특화(featured·cover·read 파생)를 더한다. spec: docs/superpowers/specs/2026-06-04-webzine-board-design.md.

**Goal:** 신학원웹진 기사(표지 에세이 + 그리드)를 DB 연동하고 상세 페이지·admin CRUD를 제공한다. cover·read는 파생, 댓글·첨부 없음.

**Architecture:** posts(section='webzine'). 순수 매퍼가 cover(카테고리 맵)·read(본문 길이)·tag 파생. 서버 페이지가 기사 영역 props 주입(아카이브·현재호 라벨 정적).

**Tech Stack:** Next.js 16, Drizzle/postgres-js, zod, requireAdmin.

## 공통 제약
- **디자인 보존**: 기사 영역(표지 에세이 블록·그리드·카테고리 nav 카운트)만 mock→props·라우팅. 일러스트(CoverArt/CoverWilderness)·아카이브·마스트헤드 불변.
- admin 전용 쓰기, 공개 열람. 한국어 주석. 커밋 트레일러 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- 댓글/첨부/좋아요 인프라 불사용.

---

## Task 1: 매퍼 lib/webzine.ts + verify

**Files:** Create `web/src/lib/webzine.ts`, `web/scripts/verify-webzine.mjs`; Modify `web/src/lib/webzine-data.ts`(id string), `web/package.json`.

- [ ] **Step 1**: `lib/webzine.ts` 작성(순수):
  - `WEBZINE_CATEGORIES_KO = ["신학산책","현장에서","북리뷰","에세이","교회사","대담"]`
  - `WZ_CATEGORY_EN`(tag): 신학산책→THEOLOGY, 현장에서→FIELD, 북리뷰→REVIEW, 에세이→ESSAY, 교회사→HISTORY, 대담→DIALOGUE
  - `WZ_CATEGORY_COVER`: 신학산책→book, 현장에서→rural, 북리뷰→book2, 에세이→child, 교회사→history, 대담→dialogue. 폴백 "book"
  - `readingTime(len: number): string` → `${Math.max(1, Math.round(len/350))}분`
  - `WebzineRow` 타입: {id:string, category:string|null, title, excerpt:string|null, viewCount, createdAt:Date, isPinned:boolean, authorName:string|null, authorTitle:string|null, bodyLength:number}
  - `toWebzineArticleView(row): WebzineArticle` — cat=유효 카테고리(폴백 "에세이"), tag=WZ_CATEGORY_EN[cat], cover=WZ_CATEGORY_COVER[cat], author=formatAuthor(name,title), date=formatDate(createdAt), read=readingTime(bodyLength), excerpt=excerpt??""
  - `CURRENT_ISSUE = "Vol. 24 · 2026 봄호"` (정적 현재호 라벨 상수)
  - `toWebzineFeaturedView(row): WebzineFeatured` — issue=CURRENT_ISSUE, category=tag, title, subtitle=excerpt??"", author, authorRole=authorTitle??"", date, read, cover:"wilderness"
  - import 타입 `WebzineArticle`·`WebzineFeatured`·`WebzineCategory` from `./webzine-data`; `formatDate`·`formatAuthor` from `./format.ts`.
- [ ] **Step 2**: `webzine-data.ts`의 `WebzineArticle.id`를 number→string, `WZ_ARTICLES`의 id(1~6)를 `"1"~"6"`로. (WZ_BACK_ISSUES 등 정적은 유지)
- [ ] **Step 3**: `verify-webzine.mjs` 작성 — cover/tag 맵·readingTime·매퍼 필드·폴백 단언. `package.json`에 `"webzine:verify": "node scripts/verify-webzine.mjs"`.
- [ ] **Step 4**: `pnpm webzine:verify` + `pnpm exec tsc --noEmit`.
- [ ] **Step 5**: 커밋 `feat: 신학원웹진 순수 매퍼·cover/read 파생 추가`.

---

## Task 2: 서비스 server/services/webzine.ts

**Files:** Create `web/src/server/services/webzine.ts`

- [ ] **Step 1**: 작성(`import "server-only"`):
  - `SECTION="webzine"`. baseRows: posts+users leftJoin, select id·category·title·excerpt·viewCount·createdAt·isPinned·authorName(users.name)·authorTitle(users.title)·`bodyLength: sql<number>\`coalesce(length(${posts.body}),0)\``. where section+isPublished.
  - `getWebzineListData(): { featured, articles, categories }` — rows orderBy isPinned desc, createdAt desc. featured = 첫 isPinned 행(없으면 첫 행) → toWebzineFeaturedView; articles = featured 제외 나머지 → toWebzineArticleView[]. categories = 카운트(전체 없이 6종 또는 디자인대로; 디자인 nav는 '전체' + 6 카테고리이므로 WebzineCategory[]에 카운트만 채움 — '전체'는 컴포넌트가 별도 표시).
  - `getWebzineArticle(id)` → 상세({id, tag, cat, title, subtitle(excerpt), body, author, authorRole, date, read, viewCount}) | null. viewCount++ 는 페이지에서 별도 `incrementWebzineView`로.
  - `incrementWebzineView(id)`.
  - `getWebzineArticleForEdit(id)` → {id, category, title, excerpt, body, isPinned}.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 신학원웹진 목록·상세 서비스 추가`.

---

## Task 3: 액션 server/actions/webzine.ts

**Files:** Create `web/src/server/actions/webzine.ts`

- [ ] **Step 1**: committee actions 구조 참고(첨부·deletePostFiles 제외). `requireAdmin`, zod(title·category=WEBZINE_CATEGORIES_KO·excerpt·body·isPinned coerce.boolean), `createPost`(insert section='webzine', redirect `/webzine/${id}`), `updatePost(id,...)`(redirect `/webzine/${id}`), `deletePost(id)`(posts delete, redirect `/webzine`). `PostFormState` export.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 신학원웹진 admin 작성·수정·삭제 Server Action`.

---

## Task 4: 상세 페이지 webzine/[id]/page.tsx

**Files:** Create `web/src/app/webzine/[id]/page.tsx`

- [ ] **Step 1**: 서버 컴포넌트. getWebzineArticle(id)→없으면 notFound, incrementWebzineView(id). tag·제목·부제·작성자·authorRole·날짜·read·본문(whiteSpace pre-wrap). admin이면 수정 링크 `/admin/webzine/${id}/edit` + 삭제 폼(deletePost.bind). `← 신학원웹진` → /webzine. 댓글 없음.
- [ ] **Step 2**: `pnpm exec tsc --noEmit`.
- [ ] **Step 3**: 커밋 `feat: 신학원웹진 상세 페이지(admin 수정삭제)`.

---

## Task 5: admin 페이지

**Files:** Create `web/src/app/(admin)/admin/webzine/EditorForm.tsx`, `.../new/page.tsx`, `.../[id]/edit/page.tsx`

- [ ] **Step 1**: training/committee admin 참고. EditorForm(webzine 전용): title·category(WEBZINE_CATEGORIES_KO)·excerpt(부제)·body·isPinned 체크박스. new: requireAdmin + `<EditorForm action={createPost} submitLabel="발행" />`. edit: requireAdmin + getWebzineArticleForEdit + `<EditorForm action={updatePost.bind(null,id)} initial={...} submitLabel="수정 저장" />` + 삭제 폼. (AttachmentManager 없음)
- [ ] **Step 2**: `pnpm exec tsc --noEmit` + `pnpm build`(라우트 /webzine/[id], /admin/webzine/new, /admin/webzine/[id]/edit).
- [ ] **Step 3**: 커밋 `feat: 신학원웹진 admin 작성·수정 페이지`.

---

## Task 6: 목록 페이지 배선

**Files:** Modify `web/src/app/webzine/page.tsx`, `WebzineDesktop.tsx`, `WebzineMobile.tsx`

- [ ] **Step 1**: page.tsx 서버: `getWebzineListData()` → device 분기 → `WebzineDesktop`/`WebzineMobile`에 `featured`·`articles`·`categories` props(palette는 기존대로). 현재호 라벨·아카이브는 컴포넌트 내 정적 유지(WZ_BACK_ISSUES, CURRENT_ISSUE 상수).
- [ ] **Step 2**: WebzineDesktop — props 받기. 표지 에세이 블록(WZ_FEATURED→featured), 그리드(WZ_ARTICLES→articles), 카테고리 nav 카운트(WZ_CATEGORIES→categories). 표지 `전문 읽기` 버튼·기사 `<article>` 클릭 → `/webzine/${id}` (router.push; 'use client' 필요 시 추가하거나, Link로 감싸되 마크업 보존 — onClick 우선). 일러스트·아카이브·마스트헤드 불변. featured.cover는 항상 CoverWilderness.
- [ ] **Step 3**: WebzineMobile — 동일하게 기사 영역 props 배선. 이벤트성 정적 영역 보존.
- [ ] **Step 4**: `grep -rn "WZ_ARTICLES\|WZ_FEATURED\|WZ_CATEGORIES" src/app/webzine` → 기사 영역에서 제거 확인(WZ_BACK_ISSUES·CURRENT_ISSUE 잔존 정상).
- [ ] **Step 5**: `pnpm lint && pnpm build`.
- [ ] **Step 6**: 커밋 `feat: 신학원웹진 기사 목록 DB 연동 배선 (마크업 보존)`.

---

## Task 7: seed + e2e + 리뷰 + PR

**Files:** Modify `web/scripts/dev-db.mjs`

- [ ] **Step 1**: dev-db에 webzine seed(멱등, section='webzine'). isPinned 1개(표지) + 카테고리 분산 기사 5~6개, body는 read 계산되게 적당 길이. adminId 작성.
- [ ] **Step 2**: 회귀 `pnpm webzine:verify && committee/resource/board/training verify`.
- [ ] **Step 3**: Preview e2e — 목록(표지+그리드 DB), 기사→상세(본문), admin 작성/수정/삭제, 비admin /admin/webzine 가드, 아카이브 정적.
- [ ] **Step 4**: 최종 홀리스틱 리뷰 → 푸시+PR(승인 후).

## Self-Review
- 범위: 기사 목록+상세 DB, cover/read 파생, 댓글·첨부 없음, 아카이브 정적. ✓
- 보안: admin CRUD requireAdmin, 파라미터 바인딩. ✓
- 디자인 보존: 기사 영역만 props, 일러스트·아카이브 불변. ✓
- 타입: WebzineArticle.id string, 매퍼/서비스/페이지 일관. ✓
