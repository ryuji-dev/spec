# 웹진 "지난 호" 실데이터화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 웹진 "지난 호" 섹션을 mock(`WZ_BACK_ISSUES`)에서 조회수 상위 4편의 실 기사로 전환하고, 카드 클릭 시 상세로 이동하게 한다.

**Architecture:** "호" 스키마는 도입하지 않고, `getWebzineListData()`가 이미 조회한 `rows`에서 조회수 상위 4편을 골라 기존 `WebzineBackIssue` 카드 슬롯(`vol`/`issue`/`theme`/`date`)에 기사 데이터를 매핑한다. 타입에 `id`를 추가해 카드 클릭을 `/webzine/{id}`로 연결한다. 마크업은 보존하고 데스크톱 헤더의 사실 문구 한 줄만 교체한다.

**Tech Stack:** TypeScript(strict), Next.js 16(App Router, Server Component + Client Component), supabase-js. 단위 테스트 러너 없음 → `pnpm lint && pnpm build` + 로컬 Supabase e2e로 검증.

---

### Task 1: 타입 확장 + 변환 함수

**Files:**
- Modify: `src/lib/webzine-data.ts` (`WebzineBackIssue` 타입에 `id` 추가)
- Modify: `src/lib/webzine.ts` (`toWebzineBackIssueView` 추가)

- [ ] **Step 1: `WebzineBackIssue` 타입에 `id` 추가**

`src/lib/webzine-data.ts`의 기존 타입:
```ts
export type WebzineBackIssue = {
  vol: string;
  issue: string;
  date: string;
  theme: string;
};
```
을 다음으로 교체:
```ts
export type WebzineBackIssue = {
  id: string;
  vol: string;
  issue: string;
  date: string;
  theme: string;
};
```

- [ ] **Step 2: `webzine.ts`에 `WebzineBackIssue` import + 변환 함수 추가**

`src/lib/webzine.ts` 상단 type import 블록(3~7행)에 `WebzineBackIssue`를 추가:
```ts
import type {
  WebzineArticle,
  WebzineFeatured,
  WebzineArticleCoverType,
  WebzineBackIssue,
} from "./webzine-data";
```

파일 끝(`toWebzineFeaturedView` 아래)에 함수 추가. `resolveCategory`는 같은 파일의 기존 비공개 함수라 그대로 호출 가능:
```ts
// 평면 행 → "지난 호" 카드 뷰모델("지난 글"로 재해석).
// vol=EN 태그, issue=한글 카테고리, theme=제목, date=작성일.
export function toWebzineBackIssueView(row: WebzineRow): WebzineBackIssue {
  const cat = resolveCategory(row.category);
  return {
    id: row.id,
    vol: WZ_CATEGORY_EN[cat],
    issue: cat,
    theme: row.title,
    date: formatDate(row.createdAt),
  };
}
```

- [ ] **Step 3: 린트·타입 확인**

Run: `pnpm lint`
Expected: 통과(에러 없음)

---

### Task 2: 서비스에 `backIssues` 추가

**Files:**
- Modify: `src/server/services/webzine.ts`

- [ ] **Step 1: import에 `toWebzineBackIssueView` + 타입 추가**

`@/lib/webzine` import 블록에 `toWebzineBackIssueView`를 추가하고, `@/lib/webzine-data` 타입 import에 `WebzineBackIssue`를 추가한다. 현재:
```ts
import {
  toWebzineArticleView,
  toWebzineFeaturedView,
  WEBZINE_CATEGORIES_KO,
  WZ_CATEGORY_EN,
  readingTime,
  formatAuthor,
  formatDate,
  type WebzineRow,
} from "@/lib/webzine";
import type {
  WebzineArticle,
  WebzineFeatured,
  WebzineCategory,
} from "@/lib/webzine-data";
```
를 다음으로 교체:
```ts
import {
  toWebzineArticleView,
  toWebzineFeaturedView,
  toWebzineBackIssueView,
  WEBZINE_CATEGORIES_KO,
  WZ_CATEGORY_EN,
  readingTime,
  formatAuthor,
  formatDate,
  type WebzineRow,
} from "@/lib/webzine";
import type {
  WebzineArticle,
  WebzineFeatured,
  WebzineCategory,
  WebzineBackIssue,
} from "@/lib/webzine-data";
```

- [ ] **Step 2: `WebzineListData`에 `backIssues` 필드 추가**

현재:
```ts
export type WebzineListData = {
  featured: WebzineFeatured | null;
  articles: WebzineArticle[];
  categories: WebzineCategory[];
};
```
를 다음으로 교체:
```ts
export type WebzineListData = {
  featured: WebzineFeatured | null;
  articles: WebzineArticle[];
  categories: WebzineCategory[];
  backIssues: WebzineBackIssue[];
};
```

- [ ] **Step 3: 상위 4편 집계 + 반환**

`getWebzineListData` 함수의 `categories` 계산 직후, `return` 직전에 추가한다. 현재 마지막:
```ts
  const categories: WebzineCategory[] = WEBZINE_CATEGORIES_KO.map((ko) => ({
    ko,
    en: WZ_CATEGORY_EN[ko],
    count: byCat.get(ko) ?? 0,
  }));

  return { featured, articles, categories };
```
를 다음으로 교체:
```ts
  const categories: WebzineCategory[] = WEBZINE_CATEGORIES_KO.map((ko) => ({
    ko,
    en: WZ_CATEGORY_EN[ko],
    count: byCat.get(ko) ?? 0,
  }));

  // "지난 호" = 조회수 상위 4편(동점 시 최신). 이미 조회한 rows 재사용.
  const backIssues: WebzineBackIssue[] = [...rows]
    .sort(
      (a, b) =>
        b.view_count - a.view_count ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 4)
    .map((r) => toWebzineBackIssueView(toWebzineRow(r)));

  return { featured, articles, categories, backIssues };
```

> 주의: `toWebzineRow`는 같은 함수 스코프 내 헬퍼라 호출 가능. `rows`는 `created_at` 문자열·`view_count` 숫자를 가진 supabase 행.

- [ ] **Step 4: 린트·타입 확인**

Run: `pnpm lint`
Expected: 통과

---

### Task 3: `page.tsx`에서 props 전달

**Files:**
- Modify: `src/app/webzine/page.tsx`

- [ ] **Step 1: 데스크톱·모바일에 `backIssues` 전달**

`<WebzineDesktop ... />`와 `<WebzineMobile ... />` 두 곳 모두 `categories={data.categories}` 아래에 `backIssues={data.backIssues}`를 추가한다. 예(데스크톱):
```tsx
        <WebzineDesktop
          palette={WEBZINE_PALETTE}
          featured={data.featured}
          articles={data.articles}
          categories={data.categories}
          backIssues={data.backIssues}
        />
```
모바일도 동일하게 `backIssues={data.backIssues}` 추가.

> 이 단계 후 Task 4·5 전까지는 컴포넌트가 prop을 안 받아 타입 에러가 날 수 있다 → Task 4·5까지 끝낸 뒤 빌드한다.

---

### Task 4: 데스크톱 컴포넌트 — props·onClick·카피

**Files:**
- Modify: `src/app/webzine/_components/desktop/WebzineDesktop.tsx`

- [ ] **Step 1: import에서 `WZ_BACK_ISSUES` 제거, 타입 추가**

현재 import:
```tsx
import {
  WZ_BACK_ISSUES,
  type WebzinePalette,
  type WebzineFeatured,
  type WebzineArticle,
  type WebzineCategory,
} from "@/lib/webzine-data";
```
를 다음으로 교체:
```tsx
import {
  type WebzinePalette,
  type WebzineFeatured,
  type WebzineArticle,
  type WebzineCategory,
  type WebzineBackIssue,
} from "@/lib/webzine-data";
```

- [ ] **Step 2: Props 타입·구조분해에 `backIssues` 추가**

현재:
```tsx
type Props = {
  palette: WebzinePalette;
  featured: WebzineFeatured | null;
  articles: WebzineArticle[];
  categories: WebzineCategory[];
};

export default function WebzineDesktop({ palette, featured, articles, categories }: Props) {
```
를 다음으로 교체:
```tsx
type Props = {
  palette: WebzinePalette;
  featured: WebzineFeatured | null;
  articles: WebzineArticle[];
  categories: WebzineCategory[];
  backIssues: WebzineBackIssue[];
};

export default function WebzineDesktop({ palette, featured, articles, categories, backIssues }: Props) {
```

- [ ] **Step 3: 헤더 사실 문구 교체**

`지난 호` 섹션 헤더 단락(현재 문구):
```tsx
              2014년 창간 이후 발행된 23개의 호. 그동안의 글들을 분기별로 모아두었습니다.
```
를 다음으로 교체:
```tsx
              신학원웹진에 실린 글 가운데 많이 읽힌 글들을 다시 모았습니다.
```

- [ ] **Step 4: `WZ_BACK_ISSUES.map` → `backIssues.map` + 카드 onClick**

현재:
```tsx
            {WZ_BACK_ISSUES.map((b, i) => (
              <div
                key={i}
                style={{
                  padding: "24px 26px",
                  background: palette.bg,
                  border: `1px solid ${palette.line}`,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 28,
                }}
              >
```
를 다음으로 교체(데이터 소스·key·onClick만 변경, 스타일 불변):
```tsx
            {backIssues.map((b) => (
              <div
                key={b.id}
                onClick={() => router.push(`/webzine/${b.id}`)}
                style={{
                  padding: "24px 26px",
                  background: palette.bg,
                  border: `1px solid ${palette.line}`,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 28,
                }}
              >
```

> `router`는 이미 컴포넌트 상단에서 `const router = useRouter()`로 선언돼 있어 그대로 사용.

---

### Task 5: 모바일 컴포넌트 — props·onClick

**Files:**
- Modify: `src/app/webzine/_components/mobile/WebzineMobile.tsx`

- [ ] **Step 1: import에서 `WZ_BACK_ISSUES` 제거, 타입 추가**

현재 import:
```tsx
import {
  WZ_BACK_ISSUES,
  type WebzinePalette,
  type WebzineFeatured,
  type WebzineArticle,
  type WebzineCategory,
} from "@/lib/webzine-data";
```
를 다음으로 교체:
```tsx
import {
  type WebzinePalette,
  type WebzineFeatured,
  type WebzineArticle,
  type WebzineCategory,
  type WebzineBackIssue,
} from "@/lib/webzine-data";
```

- [ ] **Step 2: Props 타입·구조분해에 `backIssues` 추가**

`type Props = { ... }`에 `backIssues: WebzineBackIssue[];`를 추가하고, 함수 시그니처 구조분해(현재 `{ palette, deviceType, featured, articles, categories }`)에 `backIssues`를 추가한다.

- [ ] **Step 3: `WZ_BACK_ISSUES.slice(0, 4).map` → `backIssues.slice(0, 4).map` + onClick**

현재:
```tsx
          {WZ_BACK_ISSUES.slice(0, 4).map((b, i) => (
            <div
              key={i}
              style={{
                padding: "16px 14px",
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
```
를 다음으로 교체:
```tsx
          {backIssues.slice(0, 4).map((b) => (
            <div
              key={b.id}
              onClick={() => router.push(`/webzine/${b.id}`)}
              style={{
                padding: "16px 14px",
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
```

> `router`는 모바일 컴포넌트 상단에 이미 `const router = useRouter()`로 선언돼 있다(기사 카드가 사용 중). 없으면 추가.

---

### Task 6: mock 상수 제거

**Files:**
- Modify: `src/lib/webzine-data.ts`

- [ ] **Step 1: `WZ_BACK_ISSUES` 상수 제거**

파일 끝의 `export const WZ_BACK_ISSUES: WebzineBackIssue[] = [ ... ];` 블록 전체를 삭제한다. `WebzineBackIssue` 타입(Task 1에서 `id` 추가됨)은 **유지**한다.

- [ ] **Step 2: 잔존 참조 확인**

Run: `grep -rn "WZ_BACK_ISSUES" src/`
Expected: 결과 없음(0건)

---

### Task 7: 검증 (lint·build·로컬 e2e)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 린트·빌드**

Run: `pnpm lint && pnpm build`
Expected: 모두 통과

- [ ] **Step 2: 조회수 다른 webzine 글 시드**

로컬 Supabase(`npx supabase status`로 URL이 `127.0.0.1`인지 확인) `posts`에 `section='webzine'`, `is_published=true` 글을 조회수 분포가 다르게 5건 이상 시드(예: view 100/80/60/40/20). 상위 4편이 명확히 갈리도록.

- [ ] **Step 3: 데스크톱 "지난 호" 검증**

Preview(`web-dev`, 3000)에서 `/webzine` 데스크톱 렌더 DOM 확인:
- "지난 호" 카드 4개가 **조회수 상위 4편**의 제목(`theme` 슬롯)·EN 태그(`vol`)·한글 카테고리(`issue`)·작성일(`date`)을 노출.
- 헤더 문구가 "…많이 읽힌 글들을 다시 모았습니다."로 바뀌었는지.
- 카드 클릭 시 `/webzine/{id}`로 이동하는지.

- [ ] **Step 4: 모바일 검증**

`/webzine` 모바일(ios/android UA)에서 "지난 호 다시 읽기" 카드 4개가 동일 상위 4편을 노출하고 클릭 시 이동하는지 확인.

- [ ] **Step 5: 테스트 데이터 정리**

시드한 글을 정확 매치 조건으로 삭제해 로컬 DB 원상 복구.

---

## Self-Review
- **Spec 커버리지**: 선정 규칙(상위 4편)→Task 2, 슬롯 매핑(+id)→Task 1, 인터랙션(onClick)→Task 4·5, 헤더 카피 교체→Task 4, 데이터 흐름(서비스·page·컴포넌트)→Task 2·3·4·5, mock 제거→Task 6, 검증→Task 7. 누락 없음.
- **Placeholder**: 없음(모든 코드 블록 실제 코드). import 교체는 전체 블록을 명시.
- **타입 일관성**: `WebzineBackIssue`(+`id`)는 Task 1에서 정의, Task 2·4·5에서 동일 사용. `toWebzineBackIssueView(row: WebzineRow): WebzineBackIssue`를 Task 1에서 정의하고 Task 2에서 동일 호출. 서비스 `backIssues` 필드명은 page·컴포넌트 prop명과 일치.
