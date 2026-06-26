# admin 콘텐츠 현황 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** admin 대시보드(`/admin`) 상단에 5개 posts 도메인의 `전체 N · 미공개 M` 요약 카드를 추가하고 각 카드를 해당 관리 페이지 바로가기로 만든다.

**Architecture:** Server Component인 `page.tsx`가 신규 서비스 `getAdminContentStats()`(단일 supabase 쿼리 + JS 집계)를 직접 호출(읽기 규약 1번)하고, 신규 `StatCard` 서버 컴포넌트로 카드 그리드를 렌더한다. 스키마·RLS·마이그레이션 변경 없음.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, supabase-js, 인라인 스타일(admin 기능 화면).

> **검증 참고:** 이 프로젝트는 테스트 러너가 없다. 단위 테스트 대신 각 Task에서 `npx tsc --noEmit`로 타입을, 마지막에 `pnpm lint`·`pnpm build`·로컬 e2e로 동작을 검증한다.

---

### Task 1: admin-stats 서비스

**Files:**
- Create: `src/server/services/admin-stats.ts`

- [ ] **Step 1: 서비스 작성**

`src/server/services/admin-stats.ts`:

```ts
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";

export type ContentStat = {
  section: string;
  label: string;
  href: string;
  total: number;
  unpublished: number;
};

// admin 네비와 일치하는 라벨·경로(자료실은 /admin/resources 복수형).
const DOMAINS: { section: string; label: string; href: string }[] = [
  { section: "notice", label: "공지", href: "/admin/notice" },
  { section: "training", label: "강습회", href: "/admin/training" },
  { section: "committee", label: "위원회 소식", href: "/admin/committee" },
  { section: "webzine", label: "웹진", href: "/admin/webzine" },
  { section: "resource", label: "자료실", href: "/admin/resources" },
];

// admin 전용: 5개 도메인 전체/미공개 건수를 단일 쿼리로 집계.
// RLS admin select 정책으로 미공개 글까지 조회된다.
export async function getAdminContentStats(): Promise<ContentStat[]> {
  const supabase = await createSupabaseServer();
  const sections = DOMAINS.map((d) => d.section);
  const { data, error } = await supabase
    .from("posts")
    .select("section, is_published")
    .in("section", sections);
  if (error) throw error;
  const rows = data ?? [];

  return DOMAINS.map((d) => {
    const inSection = rows.filter((r) => r.section === d.section);
    return {
      section: d.section,
      label: d.label,
      href: d.href,
      total: inSection.length,
      unpublished: inSection.filter((r) => r.is_published === false).length,
    };
  });
}
```

- [ ] **Step 2: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 오류 0 (exit 0).

- [ ] **Step 3: 커밋**

```bash
git add src/server/services/admin-stats.ts
git commit -m "feat: admin 콘텐츠 현황 집계 서비스

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: StatCard 컴포넌트

**Files:**
- Create: `src/app/(admin)/admin/_components/StatCard.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/app/(admin)/admin/_components/StatCard.tsx`:

```tsx
import Link from "next/link";
import type { ContentStat } from "@/server/services/admin-stats";

export default function StatCard({ stat }: { stat: ContentStat }) {
  const hasDraft = stat.unpublished >= 1;
  return (
    <Link
      href={stat.href}
      style={{
        display: "block",
        padding: 16,
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 14, color: "#666" }}>{stat.label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>
        {stat.total}
        <span style={{ fontSize: 13, fontWeight: 400, color: "#999" }}> 건</span>
      </div>
      <div style={{ fontSize: 13, marginTop: 4, color: hasDraft ? "#c00" : "#888" }}>
        미공개 {stat.unpublished}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 오류 0 (exit 0).

- [ ] **Step 3: 커밋**

```bash
git add "src/app/(admin)/admin/_components/StatCard.tsx"
git commit -m "feat: admin 콘텐츠 현황 카드 컴포넌트

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 대시보드 페이지 통합

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`

현재 `page.tsx`의 import 영역(1~5행)과 한 줄 링크 목록(23~34행, 10개 `<Link>`를 담은 `<p>`)을 교체한다.

- [ ] **Step 1: import 추가**

`page.tsx` 상단 import 블록에 두 줄 추가(기존 import는 유지):

```tsx
import { getAdminContentStats } from "@/server/services/admin-stats";
import StatCard from "./_components/StatCard";
```

- [ ] **Step 2: 데이터 조회 추가**

`export default async function AdminPage()` 본문 첫 줄 `const user = await requireAdmin();` 바로 아래에 추가:

```tsx
  const stats = await getAdminContentStats();
```

- [ ] **Step 3: 링크 목록을 카드 그리드 + 기타 링크로 교체**

기존 링크 `<p>`(10개 `<Link>`를 담은 블록)를 아래로 교체한다:

```tsx
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>콘텐츠 현황</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          {stats.map((s) => (
            <StatCard key={s.section} stat={s} />
          ))}
        </div>
      </section>

      <p style={{ marginTop: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/admin/inquiries">문의 접수함 →</Link>
        <Link href="/admin/events">수련회 이벤트 관리 →</Link>
        <Link href="/admin/timetable">강의 시간표 관리 →</Link>
        <Link href="/admin/collections">자료실 컬렉션 관리 →</Link>
        <Link href="/admin/hero">메인 히어로 관리 →</Link>
      </p>
```

- [ ] **Step 4: 타입·린트·빌드 검증**

```bash
npx tsc --noEmit && pnpm lint && pnpm build
```
Expected: 세 명령 모두 오류 0.

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(admin)/admin/page.tsx"
git commit -m "feat: admin 대시보드 콘텐츠 현황 카드 통합

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 로컬 e2e 검증

**Files:** (코드 변경 없음 — 동작 검증 전용)

전제: 로컬 Supabase 스택(`npx supabase start`)과 `pnpm dev` 기동, seed 적용(`pnpm seed`). admin 계정 `admin@seogyeong.kr` / `admin1234`.

- [ ] **Step 1: 카드 노출·숫자 확인**

admin 로그인 후 `/admin` 진입. "콘텐츠 현황" 섹션에 5개 카드(공지·강습회·위원회 소식·웹진·자료실)가 노출되고 각 `전체 N 건`·`미공개 M`이 표시되는지 확인. seed 상태에서 미공개는 0이므로 회색 표기.

- [ ] **Step 2: 미공개 반영 확인**

`/admin/notice`에서 글 1건을 비공개로 토글 → `/admin` 새로고침 → 공지 카드 `미공개 1`(강조색)·해당 카드 클릭 시 `/admin/notice` 이동 확인. 검증 후 다시 공개로 토글해 seed 원복.

- [ ] **Step 3: 기타 링크·콘솔 확인**

"기타 관리" 줄의 5개 링크(문의·이벤트·시간표·컬렉션·히어로)가 정상 노출·이동되는지, 브라우저 콘솔 오류 0인지 확인.

- [ ] **Step 4: plan 체크 커밋(선택)**

검증 완료 후 plan 체크박스를 채워 커밋:

```bash
git add docs/superpowers/plans/2026-06-26-admin-dashboard-stats.md
git commit -m "docs: admin 대시보드 현황 plan 검증 체크

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
