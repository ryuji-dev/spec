# 이메일 없는 인증 운영 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **커밋 정책(중요):** 커밋·운영 반영(config push)은 **사용자 승인 후**에만 실행한다.

**Goal:** 인증 흐름에서 이메일 발송 의존을 제거한다 — 즉시 가입·로그인, 비밀번호 분실은 admin 페이지의 재설정 폼(관리자 경유), `/reset-password`는 로그인 사용자의 비밀번호 변경 페이지로 전환.

**Architecture:** config에서 `enable_confirmations`를 끄고 메일 템플릿을 제거한다. `signup`은 즉시 세션 생성 → `/main` redirect. 셀프 재설정 경로(`/forgot-password`·`/auth/confirm`·`requestPasswordReset`)는 삭제하고, admin 액션(`adminResetPassword`, service-role + `requireAdmin`)으로 대체한다.

**Tech Stack:** Next.js 16 App Router, TS strict, @supabase/ssr, zod 4, Supabase CLI(config push, `[remotes.production]` override).

---

## 사전 상태 (중요)

- 현재 브랜치 `chore/prod-site-url`에 **미커밋 변경**: `supabase/config.toml`의 `[remotes.production]` 블록(site_url=vercel.app — 유지, 이 기능에 포함). 실행 시작 시 브랜치를 `feat/no-email-auth`로 **rename** (`git branch -m chore/prod-site-url feat/no-email-auth`).
- 운영(Supabase)은 `enable_confirmations=true` + 한국어 템플릿이 push된 상태. Task 6에서 되돌린다.
- 사용자 선행 작업: 대시보드에서 **Custom SMTP OFF** (미인증 도메인 설정이 들어가 있어 메일이 전혀 못 나가는 상태).

## 검증 방식 (테스트 러너 없음)

- 코드 Task: `pnpm lint && pnpm build`.
- Task 5(로컬 e2e)·Task 6(운영 반영)은 컨트롤러가 실행.

## 파일 구조

```
supabase/config.toml                          # Modify: enable_confirmations=false, 템플릿 블록 2개 제거
supabase/templates/                           # Delete: confirmation.html, recovery.html (디렉터리째)
src/lib/dto/auth.ts                           # Modify: resetRequestSchema 제거
src/server/actions/auth.ts                    # Modify: signup 즉시 로그인, requestPasswordReset·requestOrigin 제거, updatePassword 문구
src/server/actions/admin.ts                   # Modify: adminResetPassword 추가, 구정책 주석 갱신
src/app/(admin)/admin/AdminResetPasswordForm.tsx  # Create
src/app/(admin)/admin/page.tsx                # Modify: 재설정 섹션 추가, 구정책 문구 갱신
src/app/(public)/forgot-password/             # Delete (2파일)
src/app/auth/confirm/route.ts                 # Delete (auth/ 디렉터리째)
src/app/(public)/signup/SignupForm.tsx        # Modify: sent 분기 제거
src/app/(public)/login/LoginForm.tsx          # Modify: forgot Link → 안내 텍스트
src/app/(public)/reset-password/page.tsx      # Modify: 가드 redirect /login, 주석 갱신
```

---

### Task 1: config 정리 (이메일 인증 OFF + 템플릿 제거)

**Files:**
- Modify: `supabase/config.toml`
- Delete: `supabase/templates/confirmation.html`, `supabase/templates/recovery.html`

- [ ] **Step 1: enable_confirmations 원복**

`supabase/config.toml`의 `[auth.email]` 안 `enable_confirmations = true` → `false`. (다른 enable_confirmations — `[auth.sms]` — 는 건드리지 않는다.)

- [ ] **Step 2: 템플릿 등록 블록 2개 제거**

다음 두 블록을 통째로 삭제:
```toml
[auth.email.template.confirmation]
subject = "[서경노회 교육위원회] 이메일 인증"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "[서경노회 교육위원회] 비밀번호 재설정"
content_path = "./supabase/templates/recovery.html"
```

- [ ] **Step 3: 템플릿 파일 삭제**

```bash
rm supabase/templates/confirmation.html supabase/templates/recovery.html && rmdir supabase/templates
```

- [ ] **Step 4: `[remotes.production]` 블록 유지 확인**

파일 끝의 `[remotes.production]`·`[remotes.production.auth]`(site_url=vercel.app) 블록은 그대로 둔다.

- [ ] **Step 5: 검증** — Run: `pnpm lint` → 통과.

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add supabase/
git commit -m "feat: 이메일 인증 비활성화 + 메일 템플릿 제거(이메일 미사용 전환)"
```

---

### Task 2: auth 액션 정리 (즉시 가입 + 셀프 재설정 제거)

**Files:**
- Modify: `src/server/actions/auth.ts`
- Modify: `src/lib/dto/auth.ts`

- [ ] **Step 1: dto에서 resetRequestSchema 제거**

`src/lib/dto/auth.ts`에서 다음을 삭제 (`newPasswordSchema`는 유지 — updatePassword·adminResetPassword가 사용):
```typescript
export const resetRequestSchema = z.object({
  email: z.email("이메일 형식을 확인해주세요."),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
```

- [ ] **Step 2: auth.ts — import·헬퍼 정리**

먼저 파일을 읽는다. 그 다음:
- import에서 `resetRequestSchema` 제거: `import { loginSchema, newPasswordSchema, signupSchema } from "@/lib/dto/auth";`
- `import { headers } from "next/headers";` 제거 (requestOrigin 삭제로 미사용).
- `requestOrigin` 함수(주석 포함) 통째 삭제.

- [ ] **Step 3: signup을 즉시 로그인으로 수정**

`SignupState`에서 `sent` 제거:
```typescript
export interface SignupState {
  error?: string;
}
```
`signup` 함수 본문에서 origin·emailRedirectTo 제거, 성공 시 redirect. 함수 주석과 함께 교체:
```typescript
// 셀프 회원가입 — supabase.auth.signUp() 호출. 트리거(handle_new_user)가 member 프로필 생성.
// 이메일 인증 미사용(enable_confirmations=false) → 가입 즉시 세션이 생기므로 바로 /main 이동.
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

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, church } },
  });

  // 중복 이메일 등 실패는 일반 메시지(계정 존재 여부 비노출).
  if (error || !data.session) {
    return { error: "가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  redirect("/main");
}
```

- [ ] **Step 4: requestPasswordReset 통째 삭제**

`ResetRequestState` 인터페이스와 `requestPasswordReset` 함수(주석 포함)를 삭제.

- [ ] **Step 5: updatePassword 주석·문구 갱신 (용도 전환)**

함수 위 주석을:
```typescript
// 비밀번호 변경 — 로그인 사용자 본인이 새 비밀번호를 설정한다(페이지 가드 + 여기서 세션 재확인).
```
세션 없음 에러 문구를:
```typescript
    return { error: "세션이 만료되었습니다. 다시 로그인해주세요." };
```

- [ ] **Step 6: 검증** — Run: `pnpm lint && pnpm build` → **실패 예상** (forgot-password·confirm·SignupForm이 아직 옛 API 참조). Task 3·4 완료 후 통과 확인으로 대체. 이 시점엔 `npx tsc --noEmit 2>&1 | grep -v "forgot-password\|auth/confirm\|SignupForm"` 으로 본 파일 오류 없음만 확인.

- [ ] **Step 7: 커밋 (사용자 승인 후, Task 4와 함께 빌드 통과 후)**

```bash
git add src/server/actions/auth.ts src/lib/dto/auth.ts
git commit -m "feat: 회원가입 즉시 로그인 전환 + 셀프 비밀번호 재설정 제거"
```

---

### Task 3: admin 비밀번호 재설정 (액션 + 폼 + 페이지)

**Files:**
- Modify: `src/server/actions/admin.ts`
- Create: `src/app/(admin)/admin/AdminResetPasswordForm.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: admin.ts에 adminResetPassword 추가**

먼저 파일을 읽는다. 파일 상단 주석(2행)을 갱신:
```typescript
// 관리자 전용 계정 관리. 계정 발급과 비밀번호 재설정(이메일 미사용 정책 — 분실 시 관리자 경유).
```
import에 `newPasswordSchema` 추가:
```typescript
import { newPasswordSchema } from "@/lib/dto/auth";
```
파일 끝에 추가:
```typescript
export interface AdminResetPasswordState {
  error?: string;
  success?: string;
}

// 회원 비밀번호 재설정 — 이메일 발송 미사용 정책의 분실 대응. 관리자가 임시 비밀번호를
// 정해 오프라인(전화·카톡)으로 전달하고, 회원은 로그인 후 /reset-password에서 직접 변경한다.
export async function adminResetPassword(
  _prev: AdminResetPasswordState,
  formData: FormData,
): Promise<AdminResetPasswordState> {
  await requireAdmin();

  const emailParsed = z.email().safeParse(formData.get("email"));
  if (!emailParsed.success) {
    return { error: "이메일 형식을 확인해주세요." };
  }
  const pwParsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!pwParsed.success) {
    return { error: pwParsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const email = emailParsed.data.toLowerCase();
  const supabase = createSupabaseService();

  // 이메일 → user id 조회. listUsers 순회(노회 규모 전제, 회원 수 증가 시 RPC로 전환).
  let userId: string | undefined;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return { error: "사용자 조회에 실패했습니다." };
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) {
      userId = hit.id;
      break;
    }
    if (data.users.length < 100) break;
  }
  if (!userId) return { error: "해당 이메일의 계정이 없습니다." };

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: pwParsed.data.password,
  });
  if (error) return { error: "비밀번호 재설정에 실패했습니다." };

  return { success: `${email} 비밀번호를 재설정했습니다.` };
}
```
(admin.ts에 `z`·`requireAdmin`·`createSupabaseService` import가 이미 있는지 확인하고 없으면 추가 — 기존 `createUser`가 셋 다 사용하므로 있을 것.)

- [ ] **Step 2: AdminResetPasswordForm 작성 (CreateUserForm 패턴)**

`src/app/(admin)/admin/AdminResetPasswordForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import {
  adminResetPassword,
  type AdminResetPasswordState,
} from "@/server/actions/admin";

const initialState: AdminResetPasswordState = {};

const inputStyle = {
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 6,
} as const;

export default function AdminResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    adminResetPassword,
    initialState,
  );

  return (
    <form action={formAction} style={{ display: "grid", gap: 12 }}>
      <input
        name="email"
        type="email"
        required
        autoComplete="off"
        placeholder="회원 이메일"
        style={inputStyle}
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="임시 비밀번호 (8자 이상)"
        style={inputStyle}
      />
      <input
        name="passwordConfirm"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="임시 비밀번호 확인"
        style={inputStyle}
      />

      {state.error && (
        <p role="alert" style={{ color: "#c00", margin: 0 }}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" style={{ color: "#0a0", margin: 0 }}>
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{ padding: 10, borderRadius: 6 }}
      >
        {pending ? "재설정 중…" : "비밀번호 재설정"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: admin/page.tsx에 섹션 추가 + 구정책 문구 갱신**

먼저 파일을 읽는다. import 추가:
```tsx
import AdminResetPasswordForm from "./AdminResetPasswordForm";
```
"계정 생성" 섹션의 설명 문구를 (구정책 "일반 가입 경로는 없습니다" 갱신):
```tsx
        <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
          일반 회원은 셀프 가입이 가능합니다. 여기서는 직함이 필요한 회원·관리자 계정을 발급합니다.
        </p>
```
`</section>` 닫힌 뒤(main 닫히기 전)에 새 섹션 추가:
```tsx
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>회원 비밀번호 재설정</h2>
        <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
          비밀번호를 잊은 회원에게 임시 비밀번호를 발급합니다. 전달 후 회원이
          로그인하여 /reset-password에서 직접 변경하도록 안내해주세요.
        </p>
        <AdminResetPasswordForm />
      </section>
```

- [ ] **Step 4: 검증** — Run: `pnpm lint` → 통과 (build는 Task 4 후).

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add src/server/actions/admin.ts "src/app/(admin)/admin/"
git commit -m "feat: 관리자 비밀번호 재설정 폼 추가(이메일 미사용 분실 대응)"
```

---

### Task 4: 페이지 정리 (삭제·문구·가드)

**Files:**
- Delete: `src/app/(public)/forgot-password/` (page.tsx, ForgotPasswordForm.tsx)
- Delete: `src/app/auth/` (confirm/route.ts)
- Modify: `src/app/(public)/signup/SignupForm.tsx`
- Modify: `src/app/(public)/login/LoginForm.tsx`
- Modify: `src/app/(public)/reset-password/page.tsx`

- [ ] **Step 1: 디렉터리 삭제**

```bash
rm -r "src/app/(public)/forgot-password" src/app/auth
```

- [ ] **Step 2: SignupForm — sent 분기 제거**

먼저 파일을 읽는다. `if (state.sent) { return ( ... ); }` 블록(브랜드/안내/footer 포함) 통째 삭제. 나머지는 그대로 (성공 시 서버 액션이 `/main`으로 redirect하므로 추가 처리 불필요).

- [ ] **Step 3: LoginForm — forgot 링크 → 안내 텍스트**

```tsx
            <Link href="/forgot-password" className={styles.forgot}>비밀번호를 잊으셨나요?</Link>
```
를 다음으로 교체 (Link import는 footer의 회원가입 링크가 계속 사용하므로 유지):
```tsx
            <span className={styles.forgot} style={{ cursor: "default" }}>분실 시 관리자에게 문의</span>
```

- [ ] **Step 4: reset-password 가드·주석 갱신**

`src/app/(public)/reset-password/page.tsx`에서:
```tsx
// 복구 링크(verifyOtp)로 세션이 만들어진 상태에서만 진입. 직접 접근은 요청 페이지로 보낸다.
```
→
```tsx
// 로그인 사용자의 비밀번호 변경 페이지(임시 비밀번호 수령 후 본인 변경 경로). 미로그인은 로그인으로.
```
그리고 `if (!user) redirect("/forgot-password");` → `if (!user) redirect("/login");`

- [ ] **Step 5: 전체 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. 라우트 목록에 `/forgot-password`·`/auth/confirm` 없음, `/reset-password`·`/signup`·`/login`·`/admin` 존재.

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add -A "src/app/(public)/" src/app/auth 2>/dev/null; git add -A src/app
git commit -m "feat: 이메일 재설정 페이지·확인 콜백 제거 + 로그인 안내 전환"
```

---

### Task 5: 로컬 e2e (컨트롤러 실행)

- [ ] **Step 1:** `npx supabase stop && npx supabase start` (config 반영: confirmations OFF)
- [ ] **Step 2:** 가입 e2e — `/signup` 제출(또는 스크립트로 `signUp`) → **세션 즉시 생성**(`data.session !== null`) → `profiles`에 member 생성 확인. UI로는 가입 → `/main` 도착.
- [ ] **Step 3:** admin 재설정 e2e — admin으로 `adminResetPassword` 경로(또는 스크립트로 `auth.admin.updateUserById`) → 대상 회원 새 비밀번호 로그인 성공·옛 비밀번호 거부 → 원복.
- [ ] **Step 4:** `/reset-password` — 로그인 상태에서 변경 동작, 미로그인 직접 접근 → `/login` 리다이렉트.
- [ ] **Step 5:** `/forgot-password`·`/auth/confirm` → 404 확인.

### Task 6: 운영 반영 (사용자 승인 게이트)

- [ ] **Step 1:** 사용자 선행 확인 — 대시보드 Custom SMTP OFF 됐는지.
- [ ] **Step 2:** diff 미리보기 — `printf 'n\nn\n' | npx supabase config push --project-ref kznzcxegbeuwiwjczpmp`. 예상 diff: `enable_confirmations true→false`, 템플릿 subject/content 기본값 원복, site_url·additional_redirect_urls → vercel.app(remotes override).
- [ ] **Step 3:** **사용자 승인 후** auth만 push(`y` / storage `n`) → 재실행으로 "Auth config is up to date" 확인.
- [ ] **Step 4:** 운영 스모크 — `https://spec-webzin.vercel.app/signup`에서 테스트 가입 → 즉시 로그인·`/main` 도착 확인(코드 배포는 main 머지·push 후 Vercel 자동 배포 완료를 기다린 뒤).

---

## Self-Review (작성자 점검)

- **Spec 커버리지**: 즉시 가입(T2) · admin 재설정(T3) · 로그인 안내(T4) · `/reset-password` 전환(T2 문구+T4 가드) · 제거 목록(T1·T2·T4) · 운영 반영(T6) · 검증(T5) — spec §1~5 전부 매핑.
- **타입 일관성**: `SignupState{error}`(T2→SignupForm은 sent 미참조로 정리됨), `AdminResetPasswordState{error,success}`(T3 정의·사용), `newPasswordSchema` 유지(T2 dto에서 resetRequestSchema만 제거), admin.ts의 `z`·`requireAdmin`·`createSupabaseService`는 기존 import 확인 절차 포함.
- **순서 의존**: T2 직후엔 빌드가 깨질 수 있음(삭제 대상이 옛 API 참조) → T2 Step 6에 명시, T4 Step 5에서 전체 통과 확인. 실행자는 T1→T2→T3→T4 순서 준수.
- **운영 안전**: config push는 diff 미리보기 → 사용자 승인 → auth만 적용(storage 제외) 절차 고정.
