# 고객지원(문의) + 약관·개인정보 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **커밋 정책(중요):** 커밋·PR·운영 반영은 **사용자 승인 후**에만. A 단계(고객지원)와 B 단계(약관)는 **별도 PR**.

**Goal:** ① 문의 접수함(`/support` 사용자, `/admin/inquiries` 관리자, `inquiries` 테이블+RLS) ② `/terms`·`/privacy` 약관 페이지 + 회원가입 링크 연결.

**Architecture:** RLS가 1차 경계(insert는 anon 허용하되 user_id 위조 차단, select는 본인/admin, update는 admin). 조회는 `server/services/inquiry.ts`(단일 함수 — RLS가 역할별 범위를 자동 결정), 쓰기는 `server/actions/inquiry.ts`. 페이지는 공용 문서형 레이아웃 `DocPage`(데스크톱 DesktopNav solid / 모바일 자체 상단바).

**Tech Stack:** Next.js 16 App Router, TS strict, supabase-js+RLS, zod 4, Supabase CLI 마이그레이션, CSS Modules(팔레트 토큰).

---

## 검증 방식 (테스트 러너 없음)
- 코드 Task: `pnpm lint && pnpm build`.
- Task 7(로컬 e2e)·B단계 검토는 컨트롤러/사용자.

## 파일 구조

```
supabase/migrations/<ts>_inquiries.sql        # Task 1: 테이블+RLS
src/lib/database.types.ts                     # Task 1: pnpm db:types 재생성
src/lib/dto/inquiry.ts                        # Task 2: inquirySchema·answerSchema
src/server/services/inquiry.ts                # Task 2: listInquiries (RLS 범위)
src/server/actions/inquiry.ts                 # Task 2: submitInquiry·answerInquiry
src/app/_components/DocPage.tsx + .module.css # Task 3: 문서형 공용 레이아웃
src/app/(public)/support/page.tsx             # Task 4: 안내+폼+내 문의 내역
src/app/(public)/support/InquiryForm.tsx      # Task 4
src/app/(public)/support/support.module.css   # Task 4
src/app/(admin)/admin/inquiries/page.tsx      # Task 5: 관리자 접수함
src/app/(admin)/admin/inquiries/AnswerForm.tsx# Task 5
src/app/(admin)/admin/page.tsx                # Task 5: 접수함 링크 추가
src/app/(public)/login/LoginForm.tsx          # Task 6: 안내 → /support 링크
src/app/(public)/terms/page.tsx               # Task 8 (B)
src/app/(public)/privacy/page.tsx             # Task 8 (B)
src/app/(public)/signup/SignupForm.tsx        # Task 9 (B): 약관 링크 연결
```

---

### Task 1: `inquiries` 마이그레이션 + 타입 재생성

**Files:**
- Create: `supabase/migrations/<timestamp>_inquiries.sql` (`npx supabase migration new inquiries`로 생성)
- Regenerate: `src/lib/database.types.ts`

- [ ] **Step 1: 마이그레이션 생성·작성**

Run: `npx supabase migration new inquiries` → 생성된 파일에 작성:
```sql
-- 고객지원 문의함 — 비로그인 포함 접수. 열람은 본인/관리자, 답변·삭제는 관리자만(RLS).
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  category text not null check (category in ('general','password')),
  name text not null check (char_length(name) between 1 and 50),
  email text not null check (char_length(email) <= 254),
  contact text check (contact is null or char_length(contact) <= 100),
  body text not null check (char_length(body) between 1 and 2000),
  answer text check (answer is null or char_length(answer) <= 2000),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
create index inquiries_created_at_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

-- 접수: 비로그인 포함 누구나. 단 user_id는 비우거나 본인(타인 명의 위조 차단).
create policy inquiries_insert on public.inquiries for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- 열람: 관리자 전체 + 본인 것.
create policy inquiries_select on public.inquiries for select
  using (public.auth_is_admin() or user_id = (select auth.uid()));

-- 답변(update)·삭제: 관리자만.
create policy inquiries_update on public.inquiries for update
  using (public.auth_is_admin());
create policy inquiries_delete on public.inquiries for delete
  using (public.auth_is_admin());
```

- [ ] **Step 2: 로컬 적용 + 타입 재생성**

Run: `npx supabase db reset && pnpm db:types`
Expected: 마이그레이션 3개 적용, `database.types.ts`에 `inquiries` 타입 추가됨(`git diff src/lib/database.types.ts`로 확인).

- [ ] **Step 3: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add supabase/migrations src/lib/database.types.ts
git commit -m "feat: 고객지원 문의(inquiries) 테이블·RLS 추가"
```

---

### Task 2: dto + 서비스 + 액션

**Files:**
- Create: `src/lib/dto/inquiry.ts`
- Create: `src/server/services/inquiry.ts`
- Create: `src/server/actions/inquiry.ts`

- [ ] **Step 1: dto 작성** — `src/lib/dto/inquiry.ts`:
```typescript
// 고객지원 문의 입력 스키마 — 클라이언트 검증과 서버 검증이 공유(server-only 의존 없음).
import { z } from "zod";

export const INQUIRY_CATEGORIES = ["general", "password"] as const;
export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export const inquirySchema = z.object({
  category: z.enum(INQUIRY_CATEGORIES),
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50, "이름은 50자 이내로 입력해주세요."),
  email: z.email("이메일 형식을 확인해주세요."),
  contact: z
    .string()
    .trim()
    .max(100, "연락처는 100자 이내로 입력해주세요.")
    .optional()
    .transform((v) => v || null),
  body: z
    .string()
    .trim()
    .min(5, "문의 내용을 5자 이상 입력해주세요.")
    .max(2000, "문의 내용은 2000자 이내로 입력해주세요."),
});
export type InquiryInput = z.infer<typeof inquirySchema>;

export const answerSchema = z.object({
  id: z.uuid(),
  answer: z
    .string()
    .trim()
    .min(1, "답변을 입력해주세요.")
    .max(2000, "답변은 2000자 이내로 입력해주세요."),
});
```
(연락처 필수 여부는 맥락 의존 — 서버 액션에서 판정하므로 스키마에선 optional.)

- [ ] **Step 2: 서비스 작성** — `src/server/services/inquiry.ts`:
```typescript
// 문의 조회 — RLS가 역할별 범위를 결정한다(admin 전체, member 본인, anon 없음).
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";

export type InquiryRow = {
  id: string;
  category: "general" | "password";
  name: string;
  email: string;
  contact: string | null;
  body: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
};

export async function listInquiries(): Promise<InquiryRow[]> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("inquiries")
    .select("id, category, name, email, contact, body, answer, answered_at, created_at")
    .order("created_at", { ascending: false });
  return (data as InquiryRow[]) ?? [];
}
```

- [ ] **Step 3: 액션 작성** — `src/server/actions/inquiry.ts`:
```typescript
"use server";
// 고객지원 문의 — 접수(비로그인 포함)와 관리자 답변. RLS가 1차 경계, 답변은 진입부 권한 재확인.
import { revalidatePath } from "next/cache";
import { answerSchema, inquirySchema } from "@/lib/dto/inquiry";
import { requireAdmin } from "@/server/auth/current-user";
import { createSupabaseServer } from "@/server/supabase/server";

export interface SubmitInquiryState {
  error?: string;
  done?: boolean;
}

export async function submitInquiry(
  _prev: SubmitInquiryState,
  formData: FormData,
): Promise<SubmitInquiryState> {
  // honeypot — 봇이 채우는 숨김 필드. 채워져 있으면 저장 없이 조용히 성공 처리.
  if (formData.get("company")) return { done: true };

  const parsed = inquirySchema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    email: formData.get("email"),
    contact: formData.get("contact"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인앱 답변을 못 받는 경우(비로그인 또는 비밀번호 분실)는 연락처 필수.
  const needsContact = !user || parsed.data.category === "password";
  if (needsContact && !parsed.data.contact) {
    return { error: "답변을 받을 연락처(전화·카카오톡 등)를 입력해주세요." };
  }

  const { error } = await supabase.from("inquiries").insert({
    user_id: user?.id ?? null,
    category: parsed.data.category,
    name: parsed.data.name,
    email: parsed.data.email,
    contact: parsed.data.contact,
    body: parsed.data.body,
  });
  if (error) {
    return { error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/support");
  return { done: true };
}

export interface AnswerInquiryState {
  error?: string;
  success?: string;
}

export async function answerInquiry(
  _prev: AnswerInquiryState,
  formData: FormData,
): Promise<AnswerInquiryState> {
  await requireAdmin();

  const parsed = answerSchema.safeParse({
    id: formData.get("id"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("inquiries")
    .update({ answer: parsed.data.answer, answered_at: new Date().toISOString() })
    .eq("id", parsed.data.id);
  if (error) return { error: "답변 저장에 실패했습니다." };

  revalidatePath("/admin/inquiries");
  revalidatePath("/support");
  return { success: "답변을 저장했습니다." };
}
```

- [ ] **Step 4: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add src/lib/dto/inquiry.ts src/server/services/inquiry.ts src/server/actions/inquiry.ts
git commit -m "feat: 문의 접수·답변 스키마·서비스·액션 추가"
```

---

### Task 3: 공용 문서형 레이아웃 `DocPage`

**Files:**
- Create: `src/app/_components/DocPage.tsx`
- Create: `src/app/_components/DocPage.module.css`

- [ ] **Step 1: DocPage.tsx 작성**
```tsx
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { getDeviceType } from "@/lib/device";
import DesktopNav from "@/app/_components/DesktopNav";
import styles from "./DocPage.module.css";

// 문서형 공용 레이아웃 — 디자인 원본이 없는 안내·약관 페이지용(고객지원·이용약관·개인정보).
// 데스크톱은 사이트 공통 DesktopNav(solid), 모바일은 항상 보이는 단순 상단바.
export default async function DocPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  return (
    <div className={styles.page}>
      {device === "desktop" ? (
        <DesktopNav variant="solid" />
      ) : (
        <div className={styles.mobileBar}>
          <Link href="/main" className={styles.mobileBrand} aria-label="메인페이지로 이동">
            <svg width="10" height="16" viewBox="0 0 12 20" aria-hidden="true">
              <rect x="5" y="0" width="2" height="20" fill="var(--palette-primary)" />
              <rect x="0" y="5" width="12" height="2" fill="var(--palette-primary)" />
            </svg>
            서경노회 교육위원회
          </Link>
        </div>
      )}
      <main className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: DocPage.module.css 작성**
```css
/* 문서형 페이지 공통 — 팔레트 토큰 기반(디자인 원본 없는 페이지 전용). */
.page {
  min-height: 100vh;
  background: var(--palette-bg);
  color: var(--palette-ink);
}

.mobileBar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: rgba(251, 248, 241, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--palette-line);
}
.mobileBrand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--palette-ink);
  text-decoration: none;
}

.container {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 20px 96px;
}
.title {
  margin: 0 0 10px;
  font-family: var(--font-noto-serif-kr), serif;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.lead {
  margin: 0 0 36px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--palette-muted);
}

/* 본문 요소 — 약관 등 긴 문서용 */
.container h2 {
  margin: 36px 0 10px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.container p,
.container li {
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--palette-ink);
}
.container ul {
  padding-left: 20px;
  margin: 8px 0 16px;
}
```

- [ ] **Step 3: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 4: 커밋 (사용자 승인 후)**
```bash
git add src/app/_components/DocPage.tsx src/app/_components/DocPage.module.css
git commit -m "feat: 문서형 공용 레이아웃 DocPage 추가"
```

---

### Task 4: `/support` 고객지원 페이지

**Files:**
- Create: `src/app/(public)/support/page.tsx`
- Create: `src/app/(public)/support/InquiryForm.tsx`
- Create: `src/app/(public)/support/support.module.css`

- [ ] **Step 1: support.module.css 작성**
```css
/* 고객지원 — 문의 폼·내역. 팔레트 토큰 기반(디자인 원본 없음). */
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  background: var(--palette-surface);
  border: 1px solid var(--palette-line);
  border-radius: 10px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
  }
}
.label {
  display: block;
  margin-bottom: 6px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 13px;
  font-weight: 600;
}
.input,
.textarea,
.select {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  background: #fff;
  border: 1px solid var(--palette-line);
  border-radius: 8px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 14px;
  color: var(--palette-ink);
  outline: none;
}
.input:focus,
.textarea:focus,
.select:focus {
  border-color: var(--palette-accent);
}
.textarea {
  min-height: 140px;
  resize: vertical;
}
.notice {
  margin: 0;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--palette-secondary);
}
.error {
  margin: 0;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 12.5px;
  color: #9b3a2a;
}
.submit {
  padding: 13px 24px;
  border: 1px solid var(--palette-primary);
  border-radius: 8px;
  background: var(--palette-primary);
  color: #fff;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
}
.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.done {
  padding: 24px;
  background: var(--palette-surface);
  border: 1px solid var(--palette-line);
  border-radius: 10px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 14.5px;
  line-height: 1.7;
}
/* 숨김 honeypot — 시각·스크린리더 모두에서 제외 */
.hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* 내 문의 내역 */
.history {
  margin-top: 40px;
}
.historyTitle {
  margin: 0 0 12px;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 17px;
  font-weight: 700;
}
.item {
  padding: 16px 18px;
  border: 1px solid var(--palette-line);
  border-radius: 10px;
  background: var(--palette-surface);
  margin-bottom: 10px;
}
.itemMeta {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 12.5px;
  color: var(--palette-muted);
  margin-bottom: 6px;
}
.badgeDone {
  color: var(--palette-primary);
  font-weight: 700;
}
.badgeOpen {
  color: var(--palette-muted);
}
.itemBody {
  margin: 0;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}
.answerBox {
  margin-top: 10px;
  padding: 12px 14px;
  border-left: 3px solid var(--palette-accent);
  background: #fff;
  border-radius: 0 8px 8px 0;
}
.answerLabel {
  display: block;
  font-family: var(--font-noto-sans-kr), sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--palette-secondary);
  margin-bottom: 4px;
}
```

- [ ] **Step 2: InquiryForm.tsx 작성**
```tsx
"use client";
import { useState } from "react";
import { useActionState } from "react";
import {
  submitInquiry,
  type SubmitInquiryState,
} from "@/server/actions/inquiry";
import {
  INQUIRY_CATEGORIES,
  type InquiryCategory,
} from "@/lib/dto/inquiry";
import styles from "./support.module.css";

const CATEGORY_LABEL: Record<InquiryCategory, string> = {
  general: "일반 문의",
  password: "비밀번호 분실",
};

const initialState: SubmitInquiryState = {};

// 로그인 사용자는 이름·이메일이 미리 채워진다. 연락처는 인앱 답변을 못 받는
// 경우(비로그인 또는 비밀번호 분실)에만 노출·필수.
export default function InquiryForm({
  isLoggedIn,
  defaultName,
  defaultEmail,
}: {
  isLoggedIn: boolean;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);
  const [category, setCategory] = useState<InquiryCategory>("general");
  const needsContact = !isLoggedIn || category === "password";

  if (state.done) {
    return (
      <div className={styles.done} role="status">
        문의가 접수되었습니다.
        {needsContact
          ? " 입력하신 연락처로 답변드리겠습니다."
          : " 답변이 등록되면 이 페이지의 내 문의 내역에서 확인하실 수 있습니다."}
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      <div>
        <label htmlFor="inq-category" className={styles.label}>문의 유형</label>
        <select
          id="inq-category"
          name="category"
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value as InquiryCategory)}
        >
          {INQUIRY_CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="inq-name" className={styles.label}>이름</label>
          <input
            id="inq-name"
            name="name"
            className={styles.input}
            required
            defaultValue={defaultName}
            placeholder="홍길동"
          />
        </div>
        <div>
          <label htmlFor="inq-email" className={styles.label}>이메일</label>
          <input
            id="inq-email"
            name="email"
            type="email"
            className={styles.input}
            required
            defaultValue={defaultEmail}
            placeholder="you@example.com"
          />
        </div>
      </div>

      {needsContact && (
        <div>
          <label htmlFor="inq-contact" className={styles.label}>연락처</label>
          <input
            id="inq-contact"
            name="contact"
            className={styles.input}
            required
            placeholder="전화번호 또는 카카오톡 ID"
          />
          <p className={styles.notice}>
            {category === "password"
              ? "비밀번호 분실 시 로그인이 불가하므로, 답변은 입력하신 연락처로 드립니다."
              : "비로그인 문의는 입력하신 연락처로 답변드립니다."}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="inq-body" className={styles.label}>문의 내용</label>
        <textarea
          id="inq-body"
          name="body"
          className={styles.textarea}
          required
          minLength={5}
          maxLength={2000}
          placeholder="문의하실 내용을 적어주세요."
        />
      </div>

      {/* honeypot — 사람은 보지 못하는 필드. 봇 차단용 */}
      <div className={styles.hp} aria-hidden="true">
        <label>
          회사명
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "접수 중…" : "문의 접수"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: page.tsx 작성**
```tsx
import type { Metadata } from "next";
import { getCurrentUser } from "@/server/auth/current-user";
import { listInquiries } from "@/server/services/inquiry";
import { formatDate } from "@/lib/format";
import DocPage from "@/app/_components/DocPage";
import InquiryForm from "./InquiryForm";
import styles from "./support.module.css";

export const metadata: Metadata = { title: "고객지원" };

// 비로그인 포함 공개 페이지. 내 문의 내역은 RLS로 본인 것만 조회된다(비로그인이면 빈 목록).
export default async function SupportPage() {
  const user = await getCurrentUser();
  const myInquiries = user ? await listInquiries() : [];

  return (
    <DocPage
      title="고객지원"
      lead="서비스 이용 중 불편한 점이나 비밀번호 분실 등 도움이 필요하시면 문의를 남겨주세요. 일반 문의는 로그인 후 이 페이지에서 답변을 확인하실 수 있고, 비밀번호 분실 문의는 입력하신 연락처로 답변드립니다."
    >
      <InquiryForm
        isLoggedIn={!!user}
        defaultName={user?.name}
        defaultEmail={user?.email}
      />

      {user && (
        <section className={styles.history}>
          <h2 className={styles.historyTitle}>내 문의 내역</h2>
          {myInquiries.length === 0 ? (
            <p className={styles.notice}>접수된 문의가 없습니다.</p>
          ) : (
            myInquiries.map((q) => (
              <div key={q.id} className={styles.item}>
                <div className={styles.itemMeta}>
                  <span>{q.category === "password" ? "비밀번호 분실" : "일반 문의"}</span>
                  <span>{formatDate(q.created_at)}</span>
                  <span className={q.answer ? styles.badgeDone : styles.badgeOpen}>
                    {q.answer ? "답변완료" : "접수됨"}
                  </span>
                </div>
                <p className={styles.itemBody}>{q.body}</p>
                {q.answer && (
                  <div className={styles.answerBox}>
                    <span className={styles.answerLabel}>답변</span>
                    <p className={styles.itemBody}>{q.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}
    </DocPage>
  );
}
```
> 주의: `formatDate`는 `src/lib/format.ts`에 이미 존재 — 시그니처를 먼저 읽고 다르면 맞춰 사용.

- [ ] **Step 4: 검증** — Run: `pnpm lint && pnpm build` → 통과, `/support` 라우트 등장.

- [ ] **Step 5: 커밋 (사용자 승인 후)**
```bash
git add "src/app/(public)/support/"
git commit -m "feat: 고객지원 페이지 추가(문의 접수 + 내 문의 내역)"
```

---

### Task 5: `/admin/inquiries` 관리자 접수함

**Files:**
- Create: `src/app/(admin)/admin/inquiries/page.tsx`
- Create: `src/app/(admin)/admin/inquiries/AnswerForm.tsx`
- Modify: `src/app/(admin)/admin/page.tsx` (링크 추가)

- [ ] **Step 1: AnswerForm.tsx 작성** (admin 폼 패턴 — 인라인 스타일)
```tsx
"use client";
import { useActionState } from "react";
import {
  answerInquiry,
  type AnswerInquiryState,
} from "@/server/actions/inquiry";

const initialState: AnswerInquiryState = {};

export default function AnswerForm({
  inquiryId,
  defaultAnswer,
}: {
  inquiryId: string;
  defaultAnswer?: string;
}) {
  const [state, formAction, pending] = useActionState(answerInquiry, initialState);

  return (
    <form action={formAction} style={{ display: "grid", gap: 8, marginTop: 10 }}>
      <input type="hidden" name="id" value={inquiryId} />
      <textarea
        name="answer"
        required
        defaultValue={defaultAnswer}
        placeholder="답변 내용 (비밀번호 분실 건은 연락처로 전달 후 '처리 완료' 등으로 기록)"
        style={{
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 6,
          minHeight: 80,
        }}
      />
      {state.error && (
        <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>
      )}
      {state.success && (
        <p role="status" style={{ color: "#0a0", margin: 0 }}>{state.success}</p>
      )}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : defaultAnswer ? "답변 수정" : "답변 저장"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: page.tsx 작성**
```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listInquiries } from "@/server/services/inquiry";
import { formatDate } from "@/lib/format";
import AnswerForm from "./AnswerForm";

// proxy(/admin/:path*)가 1차 가드, 여기서 서버 권한 재확인.
export default async function AdminInquiriesPage() {
  await requireAdmin();
  const inquiries = await listInquiries();

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <p>
        <Link href="/admin">← 관리자 홈</Link>
      </p>
      <h1 style={{ fontSize: 24 }}>문의 접수함</h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        비밀번호 분실 건은 관리자 홈의 &quot;회원 비밀번호 재설정&quot;으로 임시
        비밀번호를 발급해 연락처로 전달한 뒤, 답변에 처리 결과를 기록해주세요.
      </p>

      {inquiries.length === 0 && <p>접수된 문의가 없습니다.</p>}

      {inquiries.map((q) => (
        <details
          key={q.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 10,
          }}
        >
          <summary style={{ cursor: "pointer", fontSize: 14 }}>
            <strong>{q.name}</strong> · {q.email} ·{" "}
            {q.category === "password" ? "비밀번호 분실" : "일반 문의"} ·{" "}
            {formatDate(q.created_at)} ·{" "}
            <span style={{ color: q.answer ? "#0a0" : "#c60", fontWeight: 700 }}>
              {q.answer ? "답변완료" : "접수됨"}
            </span>
          </summary>
          <div style={{ marginTop: 10, fontSize: 14 }}>
            {q.contact && (
              <p style={{ margin: "0 0 8px" }}>연락처: {q.contact}</p>
            )}
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{q.body}</p>
            <AnswerForm inquiryId={q.id} defaultAnswer={q.answer ?? undefined} />
          </div>
        </details>
      ))}
    </main>
  );
}
```

- [ ] **Step 3: admin 홈에 링크 추가** — `src/app/(admin)/admin/page.tsx`의 로그아웃 `</form>` 뒤에:
```tsx
      <p style={{ marginTop: 16 }}>
        <Link href="/admin/inquiries">문의 접수함 →</Link>
      </p>
```
(파일 상단에 `import Link from "next/link";` 추가.)

- [ ] **Step 4: 검증** — Run: `pnpm lint && pnpm build` → 통과, `/admin/inquiries` 라우트 등장.

- [ ] **Step 5: 커밋 (사용자 승인 후)**
```bash
git add "src/app/(admin)/admin/"
git commit -m "feat: 관리자 문의 접수함 추가(목록·답변)"
```

---

### Task 6: 로그인 안내 → `/support` 링크

**Files:**
- Modify: `src/app/(public)/login/LoginForm.tsx`

- [ ] **Step 1:** 다음 줄을:
```tsx
            <span className={styles.forgot} style={{ cursor: "default" }}>분실 시 관리자에게 문의</span>
```
다음으로 교체 (`Link`는 이미 import됨):
```tsx
            <Link href="/support" className={styles.forgot}>비밀번호를 잊으셨나요?</Link>
```

- [ ] **Step 2: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 3: 커밋 (사용자 승인 후)**
```bash
git add "src/app/(public)/login/LoginForm.tsx"
git commit -m "feat: 로그인 화면 분실 안내를 고객지원 링크로 연결"
```

---

### Task 7: A단계 로컬 e2e (컨트롤러 실행)

- [ ] **Step 1: RLS 검증 (스크립트)** — anon 클라이언트로:
  1. `category='password'` + contact 포함 insert → 성공.
  2. **타인 user_id를 지정한 insert → 거부**(RLS with check).
  3. anon select → 0건. member 로그인 select → 본인 것만. admin select → 전체.
  4. member가 update(답변) 시도 → 거부, admin update → 성공.
- [ ] **Step 2: UI 검증 (Claude Preview/curl)** — `/support` 렌더(폼·유형 전환 시 연락처 필드), 제출 → done 메시지, 로그인 시 내 문의 내역 표시. `/admin/inquiries` — 비admin 접근 시 `/login` 리다이렉트.
- [ ] **Step 3: 결과 보고 → 사용자 승인 후 A단계 커밋·PR/머지.**

---

### Task 8 (B단계): `/terms`·`/privacy` 페이지

**Files:**
- Create: `src/app/(public)/terms/page.tsx`
- Create: `src/app/(public)/privacy/page.tsx`

- [ ] **Step 1: terms/page.tsx 작성**
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import DocPage from "@/app/_components/DocPage";

export const metadata: Metadata = { title: "이용약관" };

// 정적 약관 문서. 문구 확정은 운영자(관리자) 검토를 거친다.
export default function TermsPage() {
  return (
    <DocPage title="이용약관" lead="서경노회 교육위원회 홈페이지(이하 '본 사이트') 이용에 관한 약관입니다.">
      <h2>제1조 (목적)</h2>
      <p>
        이 약관은 서경노회 교육위원회(이하 &quot;위원회&quot;)가 운영하는 본 사이트가
        제공하는 교육 행사 안내, 교육 자료, 게시판 등 서비스의 이용 조건과 절차,
        위원회와 이용자의 권리·의무를 정함을 목적으로 합니다.
      </p>

      <h2>제2조 (회원 가입과 계정)</h2>
      <ul>
        <li>회원 가입은 이메일과 비밀번호로 이루어지며, 가입 즉시 일반 회원 자격이 부여됩니다.</li>
        <li>계정 정보(이메일·비밀번호)는 본인이 관리해야 하며, 타인에게 양도·대여할 수 없습니다.</li>
        <li>비밀번호를 분실한 경우 <Link href="/support">고객지원</Link>으로 문의하면 관리자가 임시 비밀번호를 발급합니다.</li>
      </ul>

      <h2>제3조 (서비스 이용)</h2>
      <ul>
        <li>본 사이트는 노회 산하 교회와 회원을 위한 비영리 교육 포털로, 서비스는 무료로 제공됩니다.</li>
        <li>위원회는 운영상·기술상 필요에 따라 서비스 내용을 변경하거나 일시 중단할 수 있습니다.</li>
      </ul>

      <h2>제4조 (게시물과 책임)</h2>
      <ul>
        <li>회원이 게시판에 작성한 글·댓글의 책임은 작성자 본인에게 있습니다.</li>
        <li>타인의 권리를 침해하거나 공동체 목적에 어긋나는 게시물(비방·음란·광고 등)은 사전 통지 없이 삭제될 수 있으며, 반복 시 이용이 제한될 수 있습니다.</li>
        <li>교육 자료 등 위원회가 제공하는 콘텐츠는 노회 공동체 내 교육 목적으로만 사용해야 합니다.</li>
      </ul>

      <h2>제5조 (면책)</h2>
      <p>
        위원회는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단과 회원
        상호 간 또는 회원과 제3자 간 분쟁에 대해 책임을 지지 않습니다. 다만
        위원회의 고의 또는 중대한 과실로 인한 손해는 예외로 합니다.
      </p>

      <h2>제6조 (약관의 변경)</h2>
      <p>
        이 약관은 변경될 수 있으며, 변경 시 본 사이트에 공지합니다. 변경 후에도
        서비스를 계속 이용하면 변경된 약관에 동의한 것으로 봅니다.
      </p>

      <h2>부칙</h2>
      <p>이 약관은 2026년 6월 11일부터 적용됩니다.</p>
      <p>
        문의: <Link href="/support">고객지원</Link>
      </p>
    </DocPage>
  );
}
```

- [ ] **Step 2: privacy/page.tsx 작성**
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import DocPage from "@/app/_components/DocPage";

export const metadata: Metadata = { title: "개인정보 처리방침" };

// 정적 처리방침 문서. 문구 확정은 운영자(관리자) 검토를 거친다.
export default function PrivacyPage() {
  return (
    <DocPage
      title="개인정보 처리방침"
      lead="서경노회 교육위원회는 개인정보 보호법 등 관련 법령을 준수하며, 이용자의 개인정보를 다음과 같이 처리합니다."
    >
      <h2>1. 수집하는 개인정보 항목과 수집 방법</h2>
      <ul>
        <li>회원 가입 시: 이메일 주소, 성함, 소속 교회(선택), 비밀번호(암호화 저장)</li>
        <li>고객지원 문의 시: 이름, 이메일 주소, 연락처(전화번호·메신저 ID 등, 비로그인·비밀번호 분실 문의에 한함), 문의 내용</li>
        <li>관리자 발급 계정의 경우: 위 항목에 더해 직함</li>
      </ul>

      <h2>2. 개인정보의 이용 목적</h2>
      <ul>
        <li>회원 식별과 로그인 등 서비스 제공</li>
        <li>게시판 등 커뮤니티 운영(작성자 표시)</li>
        <li>문의 응대와 비밀번호 분실 처리(임시 비밀번호 전달)</li>
      </ul>

      <h2>3. 보유 및 이용 기간</h2>
      <ul>
        <li>회원 정보: 회원 자격이 유지되는 동안 보유하며, 탈퇴(계정 삭제) 요청 시 지체 없이 파기합니다. 계정 삭제는 고객지원으로 요청할 수 있습니다.</li>
        <li>문의 기록: 처리 완료 후 1년간 보관 후 파기합니다.</li>
      </ul>

      <h2>4. 처리 위탁 및 국외 이전</h2>
      <p>
        본 사이트는 서비스 운영을 위해 아래 클라우드 서비스에 데이터 보관·처리를
        위탁하며, 이 과정에서 개인정보가 국외 서버에서 처리될 수 있습니다.
      </p>
      <ul>
        <li>Supabase Inc. — 데이터베이스·인증·파일 저장 (서버 소재지: 대한민국 서울 리전, AWS)</li>
        <li>Vercel Inc. — 웹 호스팅 (소재지: 미국)</li>
      </ul>

      <h2>5. 정보주체의 권리</h2>
      <p>
        이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할
        수 있습니다. 요청은 <Link href="/support">고객지원</Link>을 통해 접수되며,
        지체 없이 처리합니다.
      </p>

      <h2>6. 개인정보의 파기</h2>
      <p>
        보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 전자적 파일 형태의
        경우 복구할 수 없는 방법으로 즉시 삭제합니다.
      </p>

      <h2>7. 개인정보 보호책임자</h2>
      <p>
        개인정보 보호책임자: 서경노회 교육위원회 관리자 — 문의는{" "}
        <Link href="/support">고객지원</Link>으로 부탁드립니다.
      </p>

      <h2>부칙</h2>
      <p>이 방침은 2026년 6월 11일부터 적용됩니다.</p>
    </DocPage>
  );
}
```

- [ ] **Step 3: 검증** — Run: `pnpm lint && pnpm build` → 통과, `/terms`·`/privacy` 라우트 등장.

- [ ] **Step 4: 커밋 (사용자 승인 후)**
```bash
git add "src/app/(public)/terms/" "src/app/(public)/privacy/"
git commit -m "feat: 이용약관·개인정보 처리방침 페이지 추가"
```

---

### Task 9 (B단계): 회원가입 약관 링크 연결

**Files:**
- Modify: `src/app/(public)/signup/SignupForm.tsx`

- [ ] **Step 1:** 약관 동의 라벨의 placeholder 링크 2개를:
```tsx
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>이용약관</a> 및{" "}
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>개인정보 처리방침</a>에 동의합니다.
```
다음으로 교체 (새 탭 — 작성 중인 폼 상태 보존):
```tsx
            <a href="/terms" target="_blank" rel="noreferrer" className={styles.termsLink}>이용약관</a> 및{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" className={styles.termsLink}>개인정보 처리방침</a>에 동의합니다.
```

- [ ] **Step 2: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 3: 커밋 (사용자 승인 후)**
```bash
git add "src/app/(public)/signup/SignupForm.tsx"
git commit -m "feat: 회원가입 약관 링크를 실제 페이지로 연결"
```

---

### Task 10 (B단계): 약관 본문 사용자 검토 게이트 + 최종 검증

- [ ] **Step 1:** `/terms`·`/privacy` 렌더 화면(또는 본문)을 사용자에게 제시 → **법적 문구 확정 검토**(특히: 문의 기록 보관 1년, 개인정보 보호책임자 표기, 국외 이전 고지). 수정 요청 반영.
- [ ] **Step 2:** 전체 흐름 확인 — 회원가입 약관 링크 새 탭, `/support` 문의·내역, `/admin/inquiries` 답변 → 사용자측 반영.
- [ ] **Step 3:** 사용자 승인 후 B단계 커밋·PR/머지.

---

## Self-Review (작성자 점검)

- **Spec 커버리지**: A1 마이그레이션+RLS(T1) · A2 /support(T2·T3·T4) · A3 /admin/inquiries(T5) · A4 로그인 링크(T6) · B1 약관(T8) · B2 가입 링크(T9) · 검증(T7·T10). 연락처 필수 서버 판정(T2 액션) 포함.
- **타입 일관성**: `SubmitInquiryState{error,done}`·`AnswerInquiryState{error,success}`(T2 정의→T4·T5 사용), `InquiryRow`(T2→T4·T5), `inquirySchema`·`answerSchema`·`INQUIRY_CATEGORIES`(T2→T4), DocPage props(title·lead·children — T3→T4·T8).
- **확인 필요 항목 명시**: `formatDate` 시그니처(T4 주의), admin page의 Link import(T5).
- **순서 의존**: T1(타입) → T2 → T3 → T4·T5 → T6. B단계(T8·T9)는 T3(DocPage) 이후 언제든.
- **운영 주의**: 머지·push 후 운영 DB에 `npx supabase db push`(inquiries 마이그레이션) 필요 — 사용자 승인 게이트. Task 7 보고에 포함.
