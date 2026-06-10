# 비밀번호 재설정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **커밋 정책(중요):** 이 저장소는 "사용자가 명시 요청할 때만 커밋/PR" 원칙. 각 Task의 커밋 단계는 **사용자 승인 후** 실행한다.

**Goal:** 로그인 화면의 "비밀번호를 잊으셨나요?"를 실제 동작시킨다 — 요청 페이지 → 복구 메일(token_hash) → `/auth/confirm`(변경 없음) → 새 비밀번호 설정 → `/main`.

**Architecture:** `/forgot-password`(요청)와 `/reset-password`(설정) 2개 페이지. 액션 2개(`requestPasswordReset`·`updatePassword`)를 기존 `auth.ts`에 추가하고, 복구 메일 템플릿을 confirmation과 동일 방식으로 등록한다. 콜백·디자인(AuthLayout)·safeNext는 기존 그대로 재사용.

**Tech Stack:** Next.js 16 App Router, TS strict, @supabase/ssr, zod 4. 로컬 검증은 Supabase CLI 스택(Mailpit).

---

## 검증 방식 (테스트 러너 없음)

- 코드 Task: `pnpm lint && pnpm build`.
- 마지막 Task: 로컬 Supabase 스택 + Mailpit으로 백엔드 e2e(컨트롤러 실행).

## 파일 구조

```
src/lib/dto/auth.ts                          # Modify: resetRequestSchema, newPasswordSchema
src/server/actions/auth.ts                   # Modify: requestOrigin 헬퍼 + 액션 2개
supabase/templates/recovery.html             # Create
supabase/config.toml                         # Modify: [auth.email.template.recovery]
src/app/(public)/forgot-password/page.tsx    # Create
src/app/(public)/forgot-password/ForgotPasswordForm.tsx  # Create
src/app/(public)/reset-password/page.tsx     # Create (세션 가드)
src/app/(public)/reset-password/ResetPasswordForm.tsx    # Create
src/app/(public)/login/LoginForm.tsx         # Modify: forgot span → Link
```

---

### Task 1: zod 스키마 추가

**Files:**
- Modify: `src/lib/dto/auth.ts`

- [ ] **Step 1: 파일 끝에 스키마 2개 추가**

`src/lib/dto/auth.ts` 끝(`SignupInput` 아래)에 추가:
```typescript
export const resetRequestSchema = z.object({
  email: z.email("이메일 형식을 확인해주세요."),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
```

- [ ] **Step 2: 검증**

Run: `pnpm lint`
Expected: 통과

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add src/lib/dto/auth.ts
git commit -m "feat: 비밀번호 재설정 zod 스키마 추가"
```

---

### Task 2: 액션 2개 + origin 헬퍼 (`auth.ts`)

**Files:**
- Modify: `src/server/actions/auth.ts`

- [ ] **Step 1: import 갱신 + origin 헬퍼 추출**

먼저 파일을 읽는다. import 줄을 다음으로 교체:
```typescript
import {
  loginSchema,
  newPasswordSchema,
  resetRequestSchema,
  signupSchema,
} from "@/lib/dto/auth";
```

`signup` 함수 안의 origin 구성(아래 4줄)을:
```typescript
  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
```
다음 호출로 교체:
```typescript
  const origin = await requestOrigin();
```
그리고 파일에 module-private 헬퍼를 추가(`login` 위 등 적절한 위치):
```typescript
// 확인·복구 메일 콜백의 절대 origin — 운영은 NEXT_PUBLIC_SITE_URL, 없으면 요청 헤더.
async function requestOrigin(): Promise<string> {
  const h = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`
  );
}
```

- [ ] **Step 2: 액션 2개 추가 (파일 끝)**

```typescript
export interface ResetRequestState {
  error?: string;
  sent?: boolean;
}

// 비밀번호 재설정 메일 요청 — 계정 존재 여부를 노출하지 않도록 결과는 항상 동일하게 응답.
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "이메일 형식을 확인해주세요." };
  }

  const origin = await requestOrigin();
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  // rate limit 등 명시적 실패만 일반 메시지(존재 여부 비노출 — 미존재 계정은 error 없이 통과).
  if (error) {
    return { error: "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  return { sent: true };
}

export interface UpdatePasswordState {
  error?: string;
}

// 새 비밀번호 설정 — 복구 링크(verifyOtp)로 생성된 세션이 있어야 한다(페이지 가드 + 여기서 재확인).
export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "세션이 만료되었습니다. 재설정 메일을 다시 요청해주세요." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "비밀번호 변경에 실패했습니다. 다른 비밀번호로 시도해주세요." };
  }

  redirect("/main");
}
```

- [ ] **Step 3: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. `login`·`signup`·`logout` 동작 미변경(시그니처 그대로).

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add src/server/actions/auth.ts
git commit -m "feat: 비밀번호 재설정 요청·변경 Server Action 추가"
```

---

### Task 3: 복구 메일 템플릿 + config 등록

**Files:**
- Create: `supabase/templates/recovery.html`
- Modify: `supabase/config.toml`

- [ ] **Step 1: 템플릿 작성**

`supabase/templates/recovery.html`:
```html
<h2>서경노회 교육위원회 — 비밀번호 재설정</h2>
<p>아래 버튼을 눌러 새 비밀번호를 설정해주세요. 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">비밀번호 재설정하기</a>
</p>
```

- [ ] **Step 2: config.toml에 recovery 템플릿 등록**

`supabase/config.toml`의 `[auth.email.template.confirmation]` 블록(254행 근처) 바로 아래에 추가:
```toml
[auth.email.template.recovery]
subject = "[서경노회 교육위원회] 비밀번호 재설정"
content_path = "./supabase/templates/recovery.html"
```
(confirmation의 `content_path` 기준 경로가 e2e로 검증된 형식이므로 동일하게 사용.)

- [ ] **Step 3: 검증**

Run: `pnpm lint` (toml/html은 lint 대상 아님 — 다른 파일 미파손 확인용)
Expected: 통과. 실제 메일 형식은 Task 7 e2e에서 확인.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add supabase/config.toml supabase/templates/recovery.html
git commit -m "feat: 비밀번호 재설정 메일 템플릿 등록"
```

---

### Task 4: `/forgot-password` 페이지

**Files:**
- Create: `src/app/(public)/forgot-password/page.tsx`
- Create: `src/app/(public)/forgot-password/ForgotPasswordForm.tsx`

- [ ] **Step 1: page.tsx 작성**

```tsx
import type { Metadata } from "next";
import AuthLayout from "../_components/auth/AuthLayout";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "비밀번호 재설정" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
```

- [ ] **Step 2: ForgotPasswordForm.tsx 작성**

```tsx
"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/server/actions/auth";
import { resetRequestSchema } from "@/lib/dto/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import styles from "../_components/auth/auth.module.css";

const initialState: ResetRequestState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const [email, setEmail] = useState("");
  const [clientError, setClientError] = useState<string | undefined>();

  // 클라이언트 즉시 검증 — 실패 시 제출 막고 오류 표시, 통과 시 Server Action 진행.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = resetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      e.preventDefault();
      setClientError(parsed.error.issues[0]?.message);
      return;
    }
    setClientError(undefined);
  }

  if (state.sent) {
    return (
      <>
        <div className={styles.brandRow}>
          <BrandLockup />
        </div>
        <p className={styles.label} style={{ textAlign: "center", lineHeight: 1.6 }}>
          재설정 메일을 보냈습니다.
          <br />
          메일의 링크를 눌러 새 비밀번호를 설정해주세요.
        </p>
        <div className={styles.footer}>
          <Link href="/login" className={styles.footerLink}>로그인으로 돌아가기</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.brandRow}>
        <BrandLockup />
      </div>

      <p className={styles.label} style={{ textAlign: "center", lineHeight: 1.6, marginBottom: 22 }}>
        가입하신 이메일을 입력하시면
        <br />
        비밀번호 재설정 링크를 보내드립니다.
      </p>

      <form action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <span className={styles.inputWrap}>
            <input
              name="email"
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </span>
        </label>
        {clientError && <p className={styles.error}>{clientError}</p>}
        {state.error && <p role="alert" className={styles.error}>{state.error}</p>}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "전송 중…" : "재설정 링크 보내기"}
        </button>
      </form>

      <div className={styles.footer}>
        비밀번호가 기억나셨나요?{" "}
        <Link href="/login" className={styles.footerLink}>로그인</Link>
      </div>
    </>
  );
}
```

- [ ] **Step 3: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. `/forgot-password` 라우트가 빌드 목록에 등장.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add "src/app/(public)/forgot-password/"
git commit -m "feat: 비밀번호 재설정 요청 페이지 추가"
```

---

### Task 5: `/reset-password` 페이지 (세션 가드)

**Files:**
- Create: `src/app/(public)/reset-password/page.tsx`
- Create: `src/app/(public)/reset-password/ResetPasswordForm.tsx`

- [ ] **Step 1: page.tsx 작성 (세션 없으면 요청 페이지로)**

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import AuthLayout from "../_components/auth/AuthLayout";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "새 비밀번호 설정" };

// 복구 링크(verifyOtp)로 세션이 만들어진 상태에서만 진입. 직접 접근은 요청 페이지로 보낸다.
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/forgot-password");
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
```

- [ ] **Step 2: ResetPasswordForm.tsx 작성**

```tsx
"use client";
import { useActionState, useState } from "react";
import {
  updatePassword,
  type UpdatePasswordState,
} from "@/server/actions/auth";
import { newPasswordSchema } from "@/lib/dto/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import PasswordInput from "../_components/auth/PasswordInput";
import styles from "../_components/auth/auth.module.css";

type Errors = Partial<Record<"password" | "passwordConfirm", string>>;

const initialState: UpdatePasswordState = {};

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);
  const [f, setF] = useState({ password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const set =
    (k: keyof typeof f) =>
    (v: string) =>
      setF((p) => ({ ...p, [k]: v }));

  // 클라이언트 즉시 검증 — 실패 시 제출 막고 필드 오류 표시, 통과 시 Server Action 진행.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = newPasswordSchema.safeParse(f);
    if (!parsed.success) {
      e.preventDefault();
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
  }

  return (
    <>
      <div className={styles.brandRow}>
        <BrandLockup />
      </div>

      <p className={styles.label} style={{ textAlign: "center", lineHeight: 1.6, marginBottom: 22 }}>
        새로 사용할 비밀번호를 입력해주세요.
      </p>

      <form action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
        <div>
          <label htmlFor="reset-password" className={styles.label}>새 비밀번호</label>
          <PasswordInput
            id="reset-password"
            name="password"
            placeholder="8자 이상 입력하세요"
            autoComplete="new-password"
            value={f.password}
            onChange={set("password")}
          />
        </div>
        {errors.password && <p className={styles.error}>{errors.password}</p>}

        <div>
          <label htmlFor="reset-password-confirm" className={styles.label}>새 비밀번호 확인</label>
          <PasswordInput
            id="reset-password-confirm"
            name="passwordConfirm"
            placeholder="비밀번호를 다시 입력하세요"
            autoComplete="new-password"
            value={f.passwordConfirm}
            onChange={set("passwordConfirm")}
          />
        </div>
        {errors.passwordConfirm && (
          <p className={styles.error}>{errors.passwordConfirm}</p>
        )}

        {state.error && <p role="alert" className={styles.error}>{state.error}</p>}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>
    </>
  );
}
```

- [ ] **Step 3: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. `/reset-password`가 빌드 목록에 등장(ƒ Dynamic — 세션 확인 때문).

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add "src/app/(public)/reset-password/"
git commit -m "feat: 새 비밀번호 설정 페이지 추가(세션 가드)"
```

---

### Task 6: 로그인 화면의 forgot 링크 활성화

**Files:**
- Modify: `src/app/(public)/login/LoginForm.tsx`

- [ ] **Step 1: span → Link 교체**

현재 58행 근처:
```tsx
            <span className={styles.forgot} aria-disabled="true">비밀번호를 잊으셨나요?</span>
```
를 다음으로 교체(`Link`는 이미 import됨):
```tsx
            <Link href="/forgot-password" className={styles.forgot}>비밀번호를 잊으셨나요?</Link>
```

- [ ] **Step 2: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add "src/app/(public)/login/LoginForm.tsx"
git commit -m "feat: 로그인 화면의 비밀번호 재설정 링크 활성화"
```

---

### Task 7: 로컬 e2e 통합 검증

**Files:** (없음 — 컨트롤러 실행. Docker/colima + Supabase CLI 필요)

- [ ] **Step 1: 설정 반영**

```bash
npx supabase stop && npx supabase start   # config.toml recovery 템플릿 반영
```

- [ ] **Step 2: 백엔드 e2e (스크립트)**

저장소 루트에 임시 스크립트(`_reset-e2e.mjs`, 실행 후 삭제)로:
1. seed 계정(`member@seogyeong.kr`)에 `resetPasswordForEmail` 호출.
2. Mailpit API(`http://127.0.0.1:54324/api/v1/messages`)에서 복구 메일 수신 + 링크가 `/auth/confirm?token_hash=…&type=recovery&next=/reset-password` 형식인지 확인.
3. `verifyOtp({ type: "recovery", token_hash })` → 세션 생성 확인.
4. 그 세션 클라이언트로 `updateUser({ password: 새값 })` → 성공 확인.
5. 새 비밀번호로 `signInWithPassword` 성공, **옛 비밀번호 실패** 확인.
6. (정리) 비밀번호를 원래 값(`member1234`)으로 복원.

- [ ] **Step 3: UI 흐름 확인 (Claude Preview)**

1. `/login` → "비밀번호를 잊으셨나요?" 링크가 `/forgot-password`로 이동.
2. `/forgot-password` 렌더(AuthLayout 디자인) 확인.
3. 세션 없이 `/reset-password` 직접 접근 → `/forgot-password`로 리다이렉트.

- [ ] **Step 4: 결과 보고**

흐름별 결과를 사용자에게 보고. 실패 항목은 해당 Task로 돌아가 수정.

---

## Self-Review (작성자 점검)

- **Spec 커버리지**: 스키마(1) · 액션 2개+origin 헬퍼(2) · recovery 템플릿/config(3) · 요청 페이지(4) · 설정 페이지+가드(5) · 로그인 링크(6) · e2e(7). 콜백·proxy는 스펙대로 무변경.
- **Placeholder 스캔**: 모든 코드 단계에 전문 수록. e2e 스크립트는 단계 명세(이전 회원가입 e2e와 동일 패턴, 컨트롤러 작성).
- **타입 일관성**: `ResetRequestState{error,sent}`·`UpdatePasswordState{error}`(Task 2 정의 → 4·5 사용), `resetRequestSchema`·`newPasswordSchema`(Task 1 → 2·4·5), `requestOrigin()`(Task 2 내부), `PasswordInput` props(id·name·placeholder·autoComplete·value·onChange — 기존 정의와 일치).
- **의존성 순서**: 1 → 2 → (3 병행 가능) → 4·5 → 6 → 7.
