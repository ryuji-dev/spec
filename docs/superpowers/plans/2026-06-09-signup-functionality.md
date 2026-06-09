# 회원가입 기능 연결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **커밋 정책(중요):** 이 저장소는 "사용자가 명시 요청할 때만 커밋/PR" 원칙. 각 Task의 커밋 단계는 **사용자 승인 후** 실행한다.

**Goal:** 셀프 회원가입을 실제로 동작시킨다 — `signUp()` Server Action + 이메일 인증(token_hash 콜백) + 로그인 후 역할별/next 리다이렉트 수정.

**Architecture:** 회원가입은 `src/server/actions/auth.ts`의 `signup` Server Action에서 `supabase.auth.signUp()`로 처리(트리거가 member 프로필 생성). 이메일 확인은 Supabase 공식 SSR 패턴(token_hash + `/auth/confirm` Route Handler `verifyOtp`). 로그인 리다이렉트는 내부경로 화이트리스트 유틸을 공유해 오픈 리다이렉트를 막는다.

**Tech Stack:** Next.js 16 App Router, TS strict, @supabase/ssr, zod 4, Supabase Auth. 로컬 검증은 Supabase CLI 스택(내장 메일함 Inbucket).

---

## 검증 방식 (테스트 러너 없음)

- 코드 Task: `pnpm lint` + `pnpm build` (TS strict 포함).
- 통합 Task(마지막): 로컬 Supabase 스택(`colima start && npx supabase start`) + 내장 메일함(http://127.0.0.1:54324)으로 e2e. 이 단계는 컨트롤러/사용자가 실행한다(서브에이전트 환경에서 Docker 미가용 가능).

## 파일 구조

```
src/lib/
  safe-redirect.ts                         # Create: 내부경로 화이트리스트 safeNext()
src/server/actions/
  auth.ts                                  # Modify: signup 추가 + login 리다이렉트 수정
src/app/auth/confirm/
  route.ts                                 # Create: 이메일 확인 콜백(GET, verifyOtp)
src/app/(public)/login/
  page.tsx                                 # Modify: searchParams next·error → LoginForm
  LoginForm.tsx                            # Modify: next hidden input + error 표시
src/app/(public)/signup/
  SignupForm.tsx                           # Modify: 스텁 → useActionState(signup)
supabase/
  config.toml                              # Modify: enable_confirmations=true + 템플릿 등록
  templates/confirmation.html              # Create: token_hash 확인 메일 템플릿
```

---

### Task 1: 내부경로 리다이렉트 유틸 (`src/lib/safe-redirect.ts`)

**Files:**
- Create: `src/lib/safe-redirect.ts`

- [ ] **Step 1: 유틸 작성**

`src/lib/safe-redirect.ts`:
```typescript
// 오픈 리다이렉트 방지 — 내부 절대경로('/'로 시작)만 허용한다.
// 프로토콜-상대 URL('//evil.com')·역슬래시 변형('/\evil')은 외부로 빠질 수 있어 차단.
export function safeNext(
  next: string | null | undefined,
  fallback = "/main",
): string {
  if (!next || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
```

- [ ] **Step 2: 린트/타입 검증**

Run: `pnpm lint`
Expected: 통과 (이 파일은 순수 함수, 의존 없음)

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add src/lib/safe-redirect.ts
git commit -m "feat: 내부경로 리다이렉트 검증 유틸 추가(오픈 리다이렉트 방지)"
```

---

### Task 2: 회원가입 Server Action (`signup`)

**Files:**
- Modify: `src/server/actions/auth.ts`

- [ ] **Step 1: `signup` 액션과 `SignupState` 추가**

`src/server/actions/auth.ts`에 import와 함수를 추가한다. 파일 상단 import 블록에 다음을 추가:
```typescript
import { headers } from "next/headers";
import { loginSchema, signupSchema } from "@/lib/dto/auth";
```
(기존 `import { loginSchema } from "@/lib/dto/auth";` 줄은 위 줄로 교체해 `signupSchema`도 가져온다.)

파일 끝(`logout` 아래)에 추가:
```typescript
export interface SignupState {
  error?: string;
  sent?: boolean;
}

// 셀프 회원가입 — supabase.auth.signUp() 호출. 트리거(handle_new_user)가 member 프로필 생성.
// 이메일 인증(enable_confirmations) 켜져 있어 가입 직후 세션 없음 → 확인 메일 안내.
export async function signup(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    church: formData.get("church"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    terms: formData.get("terms") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { name, church, email, password } = parsed.data;

  // 확인 메일 콜백의 절대 origin 구성 — 운영은 NEXT_PUBLIC_SITE_URL, 없으면 요청 헤더.
  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, church },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  // 명시적 실패(rate limit 등)는 일반 메시지. 계정 존재 여부는 노출하지 않는다.
  if (error) {
    return { error: "가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  return { sent: true };
}
```

- [ ] **Step 2: 린트/빌드 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add src/server/actions/auth.ts
git commit -m "feat: 회원가입 Server Action 추가(signUp + 확인 메일)"
```

---

### Task 3: 이메일 확인 콜백 Route Handler (`/auth/confirm`)

**Files:**
- Create: `src/app/auth/confirm/route.ts`

- [ ] **Step 1: Route Handler 작성**

`src/app/auth/confirm/route.ts`:
```typescript
// 이메일 확인 콜백 — 확인 메일의 token_hash 링크가 여기로 온다. verifyOtp로 세션 생성 후 next로 이동.
// (콜백 전용이라 응답은 redirect — 일반 Route Handler JSON 스키마 비적용.)
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/server/supabase/server";
import { safeNext } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const failUrl = new URL("/login", request.url);
  failUrl.searchParams.set("error", "확인 링크가 만료되었거나 유효하지 않습니다.");
  return NextResponse.redirect(failUrl);
}
```

- [ ] **Step 2: 린트/빌드 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과 (`/auth/confirm` 라우트가 빌드 출력에 등장)

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add src/app/auth/confirm/route.ts
git commit -m "feat: 이메일 확인 콜백 Route Handler 추가(verifyOtp)"
```

---

### Task 4: Supabase 설정 — 이메일 인증 활성화 + 확인 메일 템플릿

**Files:**
- Create: `supabase/templates/confirmation.html`
- Modify: `supabase/config.toml`

- [ ] **Step 1: 확인 메일 템플릿 작성**

`supabase/templates/confirmation.html`:
```html
<h2>서경노회 교육위원회 — 이메일 인증</h2>
<p>아래 버튼을 눌러 회원가입을 완료해주세요. 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/main">가입 완료하기</a>
</p>
```

- [ ] **Step 2: config.toml 수정**

`supabase/config.toml`의 `[auth.email]` 블록에서 `enable_confirmations = false` → `true`로 변경:
```toml
enable_confirmations = true
```

그리고 `# Uncomment to customize email template` 주석 근처(또는 `[auth.email]` 섹션 바로 뒤)에 확인 메일 템플릿 등록 블록을 추가:
```toml
[auth.email.template.confirmation]
subject = "[서경노회 교육위원회] 이메일 인증"
content_path = "./supabase/templates/confirmation.html"
```

> 주의: `content_path`는 Supabase CLI 버전에 따라 프로젝트 루트 또는 `supabase/` 기준일 수 있다. Task 7 e2e에서 `supabase start` 후 메일 링크가 `/auth/confirm?token_hash=...`로 오는지 확인하고, 안 맞으면 `"./templates/confirmation.html"`로 조정한다.

- [ ] **Step 3: 설정 파싱 검증**

Run: `npx supabase start 2>&1 | tail -5 || echo "도커 미가용 — Task 7에서 검증"`
Expected: 스택 기동 성공(또는 도커 미가용 시 Task 7로 미룸). 설정 파싱 오류는 없어야 함.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add supabase/config.toml supabase/templates/confirmation.html
git commit -m "feat: 이메일 인증 활성화 + 확인 메일 템플릿(token_hash)"
```

---

### Task 5: 로그인 리다이렉트 수정 (역할별 + next)

**Files:**
- Modify: `src/server/actions/auth.ts` (`login`)
- Modify: `src/app/(public)/login/page.tsx`
- Modify: `src/app/(public)/login/LoginForm.tsx`

- [ ] **Step 1: `login` 액션 리다이렉트 로직 교체**

`src/server/actions/auth.ts` 상단 import에 추가:
```typescript
import { getCurrentUser } from "@/server/auth/current-user";
import { safeNext } from "@/lib/safe-redirect";
```

`login` 함수의 마지막 `redirect("/admin");`을 다음으로 교체:
```typescript
  // 리다이렉트: 유효한 내부 next 우선, 없으면 역할별 기본(admin→/admin, member→/main).
  const nextRaw = formData.get("next");
  const requested = typeof nextRaw === "string" ? safeNext(nextRaw, "") : "";
  const user = await getCurrentUser();
  const fallback = user?.role === "admin" ? "/admin" : "/main";
  redirect(requested || fallback);
```

- [ ] **Step 2: login 페이지에서 searchParams 전달**

`src/app/(public)/login/page.tsx` 전체를 교체:
```tsx
import type { Metadata } from "next";
import AuthLayout from "../_components/auth/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AuthLayout>
      <LoginForm next={sp.next} notice={sp.error} />
    </AuthLayout>
  );
}
```

- [ ] **Step 3: LoginForm에 next hidden input + notice 표시**

`src/app/(public)/login/LoginForm.tsx`에서:
1. 컴포넌트 시그니처를 props 받도록 변경:
   ```tsx
   export default function LoginForm({
     next,
     notice,
   }: {
     next?: string;
     notice?: string;
   }) {
   ```
2. `<form action={formAction} className={styles.form}>` 바로 다음 줄에 hidden input과 안내를 추가:
   ```tsx
   <form action={formAction} className={styles.form}>
     {next ? <input type="hidden" name="next" value={next} /> : null}
     {notice ? <p role="alert" className={styles.error}>{notice}</p> : null}
   ```
   (이메일/비밀번호 필드 등 나머지는 그대로 둔다.)

- [ ] **Step 4: 린트/빌드 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add src/server/actions/auth.ts "src/app/(public)/login/page.tsx" "src/app/(public)/login/LoginForm.tsx"
git commit -m "fix: 로그인 후 역할별/next 리다이렉트(무조건 /admin 버그 수정)"
```

---

### Task 6: SignupForm — 스텁 → Server Action 연결

**Files:**
- Modify: `src/app/(public)/signup/SignupForm.tsx`

- [ ] **Step 1: SignupForm 전체 교체**

`src/app/(public)/signup/SignupForm.tsx` 전체를 다음으로 교체(클라이언트 zod 검증으로 즉시 피드백 유지 + 통과 시 Server Action 제출):
```tsx
"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signup, type SignupState } from "@/server/actions/auth";
import { signupSchema } from "@/lib/dto/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import PasswordInput from "../_components/auth/PasswordInput";
import GoogleMark from "../_components/auth/GoogleMark";
import styles from "../_components/auth/auth.module.css";

type Errors = Partial<
  Record<"name" | "email" | "password" | "passwordConfirm" | "terms", string>
>;

const initialState: SignupState = {};

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [f, setF] = useState({
    name: "",
    church: "",
    email: "",
    password: "",
    passwordConfirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const set =
    (k: keyof typeof f) =>
    (v: string | boolean) =>
      setF((p) => ({ ...p, [k]: v }));

  // 클라이언트 즉시 검증 — 실패 시 제출 막고 필드 오류 표시, 통과 시 Server Action 진행.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = signupSchema.safeParse(f);
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

  if (state.sent) {
    return (
      <>
        <div className={styles.brandRow}>
          <BrandLockup />
        </div>
        <p className={styles.label} style={{ textAlign: "center", lineHeight: 1.6 }}>
          입력하신 이메일로 인증 메일을 보냈습니다.
          <br />
          메일의 링크를 눌러 회원가입을 완료해주세요.
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

      <button type="button" className={styles.oauth} disabled aria-disabled="true">
        <GoogleMark /> Google로 계속하기
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>또는</span>
        <span className={styles.dividerLine} />
      </div>

      <form action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
        <div className={styles.twoCol}>
          <label className={styles.field}>
            <span className={styles.label}>성함</span>
            <span className={styles.inputWrap}>
              <input
                name="name"
                className={styles.input}
                placeholder="홍길동"
                autoComplete="name"
                value={f.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </span>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>소속 교회</span>
            <span className={styles.inputWrap}>
              <input
                name="church"
                className={styles.input}
                placeholder="서경중앙교회"
                autoComplete="organization"
                value={f.church}
                onChange={(e) => set("church")(e.target.value)}
              />
            </span>
          </label>
        </div>
        {errors.name && <p className={styles.error}>{errors.name}</p>}

        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <span className={styles.inputWrap}>
            <input
              name="email"
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={f.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </span>
        </label>
        {errors.email && <p className={styles.error}>{errors.email}</p>}

        <div>
          <label htmlFor="signup-password" className={styles.label}>비밀번호</label>
          <PasswordInput
            id="signup-password"
            name="password"
            placeholder="8자 이상 입력하세요"
            autoComplete="new-password"
            value={f.password}
            onChange={set("password")}
          />
        </div>
        {errors.password && <p className={styles.error}>{errors.password}</p>}

        <div>
          <label htmlFor="signup-password-confirm" className={styles.label}>비밀번호 확인</label>
          <PasswordInput
            id="signup-password-confirm"
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

        <label className={styles.terms}>
          <input
            type="checkbox"
            name="terms"
            checked={f.terms}
            onChange={(e) => set("terms")(e.target.checked)}
          />
          <span>
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>이용약관</a> 및{" "}
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>개인정보 처리방침</a>에 동의합니다.
          </span>
        </label>
        {errors.terms && <p className={styles.error}>{errors.terms}</p>}

        {state.error && <p role="alert" className={styles.error}>{state.error}</p>}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "처리 중…" : "가입하기"}
        </button>
      </form>

      <div className={styles.footer}>
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className={styles.footerLink}>로그인</Link>
      </div>
    </>
  );
}
```

> 핵심 변경: 모든 입력에 `name` 부여(FormData 수집), `onSubmit` 클라 검증 후 통과 시 `formAction` 제출, `state.sent` 시 "확인 메일" 화면, `state.error` 표시, 제출 중 버튼 비활성. `PasswordInput`의 `id` prop은 이전 a11y 수정에서 추가됨.

- [ ] **Step 2: 린트/빌드 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add "src/app/(public)/signup/SignupForm.tsx"
git commit -m "feat: 회원가입 폼을 signup Server Action에 연결(확인 메일 안내)"
```

---

### Task 7: 로컬 e2e 통합 검증

**Files:** (없음 — 로컬 스택 검증)

> 이 Task는 컨트롤러/사용자가 실행한다(Docker/colima + Supabase CLI 필요).

- [ ] **Step 1: 로컬 스택 기동 + 적용**

```bash
colima start            # 미기동 시
npx supabase start
npx supabase db reset    # 마이그레이션·시드 재적용(트리거 포함)
pnpm dev
```

- [ ] **Step 2: 회원가입 → 확인 메일 흐름**

1. `http://localhost:3000/signup`에서 성함·이메일·비밀번호(8자+)·약관 체크 후 제출.
2. 화면이 "인증 메일을 보냈습니다"로 전환되는지 확인.
3. 내장 메일함 `http://127.0.0.1:54324`에서 확인 메일 수신 + 링크가 `/auth/confirm?token_hash=...&type=email&next=/main` 형태인지 확인.
   - 링크 형태가 다르면 Task 4의 `content_path`를 조정(루트↔supabase 기준) 후 재기동.

- [ ] **Step 3: 확인 → 세션 → 프로필**

1. 메일 링크 클릭 → `/main`으로 이동(세션 생성).
2. `npx supabase` SQL 또는 Studio(`http://127.0.0.1:54323`)에서 `select id, name, church, role from public.profiles` → 새 사용자가 `role=member`, name·church 반영 확인.

- [ ] **Step 4: 로그인 리다이렉트**

1. 로그아웃 후 그 계정으로 `/login` 로그인 → `/main` 이동(member 기본).
2. 시드 admin으로 로그인 → `/admin` 이동.
3. 비로그인으로 `/board` 접근 → `/login?next=/board`로 튕긴 뒤 로그인 → `/board`로 복귀.
4. `/login?next=//evil.com` 로그인 → 외부로 안 나가고 역할 기본으로 이동(오픈 리다이렉트 차단).

- [ ] **Step 5: 결과 보고**

위 5개 흐름 결과를 사용자에게 보고. 실패 항목은 해당 Task로 돌아가 수정.

---

## Self-Review (작성자 점검)

- **Spec 커버리지**: signup 액션(Task 2) · 확인 콜백(Task 3) · config/템플릿(Task 4) · 로그인 리다이렉트(Task 5) · SignupForm 연결(Task 6) · 오픈리다이렉트 유틸(Task 1) · e2e(Task 7) — spec의 6개 구성요소 + 검증 모두 매핑.
- **범위 밖 준수**: 비밀번호 재설정·Google OAuth·약관 페이지 미포함(스텁/placeholder 유지).
- **타입 일관성**: `SignupState{error,sent}`(Task 2 정의 → Task 6 사용), `signupSchema`(기존, terms는 boolean → Task 6에서 `f.terms`, Task 2에서 `formData.get("terms")==="on"`), `safeNext(next, fallback)`(Task 1 정의 → Task 3·5 사용), `PasswordInput` `id`·`name` prop(기존 + Task 6 사용), `getCurrentUser().role`(기존 current-user.ts).
- **의존성 순서**: Task 1(safeNext) → Task 3·5에서 사용. Task 2(SignupState) → Task 6에서 사용. 순서대로 실행.
- **알려진 불확실성(Task 4)**: `content_path` 기준 경로와 확인 메일 `type` 값(`email`)은 Supabase CLI 버전 의존 → Task 7 e2e에서 실측·조정하도록 명시.
