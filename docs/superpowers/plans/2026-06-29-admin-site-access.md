# 관리자 공개 사이트 접근 + 헤더 진입점 (PR2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 로그인 후 공개 사이트(`/main`)에 도착하고, 공개 헤더의 관리자 전용 "관리자" 링크로 대시보드에 진입하며, admin 셸의 "사이트 보기" 링크로 사이트로 되돌아갈 수 있게 한다.

**Architecture:** 공개 페이지에 공통 레이아웃이 없어 헤더를 각 페이지가 직접 렌더한다. role 조회를 한 곳에 모으기 위해 서버 래퍼(`SiteDesktopNav`·`SiteMobileHeader`)를 도입하고, 각 페이지의 `DesktopNav`·`MobileStickyHeader` 직접 렌더를 래퍼 호출로 교체한다. "관리자" 링크는 장식용(실제 가드는 `proxy.ts`+`requireAdmin` 유지)이므로 role은 쿠키 JWT에서 경량으로 읽는다.

**Tech Stack:** Next.js 16 App Router(Server Component), TypeScript strict, @supabase/ssr, CSS Modules.

---

## 설계 결정(반영 전제)

- **로그인 도착지**: 역할별 fallback에서 admin→`/admin`을 제거하고 admin·member 모두 기본 `/main`. 유효한 내부 `next`는 그대로 우선(proxy가 `/admin` 진입 시 붙이는 `next=/admin`은 계속 동작).
- **헤더 "관리자" 링크**: admin일 때만 노출, `→/admin`. 비-admin 로그인 상태의 로그인↔로그아웃 토글은 범위 밖(설계 YAGNI).
- **role 조회**: 장식용 링크라 DB 조회 불필요 → `proxy.ts`와 동일하게 세션 access_token의 `user_role` 클레임만 읽는 경량 헬퍼 사용. 공개 페이지(익명 포함) 성능 보존.
- **admin 셸 "사이트 보기"**: Sidebar 첫 그룹(대시보드)에 `/main` 링크 추가.

## File Structure

- Create: `src/server/auth/viewer.ts` — 경량 `getViewerIsAdmin()`
- Create: `src/app/_components/SiteDesktopNav.tsx` — `DesktopNav` 서버 래퍼
- Create: `src/app/_components/SiteMobileHeader.tsx` — `MobileStickyHeader` 서버 래퍼
- Modify: `src/app/_components/DesktopNav.tsx` — `isAdmin` prop + 관리자 링크
- Modify: `src/app/_components/DesktopNav.module.css` — 관리자 링크 스타일
- Modify: `src/app/_components/MobileStickyHeader.tsx` — `isAdmin` prop + 관리자 링크
- Modify: `src/app/_components/MobileStickyHeader.module.css` — 관리자 링크 스타일
- Modify (11곳 DesktopNav → SiteDesktopNav, 2곳 MobileStickyHeader → SiteMobileHeader):
  - `src/app/main/_components/desktop/DesktopPage.tsx`
  - `src/app/main/_components/mobile/MobilePage.tsx`
  - `src/app/board/page.tsx`
  - `src/app/faculty/page.tsx`
  - `src/app/committee/page.tsx`
  - `src/app/notice/page.tsx`
  - `src/app/training/page.tsx`
  - `src/app/webzine/page.tsx` (DesktopNav + MobileStickyHeader 둘 다)
  - `src/app/resources/page.tsx`
  - `src/app/gallery/page.tsx`
  - `src/app/search/page.tsx`
  - `src/app/_components/DocPage.tsx`
- Modify: `src/app/(admin)/admin/_components/Sidebar.tsx` — "사이트 보기" 링크
- Modify: `src/server/actions/auth.ts` — 로그인 fallback `/main`

---

### Task 1: 경량 viewer role 헬퍼

**Files:**
- Create: `src/server/auth/viewer.ts`

- [ ] **Step 1: 헬퍼 작성**

```typescript
// 공개 헤더의 장식용 분기를 위한 경량 role 조회(서버 전용).
// 실제 권한 가드는 proxy.ts + requireAdmin이 담당하므로, 여기서는 DB 조회 없이
// 쿠키 세션의 access_token에서 user_role 클레임만 읽는다(proxy.ts와 동일 패턴).
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { readUserRole } from "@/lib/jwt-role";

export async function getViewerIsAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return readUserRole(session?.access_token) === "admin";
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 통과(새 파일 에러 없음)

---

### Task 2: DesktopNav 관리자 링크

**Files:**
- Modify: `src/app/_components/DesktopNav.tsx`
- Modify: `src/app/_components/DesktopNav.module.css`

- [ ] **Step 1: props 타입에 isAdmin 추가**

`DesktopNav.tsx`의 `type Props`를 다음으로 교체:

```typescript
type Props = {
  variant?: "transparent" | "solid";
  isAdmin?: boolean;
};
```

함수 시그니처도 교체:

```typescript
export default function DesktopNav({ variant = "transparent", isAdmin = false }: Props) {
```

- [ ] **Step 2: utils 영역에 관리자 링크 추가**

`DesktopNav.tsx`의 `<div className={styles.utils}>` 안, 검색 버튼과 로그인 링크 **사이**에 admin 전용 링크를 넣는다. 기존 검색 `<Link>` 직후, 로그인 `<Link>` 직전에 추가:

```tsx
        {isAdmin && (
          <Link href="/admin" className={styles.adminLink} style={{ textDecoration: "none" }}>
            관리자
          </Link>
        )}
```

- [ ] **Step 3: 관리자 링크 스타일 추가**

`DesktopNav.module.css` 끝에 추가(loginBtn과 톤을 맞추되 보조 링크로 구분):

```css
.adminLink {
  padding: 8px 14px;
  border-radius: 2px;
  font-size: 12px;
  font-family: var(--font-noto-sans-kr), system-ui, sans-serif;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
  cursor: pointer;
}

.nav[data-variant="transparent"] .adminLink {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.nav[data-variant="solid"] .adminLink {
  background: var(--palette-surface);
  color: var(--palette-primary);
  border: 1px solid var(--palette-line);
}
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 통과

---

### Task 3: MobileStickyHeader 관리자 링크

**Files:**
- Modify: `src/app/_components/MobileStickyHeader.tsx`
- Modify: `src/app/_components/MobileStickyHeader.module.css`

- [ ] **Step 1: isAdmin prop 추가**

함수 시그니처를 교체:

```typescript
export default function MobileStickyHeader({ isAdmin = false }: { isAdmin?: boolean }) {
```

- [ ] **Step 2: utils에 관리자 링크 추가**

`<div className={styles.utils}>` 안, 검색 버튼과 로그인 링크 사이에 추가:

```tsx
        {isAdmin && (
          <Link href="/admin" className={styles.adminLink}>
            관리자
          </Link>
        )}
```

- [ ] **Step 3: 스타일 추가**

`MobileStickyHeader.module.css`에 `.loginBtn` 정의를 찾아 같은 톤의 보조 링크 `.adminLink`를 그 뒤에 추가한다. (loginBtn의 padding·font-size·border-radius를 참고하되, 배경은 surface/테두리는 line, 글자색은 primary로 보조 버튼처럼.)

```css
.adminLink {
  padding: 6px 12px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  background: var(--palette-surface);
  color: var(--palette-primary);
  border: 1px solid var(--palette-line);
}
```

> 주: 실제 `.loginBtn` 수치와 어긋나면 그에 맞춰 padding/폰트만 조정. 디자인 원본의 기존 클래스는 변경 금지(추가만).

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 통과

---

### Task 4: 서버 래퍼 컴포넌트

**Files:**
- Create: `src/app/_components/SiteDesktopNav.tsx`
- Create: `src/app/_components/SiteMobileHeader.tsx`

- [ ] **Step 1: SiteDesktopNav 작성**

```tsx
// DesktopNav 서버 래퍼 — viewer가 admin이면 헤더에 관리자 링크를 노출한다.
import DesktopNav from "./DesktopNav";
import { getViewerIsAdmin } from "@/server/auth/viewer";

export default async function SiteDesktopNav({
  variant = "transparent",
}: {
  variant?: "transparent" | "solid";
}) {
  const isAdmin = await getViewerIsAdmin();
  return <DesktopNav variant={variant} isAdmin={isAdmin} />;
}
```

- [ ] **Step 2: SiteMobileHeader 작성**

```tsx
// MobileStickyHeader 서버 래퍼 — viewer가 admin이면 헤더에 관리자 링크를 노출한다.
import MobileStickyHeader from "./MobileStickyHeader";
import { getViewerIsAdmin } from "@/server/auth/viewer";

export default async function SiteMobileHeader() {
  const isAdmin = await getViewerIsAdmin();
  return <MobileStickyHeader isAdmin={isAdmin} />;
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 통과

---

### Task 5: 페이지의 헤더 렌더를 래퍼로 교체

각 파일에서 `DesktopNav` import·사용을 `SiteDesktopNav`로, `MobileStickyHeader`를 `SiteMobileHeader`로 교체한다. **prop(`variant`)은 그대로 전달**한다. 사용처는 비동기 서버 컴포넌트이므로 `<SiteDesktopNav ... />`가 그대로 await 렌더된다(추가 await 불필요 — JSX가 처리).

> 주의: import 경로는 각 파일의 기존 `DesktopNav`/`MobileStickyHeader` import 상대경로를 그대로 형제 파일명만 교체. (예: `@/app/...` 형태가 아니라 기존과 동일한 상대/별칭 표기 유지.)

- [ ] **Step 1: DesktopNav 사용처 11곳 교체**

대상 파일에서 `DesktopNav` → `SiteDesktopNav` (import 명·태그명 동시):
- `src/app/main/_components/desktop/DesktopPage.tsx` (variant 기본)
- `src/app/board/page.tsx` (`variant="solid"`)
- `src/app/faculty/page.tsx` (`variant="solid"`)
- `src/app/committee/page.tsx` (`variant="solid"`)
- `src/app/notice/page.tsx` (`variant="solid"`)
- `src/app/training/page.tsx` (`variant="solid"`)
- `src/app/webzine/page.tsx` (`variant="solid"`)
- `src/app/resources/page.tsx` (`variant="solid"`)
- `src/app/gallery/page.tsx` (`variant="solid"`)
- `src/app/search/page.tsx` (`variant="solid"`)
- `src/app/_components/DocPage.tsx` (`variant="solid"`)

- [ ] **Step 2: MobileStickyHeader 사용처 2곳 교체**

`MobileStickyHeader` → `SiteMobileHeader`:
- `src/app/main/_components/mobile/MobilePage.tsx`
- `src/app/webzine/page.tsx`

- [ ] **Step 3: 잔여 import 점검**

Run: `grep -rn "DesktopNav\|MobileStickyHeader" src/app --include=*.tsx | grep -v "_components/DesktopNav\|_components/MobileStickyHeader\|SiteDesktopNav\|SiteMobileHeader"`
Expected: (출력 없음) — 모든 직접 사용이 래퍼로 교체됨. (정의 파일·래퍼 내부 import는 제외.)

- [ ] **Step 4: 타입 체크·린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 통과

---

### Task 6: admin 셸 "사이트 보기" 링크

**Files:**
- Modify: `src/app/(admin)/admin/_components/Sidebar.tsx`

- [ ] **Step 1: 첫 그룹에 링크 추가**

`groups` 배열의 첫 항목을 다음으로 교체:

```typescript
    { items: [{ href: "/admin", label: "대시보드" }, { href: "/main", label: "사이트 보기" }] },
```

> `isActive("/main")`는 admin 경로에서 항상 false라 활성 강조 없이 일반 링크로 표시된다(의도된 동작).

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 통과

---

### Task 7: 로그인 도착지 fallback 변경

**Files:**
- Modify: `src/server/actions/auth.ts`

- [ ] **Step 1: login() fallback 단순화**

`login()` 내부의 다음 블록을

```typescript
  const nextRaw = formData.get("next");
  const requested = typeof nextRaw === "string" ? safeNext(nextRaw, "") : "";
  const role = readUserRole(data.session.access_token);
  const fallback = role === "admin" ? "/admin" : "/main";
  redirect(requested || fallback);
```

다음으로 교체(역할 무관 기본 `/main`, 유효한 next 우선):

```typescript
  // 도착지: 유효한 내부 next 우선, 없으면 역할 무관 기본 /main.
  // (관리자도 사이트에 먼저 도착하고 헤더의 "관리자" 링크로 대시보드 진입.
  //  proxy가 /admin 진입 시 붙이는 next=/admin은 그대로 우선 적용된다.)
  const nextRaw = formData.get("next");
  const requested = typeof nextRaw === "string" ? safeNext(nextRaw, "") : "";
  redirect(requested || "/main");
```

- [ ] **Step 2: 미사용 import 제거**

`readUserRole`가 더 이상 `auth.ts`에서 쓰이지 않으면 상단 import에서 제거한다:

```typescript
// 삭제: import { readUserRole } from "@/lib/jwt-role";
```

(다른 곳에서 여전히 쓰이면 유지. `grep -n readUserRole src/server/actions/auth.ts`로 확인.)

- [ ] **Step 3: 타입 체크·린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 통과(미사용 변수/임포트 경고 없음)

---

### Task 8: 로컬 e2e 검증 + plan 커밋

- [ ] **Step 1: 전체 빌드**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: 모두 통과

- [ ] **Step 2: dev 렌더 확인(로컬 Supabase 가동 상태)**

`pnpm dev` 후:
- 비로그인으로 `/main`·`/notice` 등 헤더에 "관리자" 링크 **없음** 확인.
- admin 계정(시드)로 로그인 → **`/main`으로 도착** 확인(이전엔 `/admin`).
- 로그인 후 `/main` 데스크톱·모바일 헤더에 "관리자" 링크 노출, 클릭 시 `/admin` 이동 확인.
- admin 셸 사이드바의 "사이트 보기" 클릭 시 `/main` 이동 확인.
- member 계정으로 로그인 → `/main` 도착, 헤더에 "관리자" 링크 **없음** 확인.

> 실제 화면 확인은 preview 도구(스냅샷/스크린샷)로 증빙.

- [ ] **Step 3: 커밋**

기능 커밋은 Task별로 쪼개 진행하되(아래 권장 단위), plan 문서도 함께 커밋한다.

권장 커밋 단위:
- `feat: 공개 헤더 관리자 링크용 viewer role 헬퍼` (Task 1)
- `feat: 공개 헤더에 관리자 전용 링크 추가` (Task 2·3·4)
- `refactor: 공개 페이지 헤더를 서버 래퍼로 교체` (Task 5)
- `feat: admin 사이드바에 사이트 보기 링크 추가` (Task 6)
- `feat: 로그인 후 기본 도착지를 /main으로 통일` (Task 7)
- `docs: 관리자 사이트 접근 plan 추가` (이 문서)

각 커밋 메시지 끝에:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## Self-Review 체크

- **스펙 커버리지**: 도착지 변경(Task 7) · 헤더 관리자 링크(Task 2·3·4·5) · admin "사이트 보기"(Task 6) — 설계 PR2 항목 모두 커버.
- **범위 밖 유지**: 비-admin 로그인/로그아웃 토글 미구현(설계 YAGNI). proxy 가드·requireAdmin 불변.
- **타입 일관성**: `isAdmin?: boolean` 양 컴포넌트 동일 시그니처. `getViewerIsAdmin(): Promise<boolean>` 단일 정의.
