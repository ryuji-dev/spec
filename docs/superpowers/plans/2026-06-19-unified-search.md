# 통합 검색 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 죽어 있던 검색 버튼을 살려, 모든 공개 글(posts 6섹션)을 가로지르는 전용 결과 페이지(`/search?q=...`)를 제공한다.

**Architecture:** Server Component 페이지가 `server/services/search.ts`를 직접 호출(HTTP hop·Route Handler 없음). 검색은 `title/excerpt/body` ilike 부분일치, 공개 글만, 최신순 상위 50건. 섹션→경로/라벨 매핑은 `home.ts`·`gallery.ts`에서 공용 모듈 `lib/section-meta.ts`로 추출해 재사용. 페이지는 기존 `/notice`·`/gallery`와 같은 device-split.

**Tech Stack:** Next.js 16 App Router(Server Component), TypeScript strict, supabase-js(PostgREST), CSS Modules.

**검증 방식(이 저장소 규약):** 단위 테스트 러너가 없으므로 각 태스크는 `pnpm lint && pnpm build` + 로컬 Supabase 시드 데이터 기반 브라우저 e2e로 검증한다(기존 plan들과 동일).

---

## 파일 구조

- Create: `src/lib/section-meta.ts` — 섹션 매핑 공용 상수(`SECTION_LABEL`/`SECTION_ROUTE`/`SECTION_PHOTO_TYPE`, `PostSection` 타입).
- Modify: `src/server/services/home.ts` — 로컬 섹션 상수 제거 → `section-meta` import.
- Modify: `src/server/services/gallery.ts` — 로컬 섹션 상수 제거 → `section-meta` import.
- Create: `src/server/services/search.ts` — `sanitizeQuery` + `searchPosts`.
- Create: `src/app/search/page.tsx` — device-split 진입.
- Create: `src/app/search/_components/desktop/SearchDesktop.tsx` + `.module.css`.
- Create: `src/app/search/_components/mobile/SearchMobile.tsx` + `.module.css`.
- Modify: `src/app/_components/DesktopNav.tsx` — 검색 `button` → `Link href="/search"`.
- Modify: `src/app/_components/MobileStickyHeader.tsx` — 검색 `button` → `Link href="/search"`.

---

## Task 1: 섹션 매핑 공용 모듈 추출

순수 리팩터(동작 불변). `home.ts`·`gallery.ts`의 중복 상수를 한 곳으로 모은다.

**Files:**
- Create: `src/lib/section-meta.ts`
- Modify: `src/server/services/home.ts`
- Modify: `src/server/services/gallery.ts`

- [ ] **Step 1: 공용 모듈 작성**

`src/lib/section-meta.ts`:
```ts
import type { Database } from "@/lib/database.types";
import type { PhotoTileType } from "@/lib/main-page-data";

export type PostSection = Database["public"]["Enums"]["post_section"];

// 섹션 → 한글 라벨(목록 뱃지·태그 폴백).
export const SECTION_LABEL: Record<PostSection, string> = {
  notice: "공지",
  board: "게시판",
  committee: "교육위원회",
  training: "강습회",
  webzine: "웹진",
  resource: "자료",
};

// 섹션 → 공개 상세 경로. 'resource'는 라우트가 복수형(/resources).
export const SECTION_ROUTE: Record<PostSection, string> = {
  notice: "/notice",
  board: "/board",
  committee: "/committee",
  training: "/training",
  webzine: "/webzine",
  resource: "/resources",
};

// 섹션 → 사진 그라데이션 폴백 타입(실이미지 대신 브랜드 그라데이션).
export const SECTION_PHOTO_TYPE: Record<PostSection, PhotoTileType> = {
  notice: "mountain",
  board: "music",
  committee: "meeting",
  training: "camp",
  webzine: "book",
  resource: "book",
};
```

- [ ] **Step 2: home.ts에서 로컬 상수 제거·치환**

`src/server/services/home.ts`에서 로컬 `SECTION_LABEL`(현 29-37행)과 `SECTION_PHOTO_TYPE`(현 39-46행) 정의를 삭제하고, 파일 상단 import에 추가:
```ts
import { SECTION_LABEL, SECTION_PHOTO_TYPE } from "@/lib/section-meta";
```
`import type { PhotoTileType } from "@/lib/main-page-data";`는 다른 곳에서 여전히 쓰이면 유지, 안 쓰이면 제거(빌드/린트로 확인). 사용처(`SECTION_LABEL[r.section]`, `SECTION_PHOTO_TYPE[r.section]`)는 그대로 둔다.

- [ ] **Step 3: gallery.ts에서 로컬 상수 제거·치환**

`src/server/services/gallery.ts`에서 로컬 `SECTION_LABEL`(16-23행)·`SECTION_PHOTO_TYPE`(26-33행)·`SECTION_ROUTE`(36-43행) 정의를 삭제하고 import 추가:
```ts
import { SECTION_LABEL, SECTION_PHOTO_TYPE, SECTION_ROUTE } from "@/lib/section-meta";
```
`import type { PhotoTileType }`는 `GalleryTile` 타입 정의에서 계속 쓰이므로 유지. 사용처 로직(`SECTION_ROUTE[r.section]`, `if (!route) return null` 등)은 그대로 둔다.

- [ ] **Step 4: 린트·빌드로 회귀 확인**

Run: `pnpm lint && pnpm build`
Expected: 통과(에러·미사용 import 경고 없음).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/section-meta.ts src/server/services/home.ts src/server/services/gallery.ts
git commit -m "refactor: 섹션 매핑 상수 공용 모듈(section-meta)로 추출"
```

---

## Task 2: 검색 서비스(searchPosts)

**Files:**
- Create: `src/server/services/search.ts`

- [ ] **Step 1: 서비스 작성**

`src/server/services/search.ts`:
```ts
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatDate } from "@/lib/format";
import { SECTION_LABEL, SECTION_ROUTE, type PostSection } from "@/lib/section-meta";

const MAX_QUERY_LEN = 100;
const RESULT_LIMIT = 50;
const SNIPPET_LEN = 120;

export type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  section: PostSection;
  sectionLabel: string;
  date: string;
  href: string;
};

/**
 * 사용자 입력 정제. PostgREST .or()는 ','로 필터를, '()'로 그룹을 구분하고
 * '*'/'%'는 ilike 와일드카드다 → 구문 깨짐·의도치 않은 와일드카드를 막기 위해 제거.
 */
export function sanitizeQuery(raw: string): string {
  return raw
    .trim()
    .slice(0, MAX_QUERY_LEN)
    .replace(/[,()*%\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSnippet(excerpt: string | null, body: string | null): string {
  const src = (excerpt ?? body ?? "").replace(/\s+/g, " ").trim();
  return src.length > SNIPPET_LEN ? `${src.slice(0, SNIPPET_LEN)}…` : src;
}

export async function searchPosts(rawQuery: string): Promise<SearchResult[]> {
  const q = sanitizeQuery(rawQuery);
  if (!q) return [];

  const pat = `%${q}%`;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, body, section, created_at")
    .eq("is_published", true)
    .or(`title.ilike.${pat},excerpt.ilike.${pat},body.ilike.${pat}`)
    .order("created_at", { ascending: false })
    .limit(RESULT_LIMIT);
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    snippet: toSnippet(r.excerpt, r.body),
    section: r.section,
    sectionLabel: SECTION_LABEL[r.section] ?? "",
    date: formatDate(new Date(r.created_at)),
    href: `${SECTION_ROUTE[r.section]}/${r.id}`,
  }));
}
```

- [ ] **Step 2: 린트·빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add src/server/services/search.ts
git commit -m "feat: 통합 검색 서비스(searchPosts) 추가"
```

---

## Task 3: /search 데스크톱 화면

**Files:**
- Create: `src/app/search/_components/desktop/SearchDesktop.tsx`
- Create: `src/app/search/_components/desktop/SearchDesktop.module.css`

- [ ] **Step 1: 컴포넌트 작성**

`src/app/search/_components/desktop/SearchDesktop.tsx`:
```tsx
import Link from "next/link";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import type { SearchResult } from "@/server/services/search";
import styles from "./SearchDesktop.module.css";

type Props = { query: string; results: SearchResult[] };

export default function SearchDesktop({ query, results }: Props) {
  const hasQuery = query.trim().length > 0;
  return (
    <main className={styles.page}>
      <PageHeroDesktop kicker="SEARCH" title="통합 검색" lead="공지·게시판·교육위원회·수련회·웹진·자료를 한 번에 찾습니다." />
      <div className={styles.body}>
        <form className={styles.searchForm} method="get" action="/search">
          <input
            className={styles.input}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="검색어를 입력하세요"
            aria-label="검색어"
            autoFocus
          />
          <button type="submit" className={styles.submit}>검색</button>
        </form>

        {!hasQuery ? (
          <p className={styles.hint}>검색어를 입력해 주세요.</p>
        ) : results.length === 0 ? (
          <p className={styles.hint}>‘{query}’에 대한 검색 결과가 없습니다.</p>
        ) : (
          <>
            <p className={styles.count}>검색 결과 {results.length}개</p>
            <ul className={styles.list}>
              {results.map((r) => (
                <li key={r.id} className={styles.item}>
                  <Link href={r.href} className={styles.itemLink}>
                    <div className={styles.itemHead}>
                      <span className={styles.badge}>{r.sectionLabel}</span>
                      <span className={styles.date}>{r.date}</span>
                    </div>
                    <h3 className={styles.title}>{r.title}</h3>
                    {r.snippet && <p className={styles.snippet}>{r.snippet}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 스타일 작성**

`src/app/search/_components/desktop/SearchDesktop.module.css`:
```css
.page {
  min-height: 100vh;
  background: var(--palette-bg);
  color: var(--palette-ink);
}

.body {
  max-width: 920px;
  margin: 0 auto;
  padding: 40px 32px 96px;
}

.searchForm {
  display: flex;
  gap: 10px;
  margin-bottom: 32px;
}

.input {
  flex: 1;
  padding: 14px 18px;
  font-size: 16px;
  border: 1px solid var(--palette-line);
  border-radius: 12px;
  background: var(--palette-surface);
  color: var(--palette-ink);
}

.input:focus {
  outline: none;
  border-color: var(--palette-primary);
}

.submit {
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--palette-primary);
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.hint {
  padding: 48px 0;
  text-align: center;
  color: var(--palette-muted);
  font-size: 15px;
}

.count {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--palette-muted);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item {
  border: 1px solid var(--palette-line);
  border-radius: 14px;
  background: var(--palette-surface);
  transition: border-color 0.2s ease;
}

.item:hover {
  border-color: var(--palette-primary);
}

.itemLink {
  display: block;
  padding: 20px 22px;
  text-decoration: none;
  color: inherit;
}

.itemHead {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--palette-primary);
  background: color-mix(in srgb, var(--palette-primary) 12%, transparent);
  padding: 3px 10px;
  border-radius: 999px;
}

.date {
  font-size: 12px;
  color: var(--palette-muted);
}

.title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 600;
}

.snippet {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--palette-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- [ ] **Step 3: 린트 확인(페이지 미연결이라 빌드는 Task 5에서)**

Run: `pnpm lint`
Expected: 통과.

- [ ] **Step 4: 커밋**

```bash
git add src/app/search/_components/desktop/
git commit -m "feat: 통합 검색 데스크톱 화면 추가"
```

---

## Task 4: /search 모바일 화면

**Files:**
- Create: `src/app/search/_components/mobile/SearchMobile.tsx`
- Create: `src/app/search/_components/mobile/SearchMobile.module.css`

- [ ] **Step 1: 컴포넌트 작성**

`src/app/search/_components/mobile/SearchMobile.tsx`:
```tsx
import Link from "next/link";
import { PageHeroMobile } from "@/app/_components/PageHero";
import BottomTabBar from "@/app/main/_components/mobile/BottomTabBar";
import type { SearchResult } from "@/server/services/search";
import styles from "./SearchMobile.module.css";

type Props = { query: string; results: SearchResult[] };

export default function SearchMobile({ query, results }: Props) {
  const hasQuery = query.trim().length > 0;
  return (
    <main className={styles.page}>
      <PageHeroMobile kicker="SEARCH" title="통합 검색" lead="전체 콘텐츠를 한 번에 찾습니다." />
      <div className={styles.body}>
        <form className={styles.searchForm} method="get" action="/search">
          <input
            className={styles.input}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="검색어를 입력하세요"
            aria-label="검색어"
          />
          <button type="submit" className={styles.submit}>검색</button>
        </form>

        {!hasQuery ? (
          <p className={styles.hint}>검색어를 입력해 주세요.</p>
        ) : results.length === 0 ? (
          <p className={styles.hint}>‘{query}’에 대한 검색 결과가 없습니다.</p>
        ) : (
          <>
            <p className={styles.count}>검색 결과 {results.length}개</p>
            <ul className={styles.list}>
              {results.map((r) => (
                <li key={r.id} className={styles.item}>
                  <Link href={r.href} className={styles.itemLink}>
                    <div className={styles.itemHead}>
                      <span className={styles.badge}>{r.sectionLabel}</span>
                      <span className={styles.date}>{r.date}</span>
                    </div>
                    <h3 className={styles.title}>{r.title}</h3>
                    {r.snippet && <p className={styles.snippet}>{r.snippet}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <BottomTabBar />
    </main>
  );
}
```

- [ ] **Step 2: 스타일 작성**

`src/app/search/_components/mobile/SearchMobile.module.css`:
```css
.page {
  min-height: 100vh;
  background: var(--palette-bg);
  color: var(--palette-ink);
  padding-bottom: 88px; /* BottomTabBar 높이 확보 */
}

.body {
  padding: 24px 18px 32px;
}

.searchForm {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  font-size: 16px; /* iOS 자동 확대 방지 */
  border: 1px solid var(--palette-line);
  border-radius: 10px;
  background: var(--palette-surface);
  color: var(--palette-ink);
}

.input:focus {
  outline: none;
  border-color: var(--palette-primary);
}

.submit {
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--palette-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
}

.hint {
  padding: 40px 0;
  text-align: center;
  color: var(--palette-muted);
  font-size: 14px;
}

.count {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--palette-muted);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  border: 1px solid var(--palette-line);
  border-radius: 12px;
  background: var(--palette-surface);
}

.itemLink {
  display: block;
  padding: 16px 16px;
  text-decoration: none;
  color: inherit;
}

.itemHead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--palette-primary);
  background: color-mix(in srgb, var(--palette-primary) 12%, transparent);
  padding: 2px 9px;
  border-radius: 999px;
}

.date {
  font-size: 11px;
  color: var(--palette-muted);
}

.title {
  margin: 0 0 5px;
  font-size: 15.5px;
  font-weight: 600;
}

.snippet {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--palette-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- [ ] **Step 3: 린트 확인**

Run: `pnpm lint`
Expected: 통과.

- [ ] **Step 4: 커밋**

```bash
git add src/app/search/_components/mobile/
git commit -m "feat: 통합 검색 모바일 화면 추가"
```

---

## Task 5: /search 페이지(device-split) + 진입점 연결

**Files:**
- Create: `src/app/search/page.tsx`
- Modify: `src/app/_components/DesktopNav.tsx`
- Modify: `src/app/_components/MobileStickyHeader.tsx`

- [ ] **Step 1: 페이지 작성**

`src/app/search/page.tsx`:
```tsx
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { searchPosts } from "@/server/services/search";
import DesktopNav from "@/app/_components/DesktopNav";
import SearchDesktop from "./_components/desktop/SearchDesktop";
import SearchMobile from "./_components/mobile/SearchMobile";

/** 통합 검색 — 공개 글 전체를 title/excerpt/body로 검색, 최신순 상위 50건. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
  const results = query.trim() ? await searchPosts(query) : [];

  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));

  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <SearchDesktop query={query} results={results} />
      </>
    );
  }
  return <SearchMobile query={query} results={results} />;
}
```

- [ ] **Step 2: DesktopNav 검색 버튼 연결**

`src/app/_components/DesktopNav.tsx`의 검색 `<button type="button" className={styles.searchBtn} aria-label="검색">…</button>`(56-61행)을 동일 클래스·아이콘을 유지한 채 `Link`로 치환:
```tsx
        <Link href="/search" className={styles.searchBtn} aria-label="검색">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M13 13 L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>
```
`Link`는 이미 import됨. `.searchBtn`이 button 전제 스타일이면 빌드 후 시각 확인(필요 시 inline `style={{ textDecoration: "none" }}`).

- [ ] **Step 3: MobileStickyHeader 검색 버튼 연결**

`src/app/_components/MobileStickyHeader.tsx`의 검색 `<button type="button" className={styles.searchBtn} aria-label="검색">…</button>`을 `Link href="/search"`로 치환(아이콘·클래스 유지). `Link`는 이미 import됨.
```tsx
      <Link href="/search" className={styles.searchBtn} aria-label="검색">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="8" cy="8" r="6" stroke="var(--palette-ink)" strokeWidth="1.5" fill="none" />
          <path d="M13 13 L17 17" stroke="var(--palette-ink)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Link>
```
> 주의: 이 파일은 PR #41(모바일 로그인)에서도 수정됨. 이 브랜치는 origin/main 기준이라 충돌 없이 button만 존재. PR #41 머지 후 리베이스 시 양쪽 변경(로그인 추가 + 검색 Link화)을 모두 보존하도록 병합.

- [ ] **Step 4: 린트·빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 통과. `/search` 라우트가 빌드 산출물에 등장.

- [ ] **Step 5: 커밋**

```bash
git add src/app/search/page.tsx src/app/_components/DesktopNav.tsx src/app/_components/MobileStickyHeader.tsx
git commit -m "feat: /search 페이지 추가 및 검색 버튼 진입점 연결"
```

---

## Task 6: 로컬 e2e 검증·문서 커밋

**Files:** (코드 변경 없음 — 검증·정리)

- [ ] **Step 1: 개발 서버 기동 후 데스크톱(1280×800) 검증**

- `/search` 직접 접근 → "검색어를 입력해 주세요" 표시.
- 시드 데이터에 존재하는 키워드로 `?q=` 검색 → 결과 목록·섹션 뱃지·"검색 결과 N개" 표시.
- 결과 항목 클릭 → 해당 `SECTION_ROUTE/{id}` 상세로 이동.
- 없는 키워드 → "검색 결과가 없습니다".
- 특수문자(`,`, `(`, `%`, `*`) 입력 → 오류 없이 안전 처리(빈/정상 결과).
- 상단 검색 아이콘 클릭 → `/search` 이동.

- [ ] **Step 2: 모바일(390×844, 모바일 UA) 검증**

- `SearchMobile` 렌더 + `BottomTabBar` 노출.
- 스크롤 시 스티키 헤더 검색 아이콘 → `/search` 이동.

- [ ] **Step 3: 리팩터 회귀 확인**

- `/main` 사진 타일·메뉴 링크 정상, `/gallery` 타일·링크 정상(섹션 매핑 공용화 영향 없음).

- [ ] **Step 4: 증빙 스크린샷 + plan 커밋**

```bash
git add docs/superpowers/plans/2026-06-19-unified-search.md
git commit -m "docs: 통합 검색 구현 plan 추가"
```

---

## Self-Review 메모

- **Spec 커버리지**: UX(전용 페이지)=Task 5, 필드(title/excerpt/body)=Task 2, 결과 표시(통합·뱃지·최신순·50건·카운트)=Task 2·3·4, device-split=Task 5, 진입점=Task 5, 보안(정제·is_published)=Task 2, 공용화=Task 1, 상태별 화면=Task 3·4, 검증=Task 6. 누락 없음.
- **타입 일관성**: `SearchResult`(Task 2) ↔ `SearchDesktop`/`SearchMobile` props(Task 3·4) 일치. `PostSection`·`SECTION_*`(Task 1) ↔ search.ts(Task 2) 일치.
- **placeholder**: 없음(모든 코드 블록 구체화).
