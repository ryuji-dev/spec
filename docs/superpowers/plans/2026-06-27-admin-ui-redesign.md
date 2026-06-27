# admin UI 리디자인 Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** admin 전체를 감싸는 웜 다크+골드 공통 셸(사이드바+사용자/로그아웃)과 재사용 UI 스타일을 도입하고 대시보드에 적용한다.

**Architecture:** route-group 레이아웃 `src/app/(admin)/layout.tsx`가 모든 `(admin)/admin/*`를 셸로 감싼다. 셸 wrapper에 CSS 변수(테마 토큰)를 정의하고, `admin-shell.module.css`(셸)·`ui.module.css`(프리미티브) 두 CSS 모듈이 이를 공유한다. 사이드바만 client(`usePathname` 활성 강조).

**Tech Stack:** Next.js 16 App Router, TypeScript strict, CSS Modules. 신규 의존성 없음(아이콘 미사용 — 텍스트 메뉴).

## Global Constraints

- 모든 UI 텍스트 한국어, 코드 식별자 영어.
- `src/server/**`만 서버 전용. 이번 작업은 서버 데이터 함수 신규 없음(기존 `requireAdmin`·`getAdminContentStats`·`countUnansweredInquiries` 재사용).
- 검증: 테스트 러너 없음 → `npx tsc --noEmit`(타입), 마지막 `pnpm lint`·`pnpm build`·로컬 e2e.
- 테마 토큰(웜 다크+골드)은 spec의 "디자인 토큰" 값과 일치시킨다.

---

### Task 1: 공용 스타일 + 셸 레이아웃

**Files:**
- Create: `src/app/(admin)/admin/_components/ui.module.css`
- Create: `src/app/(admin)/admin/_components/admin-shell.module.css`
- Create: `src/app/(admin)/admin/_components/Sidebar.tsx`
- Create: `src/app/(admin)/layout.tsx`

**Interfaces:**
- Produces: `Sidebar` 컴포넌트 — props `{ userName: string; userMeta: string; unanswered: number }`.
- Produces: `ui.module.css` 클래스 — `page, pageHeader, pageTitle, pageDesc, sectionLabel, cardGrid, card, cardTitle, cardDesc, statLabel, statValue, statUnit, statDraft, statDraftActive, formGrid, input, btnPrimary, error, success, sectionGrid2`.
- Produces: `admin-shell.module.css` 클래스 — `shell, sidebar, brand, brandMark, brandName, brandSub, nav, navGroup, navItem, navItemActive, navBadge, userBox, userName, userMeta, logoutBtn, content`.
- Consumes: `@/server/auth/current-user`의 `requireAdmin()`, `@/server/services/inquiry`의 `countUnansweredInquiries()`, `@/server/actions/auth`의 `logout`.

- [ ] **Step 1: ui.module.css 작성**

`src/app/(admin)/admin/_components/ui.module.css`:

```css
.page {
  max-width: 980px;
}

.pageHeader {
  margin-bottom: 20px;
}
.pageTitle {
  font-size: 21px;
  font-weight: 500;
  margin: 0;
  color: var(--admin-text);
}
.pageDesc {
  font-size: 13px;
  color: var(--admin-text-2);
  margin: 4px 0 0;
}

.sectionLabel {
  font-size: 13px;
  font-weight: 500;
  color: var(--admin-text-2);
  margin: 0 0 10px;
}

.cardGrid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  padding: 16px 18px;
}
.cardTitle {
  font-size: 15px;
  font-weight: 500;
  color: var(--admin-text);
  margin: 0 0 4px;
}
.cardDesc {
  font-size: 12px;
  color: var(--admin-text-2);
  margin: 0 0 12px;
}

.statLabel {
  font-size: 13px;
  color: var(--admin-text-2);
}
.statValue {
  font-size: 24px;
  font-weight: 500;
  margin-top: 3px;
  color: var(--admin-text);
}
.statUnit {
  font-size: 12px;
  font-weight: 400;
  color: var(--admin-text-3);
}
.statDraft {
  font-size: 12px;
  margin-top: 3px;
  color: var(--admin-text-3);
}
.statDraftActive {
  color: var(--admin-danger-text);
}

.formGrid {
  display: grid;
  gap: 12px;
}
.input {
  padding: 10px 12px;
  background: var(--admin-bg);
  border: 1px solid var(--admin-border-input);
  border-radius: 8px;
  color: var(--admin-text);
  font: inherit;
  width: 100%;
}
.input::placeholder {
  color: var(--admin-text-3);
}
.input:focus {
  outline: none;
  border-color: var(--admin-gold);
}

.btnPrimary {
  background: var(--admin-gold);
  color: var(--admin-gold-text);
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.btnPrimary:disabled {
  opacity: 0.6;
  cursor: default;
}

.error {
  color: var(--admin-danger-text);
  margin: 0;
  font-size: 13px;
}
.success {
  color: #8fb98a;
  margin: 0;
  font-size: 13px;
}

.sectionGrid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 768px) {
  .sectionGrid2 {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: admin-shell.module.css 작성 (테마 토큰 포함)**

`src/app/(admin)/admin/_components/admin-shell.module.css`:

```css
.shell {
  --admin-bg: #1a1814;
  --admin-surface: #23211b;
  --admin-sidebar: #12110e;
  --admin-border: #322f28;
  --admin-border-input: #3a3730;
  --admin-divider: #2c2a24;
  --admin-text: #f3eee2;
  --admin-text-2: #a89f90;
  --admin-text-3: #7c7466;
  --admin-gold: #c9a96e;
  --admin-gold-text: #241d10;
  --admin-gold-tint: rgba(201, 169, 110, 0.16);
  --admin-gold-active-text: #e7c98e;
  --admin-danger-text: #e0857b;
  --admin-danger-bg: #c0392b;

  display: flex;
  min-height: 100vh;
  background: var(--admin-bg);
  color: var(--admin-text);
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--admin-sidebar);
  border-right: 1px solid var(--admin-divider);
  display: flex;
  flex-direction: column;
  padding: 18px 0;
}

.brand {
  padding: 0 18px 18px;
  border-bottom: 1px solid var(--admin-divider);
  display: flex;
  align-items: center;
  gap: 9px;
}
.brandMark {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--admin-gold);
  color: var(--admin-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.brandName {
  font-size: 13px;
  font-weight: 500;
  color: var(--admin-text);
  line-height: 1.25;
}
.brandSub {
  font-size: 11px;
  color: var(--admin-gold);
  letter-spacing: 0.04em;
}

.nav {
  flex: 1;
  padding: 14px 10px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}
.navGroup {
  margin: 14px 12px 4px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--admin-text-3);
}
.navItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 9px;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--admin-text-2);
  text-decoration: none;
  border-left: 2px solid transparent;
}
.navItem:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--admin-text);
}
.navItemActive {
  background: var(--admin-gold-tint);
  color: var(--admin-gold-active-text);
  font-weight: 500;
  border-left-color: var(--admin-gold);
}
.navBadge {
  background: var(--admin-danger-bg);
  color: #fff;
  font-size: 11px;
  border-radius: 999px;
  padding: 1px 7px;
}

.userBox {
  padding: 12px 16px;
  border-top: 1px solid var(--admin-divider);
  font-size: 12px;
}
.userName {
  color: var(--admin-text);
}
.userMeta {
  color: var(--admin-text-3);
  margin: 2px 0 8px;
  word-break: break-all;
}
.logoutBtn {
  width: 100%;
  background: transparent;
  border: 1px solid var(--admin-border-input);
  color: var(--admin-text-2);
  border-radius: 8px;
  padding: 6px;
  font-size: 12px;
  cursor: pointer;
}
.logoutBtn:hover {
  color: var(--admin-text);
}

.content {
  flex: 1;
  padding: 24px 26px;
  overflow: auto;
}

@media (max-width: 768px) {
  .shell {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
  }
  .nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .navGroup {
    width: 100%;
  }
}
```

- [ ] **Step 3: Sidebar 컴포넌트 작성**

`src/app/(admin)/admin/_components/Sidebar.tsx`:

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/server/actions/auth";
import styles from "./admin-shell.module.css";

type NavItem = { href: string; label: string; badge?: number };
type NavGroup = { title?: string; items: NavItem[] };

export default function Sidebar({
  userName,
  userMeta,
  unanswered,
}: {
  userName: string;
  userMeta: string;
  unanswered: number;
}) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    { items: [{ href: "/admin", label: "대시보드" }] },
    {
      title: "콘텐츠",
      items: [
        { href: "/admin/notice", label: "공지" },
        { href: "/admin/training", label: "강습회" },
        { href: "/admin/committee", label: "위원회 소식" },
        { href: "/admin/webzine", label: "웹진" },
        { href: "/admin/resources", label: "자료실" },
      ],
    },
    {
      title: "운영",
      items: [
        { href: "/admin/inquiries", label: "문의 접수함", badge: unanswered },
        { href: "/admin/events", label: "수련회 이벤트" },
        { href: "/admin/timetable", label: "강의 시간표" },
        { href: "/admin/collections", label: "자료실 컬렉션" },
        { href: "/admin/hero", label: "메인 히어로" },
      ],
    },
  ];

  // /admin은 정확히 일치할 때만, 나머지는 하위 경로 포함 활성.
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>✝</span>
        <div>
          <div className={styles.brandName}>서경노회 교육위원회</div>
          <div className={styles.brandSub}>관리자</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {groups.map((g, gi) => (
          <div key={g.title ?? gi}>
            {g.title && <div className={styles.navGroup}>{g.title}</div>}
            {g.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`${styles.navItem} ${isActive(it.href) ? styles.navItemActive : ""}`}
              >
                <span>{it.label}</span>
                {it.badge != null && it.badge > 0 && (
                  <span className={styles.navBadge}>{it.badge}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.userBox}>
        <div className={styles.userName}>{userName}</div>
        <div className={styles.userMeta}>{userMeta}</div>
        <form action={logout}>
          <button type="submit" className={styles.logoutBtn}>
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: 레이아웃 작성**

`src/app/(admin)/layout.tsx`:

```tsx
import { requireAdmin } from "@/server/auth/current-user";
import { countUnansweredInquiries } from "@/server/services/inquiry";
import Sidebar from "./admin/_components/Sidebar";
import shell from "./admin/_components/admin-shell.module.css";

// (admin) 그룹 전체를 감싸는 셸. 로그인 페이지는 (public)이라 영향 없음.
// 레이아웃에서 권한을 1차 확인(각 페이지의 requireAdmin 재확인은 유지).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const unanswered = await countUnansweredInquiries();

  const userName = `${user.name}${user.title ? ` ${user.title}` : ""}`;
  const userMeta = `${user.email} · ${user.role}`;

  return (
    <div className={shell.shell}>
      <Sidebar userName={userName} userMeta={userMeta} unanswered={unanswered} />
      <div className={shell.content}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 5: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 오류 0.

- [ ] **Step 6: 커밋**

```bash
git add "src/app/(admin)/admin/_components/ui.module.css" "src/app/(admin)/admin/_components/admin-shell.module.css" "src/app/(admin)/admin/_components/Sidebar.tsx" "src/app/(admin)/layout.tsx"
git commit -m "feat: admin 공통 셸 레이아웃·공용 UI 스타일(웜 다크+골드)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 대시보드 + StatCard 리스타일

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/app/(admin)/admin/_components/StatCard.tsx`

**Interfaces:**
- Consumes: Task 1의 `ui.module.css` 클래스. 기존 `getAdminContentStats()`, `ContentStat` 타입.
- 셸이 사용자·로그아웃·운영 링크·미처리 배지를 담당하므로 대시보드 본문에서는 제거.

- [ ] **Step 1: StatCard 리스타일**

`src/app/(admin)/admin/_components/StatCard.tsx` 전체 교체:

```tsx
import Link from "next/link";
import type { ContentStat } from "@/server/services/admin-stats";
import styles from "./ui.module.css";

export default function StatCard({ stat }: { stat: ContentStat }) {
  const hasDraft = stat.unpublished >= 1;
  return (
    <Link href={stat.href} className={styles.card} style={{ textDecoration: "none" }}>
      <div className={styles.statLabel}>{stat.label}</div>
      <div className={styles.statValue}>
        {stat.total}
        <span className={styles.statUnit}> 건</span>
      </div>
      <div className={`${styles.statDraft} ${hasDraft ? styles.statDraftActive : ""}`}>
        미공개 {stat.unpublished}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: 대시보드 page.tsx 전체 교체**

`src/app/(admin)/admin/page.tsx` 전체 교체(사용자·로그아웃·운영 링크·미처리 배지는 셸로 이동했으므로 제거):

```tsx
import { requireAdmin } from "@/server/auth/current-user";
import CreateUserForm from "./CreateUserForm";
import AdminResetPasswordForm from "./AdminResetPasswordForm";
import { getAdminContentStats } from "@/server/services/admin-stats";
import StatCard from "./_components/StatCard";
import styles from "./_components/ui.module.css";

// proxy·레이아웃이 1차 가드, 여기서 서버 권한을 재확인한다.
export default async function AdminPage() {
  await requireAdmin();
  const stats = await getAdminContentStats();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>대시보드</h1>
        <p className={styles.pageDesc}>콘텐츠 현황과 계정 관리</p>
      </div>

      <div className={styles.sectionLabel}>콘텐츠 현황</div>
      <div className={styles.cardGrid} style={{ marginBottom: 24 }}>
        {stats.map((s) => (
          <StatCard key={s.section} stat={s} />
        ))}
      </div>

      <div className={styles.sectionGrid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>계정 생성</h2>
          <p className={styles.cardDesc}>
            직함이 필요한 회원·관리자 계정을 발급합니다.
          </p>
          <CreateUserForm />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>회원 비밀번호 재설정</h2>
          <p className={styles.cardDesc}>
            임시 비밀번호를 발급해 연락처로 전달한 뒤, 회원이 /reset-password에서
            직접 변경하도록 안내해주세요.
          </p>
          <AdminResetPasswordForm />
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 오류 0.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(admin)/admin/page.tsx" "src/app/(admin)/admin/_components/StatCard.tsx"
git commit -m "feat: admin 대시보드 다크 테마 리스타일

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 계정 폼 2종 리스타일

**Files:**
- Modify: `src/app/(admin)/admin/CreateUserForm.tsx`
- Modify: `src/app/(admin)/admin/AdminResetPasswordForm.tsx`

**Interfaces:**
- Consumes: Task 1의 `ui.module.css`(`formGrid, input, btnPrimary, error, success`). 폼 로직(`useActionState`·액션)은 불변.

- [ ] **Step 1: CreateUserForm 리스타일**

`src/app/(admin)/admin/CreateUserForm.tsx`에서 `inputStyle` 상수를 제거하고 클래스로 교체. import에 추가:

```tsx
import styles from "./_components/ui.module.css";
```

`const inputStyle = { ... } as const;` 블록을 삭제하고, JSX를 아래로 교체:

```tsx
  return (
    <form action={formAction} className={styles.formGrid}>
      <input name="name" type="text" required placeholder="이름" className={styles.input} />
      <input name="email" type="email" required autoComplete="off" placeholder="이메일" className={styles.input} />
      <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="비밀번호 (8자 이상)" className={styles.input} />
      <input name="title" type="text" placeholder="직함 (선택 — 예: 목사·전도사)" className={styles.input} />
      <input name="church" type="text" placeholder="소속 교회 (선택)" className={styles.input} />
      <select name="role" defaultValue="member" className={styles.input}>
        <option value="member">일반 회원</option>
        <option value="admin">관리자</option>
      </select>

      {state.error && (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className={styles.success}>
          {state.success}
        </p>
      )}

      <button type="submit" disabled={pending} className={styles.btnPrimary}>
        {pending ? "생성 중…" : "계정 생성"}
      </button>
    </form>
  );
```

- [ ] **Step 2: AdminResetPasswordForm 리스타일**

`src/app/(admin)/admin/AdminResetPasswordForm.tsx`에서 `inputStyle` 상수를 제거하고 클래스로 교체. import에 추가:

```tsx
import styles from "./_components/ui.module.css";
```

`const inputStyle = { ... } as const;` 블록을 삭제하고, JSX를 아래로 교체:

```tsx
  return (
    <form action={formAction} className={styles.formGrid}>
      <input name="email" type="email" required autoComplete="off" placeholder="회원 이메일" className={styles.input} />
      <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="임시 비밀번호 (8자 이상)" className={styles.input} />
      <input name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" placeholder="임시 비밀번호 확인" className={styles.input} />

      {state.error && (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className={styles.success}>
          {state.success}
        </p>
      )}

      <button type="submit" disabled={pending} className={styles.btnPrimary}>
        {pending ? "재설정 중…" : "비밀번호 재설정"}
      </button>
    </form>
  );
```

- [ ] **Step 3: 타입·린트·빌드 검증**

```bash
npx tsc --noEmit && pnpm lint && pnpm build
```
Expected: 세 명령 모두 오류 0.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(admin)/admin/CreateUserForm.tsx" "src/app/(admin)/admin/AdminResetPasswordForm.tsx"
git commit -m "feat: admin 계정 관리 폼 다크 테마 입력 스타일

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 로컬 e2e 검증

**Files:** (코드 변경 없음)

전제: 로컬 Supabase 스택·`pnpm dev` 기동, admin 로그인(`admin@seogyeong.kr`/`admin1234`).

- [ ] **Step 1: 대시보드 데스크톱 확인**

`/admin` 진입 → 좌측 그린 사이드바(브랜드·대시보드·콘텐츠·운영 그룹·하단 사용자/로그아웃), 본문 콘텐츠 현황 카드 + 계정 생성·비밀번호 재설정 카드가 웜 다크+골드로 렌더되는지 스크린샷 확인.

- [ ] **Step 2: 사이드바 활성·이동·배지**

`/admin`에서 "대시보드"가 골드 활성, `/admin/notice` 이동 시 "공지"가 활성으로 바뀌는지 확인. 미답변 문의 1건 삽입(로컬 DB) → 사이드바 "문의 접수함" 옆 배지 노출 확인 후 원복.

- [ ] **Step 3: 다른 admin 페이지가 셸 안에 렌더**

`/admin/inquiries`, `/admin/notice` 등이 새 사이드바 셸 안에서 정상 표시되는지(본문은 기존 스타일이어도 셸 틀이 잡히는지) 확인.

- [ ] **Step 4: 모바일·콘솔**

뷰포트 모바일에서 사이드바가 상단으로 접히고 본문이 1열로 정렬되는지, 브라우저 콘솔 오류 0인지 확인.

- [ ] **Step 5: plan 검증 체크 커밋(선택)**

```bash
git add docs/superpowers/plans/2026-06-27-admin-ui-redesign.md
git commit -m "docs: admin 리디자인 Phase 1 plan 검증 체크

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
