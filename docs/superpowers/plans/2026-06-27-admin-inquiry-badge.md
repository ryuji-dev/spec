# admin 대시보드 미처리 문의 배지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** admin 대시보드 "문의 접수함 →" 링크 옆에 미답변 문의 건수를 빨간 배지로 표시(1건 이상일 때만).

**Architecture:** Server Component `page.tsx`가 신규 서비스 `countUnansweredInquiries()`(단일 head count 쿼리)를 호출해 배지를 조건부 렌더. 스키마 변경 없음.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, supabase-js, 인라인 스타일.

> **검증 참고:** 테스트 러너 없음 → `npx tsc --noEmit`로 타입, 마지막에 `pnpm lint`·`pnpm build`·로컬 e2e로 동작 검증.

---

### Task 1: 미답변 문의 카운트 서비스

**Files:**
- Modify: `src/server/services/inquiry.ts`

- [ ] **Step 1: 함수 추가**

`src/server/services/inquiry.ts` 파일 끝에 추가:

```ts
// admin 전용: 미답변(접수됨) 문의 건수. answer is null 기준.
export async function countUnansweredInquiries(): Promise<number> {
  const supabase = await createSupabaseServer();
  const { count } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .is("answer", null);
  return count ?? 0;
}
```

- [ ] **Step 2: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 오류 0 (exit 0).

- [ ] **Step 3: 커밋**

```bash
git add src/server/services/inquiry.ts
git commit -m "feat: 미답변 문의 건수 집계 서비스

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 대시보드 배지 렌더

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`

현재 import 블록과 데이터 조회부, "문의 접수함 →" 링크를 수정한다.

- [ ] **Step 1: import 추가**

기존 `import { getAdminContentStats } ...` 아래에 추가:

```tsx
import { countUnansweredInquiries } from "@/server/services/inquiry";
```

- [ ] **Step 2: 데이터 조회 추가**

`const stats = await getAdminContentStats();` 아래에 추가:

```tsx
  const unansweredInquiries = await countUnansweredInquiries();
```

- [ ] **Step 3: 링크에 배지 추가**

"기타 관리" 줄의 다음 링크를

```tsx
        <Link href="/admin/inquiries">문의 접수함 →</Link>
```

아래로 교체:

```tsx
        <Link href="/admin/inquiries">
          문의 접수함
          {unansweredInquiries > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "#c00",
                color: "#fff",
                borderRadius: 999,
                fontSize: 12,
                padding: "1px 7px",
              }}
            >
              {unansweredInquiries}
            </span>
          )}
          {" →"}
        </Link>
```

- [ ] **Step 4: 타입·린트·빌드 검증**

```bash
npx tsc --noEmit && pnpm lint && pnpm build
```
Expected: 세 명령 모두 오류 0.

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(admin)/admin/page.tsx"
git commit -m "feat: 대시보드 미처리 문의 배지 표시

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 로컬 e2e 검증

**Files:** (코드 변경 없음)

전제: 로컬 Supabase 스택·`pnpm dev` 기동, admin 로그인(`admin@seogyeong.kr`/`admin1234`).

- [ ] **Step 1: 미처리 배지 노출**

미답변 문의가 있는 상태(없으면 `/support`에서 문의 1건 생성)에서 `/admin` 진입 → "문의 접수함" 옆 빨간 배지·건수가 미답변 수와 일치하는지 확인.

- [ ] **Step 2: 답변 후 감소**

`/admin/inquiries`에서 해당 문의에 답변을 기록 → `/admin` 새로고침 → 배지 건수 감소(0이면 사라짐) 확인. 브라우저 콘솔 오류 0.
