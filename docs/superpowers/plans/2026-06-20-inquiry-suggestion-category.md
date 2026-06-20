# 푸터 "제안 보내기" → /support 제안 유형 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 푸터 "제안 보내기"를 기능화한다 — `/support` 문의 시스템에 `suggestion`(제안) 유형을 추가하고, 푸터 항목을 `/support?category=suggestion`로 연결해 폼이 "제안" 유형으로 열리게 한다.

**Architecture:** `inquiries.category` check 제약에 `suggestion`을 추가하고, DTO 카테고리 목록·공용 라벨 맵을 확장한다. 흩어진 카테고리 라벨 삼항식을 공용 맵으로 통일하고, `/support`가 `searchParams.category`로 폼 유형을 프리필하게 한다. 푸터 데이터에 href를 추가한다.

**Tech Stack:** Next.js 16 App Router(Server Component·Server Action), TypeScript strict, zod, Supabase(PostgreSQL check 제약 + RLS). 단위 테스트 러너 없음 → `pnpm lint && pnpm build` + 로컬 Supabase e2e로 검증.

---

## 파일 구조

- Create: `supabase/migrations/<ts>_inquiry_suggestion_category.sql` — category check 제약 교체.
- Modify: `src/lib/dto/inquiry.ts` — `INQUIRY_CATEGORIES`에 `suggestion` 추가, 공용 `INQUIRY_CATEGORY_LABEL` 신설.
- Modify: `src/server/services/inquiry.ts` — `Inquiry.category` 타입을 `InquiryCategory`로 통일.
- Modify: `src/app/(public)/support/InquiryForm.tsx` — 공용 라벨 맵 사용, `initialCategory` prop 프리필.
- Modify: `src/app/(public)/support/page.tsx` — `searchParams` 프리필, 라벨 맵 적용.
- Modify: `src/app/(admin)/admin/inquiries/page.tsx` — 라벨 맵 적용.
- Modify: `src/lib/main-page-data.ts` — 푸터 "제안 보내기" href 추가.

---

## Task 1: 데이터 계층 — 마이그레이션 + DTO + 서비스 타입

**Files:**
- Create: `supabase/migrations/<ts>_inquiry_suggestion_category.sql`
- Modify: `src/lib/dto/inquiry.ts`
- Modify: `src/server/services/inquiry.ts`

- [ ] **Step 1: 기존 제약명 확인**

로컬 스택 기동 후 제약명을 확인한다(인라인 check는 보통 `inquiries_category_check`로 자동 명명):
```bash
npx supabase status >/dev/null 2>&1 || (colima start && npx supabase start)
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec "$CID" psql -U postgres -d postgres -c "\d public.inquiries" | grep -i category
```
Expected: `"inquiries_category_check" CHECK (category = ANY (ARRAY['general'::text, 'password'::text]))` 형태로 제약명 확인. 이름이 다르면 Step 2의 제약명을 실제 이름으로 맞춘다.

- [ ] **Step 2: 마이그레이션 파일 생성·작성**

Run: `npx supabase migration new inquiry_suggestion_category`
생성된 `supabase/migrations/<ts>_inquiry_suggestion_category.sql`에 작성:
```sql
-- 문의 카테고리에 'suggestion'(제안) 추가. 푸터 "제안 보내기"가 이 유형으로 접수된다.
alter table public.inquiries drop constraint inquiries_category_check;
alter table public.inquiries
  add constraint inquiries_category_check
  check (category in ('general', 'suggestion', 'password'));
```

- [ ] **Step 3: 마이그레이션 적용·확인**

```bash
npx supabase db reset
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec "$CID" psql -U postgres -d postgres -c "\d public.inquiries" | grep -i category
```
Expected: `Finished supabase db reset`, 제약이 `'general', 'suggestion', 'password'` 포함으로 갱신됨.

- [ ] **Step 4: DTO 카테고리·공용 라벨 맵**

`src/lib/dto/inquiry.ts`에서 `INQUIRY_CATEGORIES`에 `"suggestion"`을 추가하고(순서: general → suggestion → password), 타입 선언 바로 아래에 공용 라벨 맵을 추가한다:
```ts
export const INQUIRY_CATEGORIES = ["general", "suggestion", "password"] as const;
export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export const INQUIRY_CATEGORY_LABEL: Record<InquiryCategory, string> = {
  general: "일반 문의",
  suggestion: "제안",
  password: "비밀번호 분실",
};
```
(`inquirySchema`의 `z.enum(INQUIRY_CATEGORIES)`는 변경 없이 자동으로 `suggestion`을 허용한다.)

- [ ] **Step 5: 서비스 타입 통일**

`src/server/services/inquiry.ts`의 `Inquiry` 타입에서 `category: "general" | "password";`를 `InquiryCategory`로 교체한다. 파일 상단 import에 `InquiryCategory`를 추가:
```ts
import type { InquiryCategory } from "@/lib/dto/inquiry";
```
그리고 타입 필드:
```ts
  category: InquiryCategory;
```

- [ ] **Step 6: 타입체크·커밋**

```bash
pnpm exec tsc --noEmit
```
Expected: 에러 없음(라벨 맵을 아직 쓰지 않아도 통과). 커밋:
```bash
git add supabase/migrations/ src/lib/dto/inquiry.ts src/server/services/inquiry.ts
git commit -m "feat: 문의 카테고리에 제안(suggestion) 유형 추가"
```

---

## Task 2: UI 연결 — 폼 프리필 + 라벨 맵 + 푸터 href

**Files:**
- Modify: `src/app/(public)/support/InquiryForm.tsx`
- Modify: `src/app/(public)/support/page.tsx`
- Modify: `src/app/(admin)/admin/inquiries/page.tsx`
- Modify: `src/lib/main-page-data.ts`

- [ ] **Step 1: `InquiryForm` — 공용 라벨 맵 + `initialCategory` 프리필**

`src/app/(public)/support/InquiryForm.tsx`:
1. import에 `INQUIRY_CATEGORY_LABEL` 추가, 로컬 `CATEGORY_LABEL` 선언 제거:
```ts
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABEL,
  type InquiryCategory,
} from "@/lib/dto/inquiry";
```
(파일 상단의 `const CATEGORY_LABEL: Record<InquiryCategory, string> = { general: "일반 문의", password: "비밀번호 분실" };` 블록을 삭제.)

2. props에 `initialCategory` 추가하고 초기 상태에 반영:
```tsx
export default function InquiryForm({
  isLoggedIn,
  defaultName,
  defaultEmail,
  initialCategory,
}: {
  isLoggedIn: boolean;
  defaultName?: string;
  defaultEmail?: string;
  initialCategory?: InquiryCategory;
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);
  const [category, setCategory] = useState<InquiryCategory>(initialCategory ?? "general");
```

3. `<option>` 라벨을 공용 맵으로:
```tsx
          {INQUIRY_CATEGORIES.map((c) => (
            <option key={c} value={c}>{INQUIRY_CATEGORY_LABEL[c]}</option>
          ))}
```
(`needsContact` 로직은 변경하지 않는다 — `category === "password"` 그대로.)

- [ ] **Step 2: `/support/page.tsx` — searchParams 프리필 + 라벨 맵**

`src/app/(public)/support/page.tsx`:
1. import에 DTO 추가:
```ts
import { INQUIRY_CATEGORIES, INQUIRY_CATEGORY_LABEL, type InquiryCategory } from "@/lib/dto/inquiry";
```
2. 함수 시그니처에 `searchParams`(Next 16 Promise) 추가하고 유효성 검증:
```tsx
export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const initialCategory = INQUIRY_CATEGORIES.includes(rawCategory as InquiryCategory)
    ? (rawCategory as InquiryCategory)
    : undefined;
  const user = await getCurrentUser();
  const myInquiries = user ? await listInquiries() : [];
```
3. `<InquiryForm ... />`에 `initialCategory={initialCategory}` 추가:
```tsx
      <InquiryForm
        isLoggedIn={!!user}
        defaultName={user?.name}
        defaultEmail={user?.email}
        initialCategory={initialCategory}
      />
```
4. "내 문의 내역" 라벨 삼항식 교체:
```tsx
                  <span>{INQUIRY_CATEGORY_LABEL[q.category]}</span>
```
(기존 `<span>{q.category === "password" ? "비밀번호 분실" : "일반 문의"}</span>`를 대체.)

- [ ] **Step 3: `/admin/inquiries/page.tsx` — 라벨 맵**

`src/app/(admin)/admin/inquiries/page.tsx`:
1. import에 라벨 맵 추가:
```ts
import { INQUIRY_CATEGORY_LABEL } from "@/lib/dto/inquiry";
```
2. 라벨 삼항식 교체(현재 `{q.category === "password" ? "비밀번호 분실" : "일반 문의"} ·{" "}` 형태):
```tsx
            {INQUIRY_CATEGORY_LABEL[q.category]} ·{" "}
```

- [ ] **Step 4: 푸터 href 연결**

`src/lib/main-page-data.ts`의 `FOOTER_COLUMNS` "소통" 열에서 `{ label: "제안 보내기" }`를 다음으로 변경:
```ts
{ label: "제안 보내기", href: "/support?category=suggestion" }
```

- [ ] **Step 5: lint·build·커밋**

```bash
pnpm lint && pnpm build
```
Expected: 통과.
```bash
git add src/app/ src/lib/main-page-data.ts
git commit -m "feat: 푸터 제안 보내기 → /support 제안 유형 연결"
```

---

## Task 3: 로컬 e2e 검증 및 plan 커밋

**Files:** (코드 변경 없음 — 검증·문서)

- [ ] **Step 1: dev 서버 기동·푸터 진입 확인**

`pnpm dev` 후 데스크톱 메인(`/`)에서 푸터 "소통" 열의 "제안 보내기"가 링크로 렌더되고, 클릭 시 `/support?category=suggestion`로 이동하는지 확인(브라우저 프리뷰). 폼의 "문의 유형" select가 **제안**으로 선택돼 열려야 한다.

> grant 초기화로 조회가 비면 로컬 한정 복구:
> ```bash
> CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
> docker exec -i "$CID" psql -U postgres -d postgres -c "grant select on all tables in schema public to anon, authenticated; grant all on all tables in schema public to service_role;"
> ```

- [ ] **Step 2: 제안 문의 제출 → DB 확인**

폼에 이름·이메일·내용을 채우고(비로그인이면 연락처도) 제출한다. 접수 후 DB에서 category 확인:
```bash
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec "$CID" psql -U postgres -d postgres -c "select category, name, left(body,20) from inquiries order by created_at desc limit 3;"
```
Expected: 방금 제출 건의 `category = 'suggestion'`.

- [ ] **Step 3: 무효 쿼리·기본값 확인**

`/support?category=foo` 접속 시 폼이 기본 "일반 문의"로 열리는지(에러 없음) 확인. `/support`(쿼리 없음)도 기본 일반 문의.

- [ ] **Step 4: 라벨 표시 확인(로그인/admin)**

로그인 사용자로 제안 문의 후 `/support`의 "내 문의 내역"에 "제안" 라벨이, admin 계정으로 `/admin/inquiries` 목록에 "제안" 라벨이 표시되는지 확인.

- [ ] **Step 5: lint·build 및 테스트 데이터 정리**

```bash
pnpm lint && pnpm build
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec "$CID" psql -U postgres -d postgres -c "delete from inquiries where category='suggestion' and name like '%E2E%' or body like '%E2E%';"
```
Expected: lint·build 통과. (검증용으로 넣은 데이터만 정리 — 식별 가능한 표식 사용 권장.)

- [ ] **Step 6: plan 커밋**

```bash
git add docs/superpowers/plans/2026-06-20-inquiry-suggestion-category.md
git commit -m "docs: 푸터 제안 보내기 → /support 제안 유형 plan 추가"
```

---

## Self-Review 메모

- **Spec 커버리지**: 마이그레이션=T1S2, DTO·라벨 맵=T1S4, 서비스 타입=T1S5, 폼 프리필/라벨=T2S1, 공개 페이지 프리필/라벨=T2S2, admin 라벨=T2S3, 푸터 href=T2S4, e2e=T3. 누락 없음.
- **Placeholder 스캔**: `<ts>`는 `supabase migration new`가 채우는 실제 타임스탬프, `<CID>`/`E2E`는 런타임 값/표식. 그 외 모든 코드·명령 구체화.
- **타입 일관성**: `InquiryCategory`(general·suggestion·password), `INQUIRY_CATEGORY_LABEL: Record<InquiryCategory,string>`, `initialCategory?: InquiryCategory`, 제약값 `('general','suggestion','password')` 전 구간 일치.
- **db:types**: 컬럼 타입 불변(check 제약만 변경) → `database.types.ts` 영향 없음(재생성 불필요).
- **검증 데이터 삭제 주의**: Step 5의 delete는 표식(`E2E`)이 있는 건만 지우도록 조건을 좁힐 것. 실데이터 보호.
