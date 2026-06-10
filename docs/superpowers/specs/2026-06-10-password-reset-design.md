# 비밀번호 재설정 기능 (설계)

> 작성일 2026-06-10 · 선행: 2026-06-09 회원가입 기능 연결(merged)
> 범위: 로그인 화면의 "비밀번호를 잊으셨나요?"를 실제 동작시키는 **비밀번호 재설정 전체 흐름**. 회원가입에서 깔아둔 이메일 인프라(`/auth/confirm` 콜백·메일 템플릿·AuthLayout)를 재사용한다.

## 정책 결정

- 흐름: 이메일 입력 → 복구 메일 발송 → 메일 링크(`type=recovery`)로 본인 검증 → 새 비밀번호 설정.
- 재설정 완료 후: **로그인 상태 유지한 채 `/main` 이동**(복구 링크가 이미 세션을 생성하므로 가장 매끄러움).
- 로그인 중 사용자의 "계정 설정에서 비밀번호 변경"은 범위 밖(별도 기능).

## 현재 상태 (확인됨)

- `/auth/confirm` Route Handler: `token_hash`·`type`을 받아 `verifyOtp({ type, token_hash })` 후 `safeNext(next)`로 redirect. **type을 그대로 넘기므로 `recovery`도 코드 수정 없이 동작.**
- `LoginForm.tsx`: "비밀번호를 잊으셨나요?"가 비활성 `<span className={styles.forgot}>`(링크 아님).
- `supabase/config.toml`: `enable_confirmations=true`, `[auth.email.template.confirmation]` 등록됨. recovery 템플릿은 미등록(기본 템플릿).
- `src/lib/dto/auth.ts`: `loginSchema`·`signupSchema`. 재설정용 스키마 없음.
- 디자인: `AuthLayout` + `auth.module.css`(label·input·submit·error·footer 클래스)로 새 화면 2개를 추가 디자인 자산 없이 구성 가능.
- `getCurrentUser()`(server-only)로 세션 확인 가능. `proxy.ts`는 `/admin`·`/board`만 가드 → 새 페이지 2개는 공개 라우트(변경 불필요).

## 접근 방식

**2개 페이지 분리** — `/forgot-password`(요청)와 `/reset-password`(새 비밀번호 설정). 각 페이지가 단일 책임. 기각: 단일 페이지 + 쿼리 단계 전환(상태 복잡, URL 의미 불명확).

## 파일 구조

```
src/lib/dto/auth.ts                          # Modify: resetRequestSchema, newPasswordSchema 추가
src/server/actions/auth.ts                   # Modify: requestPasswordReset, updatePassword 추가
src/app/(public)/forgot-password/
  page.tsx                                   # Create: AuthLayout + ForgotPasswordForm
  ForgotPasswordForm.tsx                     # Create: 'use client', 이메일 입력 → 요청
src/app/(public)/reset-password/
  page.tsx                                   # Create: 세션 확인(없으면 /forgot-password로) + ResetPasswordForm
  ResetPasswordForm.tsx                      # Create: 'use client', 새 비밀번호·확인 → 변경
src/app/(public)/login/LoginForm.tsx         # Modify: forgot span → /forgot-password Link
supabase/templates/recovery.html             # Create: 복구 메일(token_hash·type=recovery)
supabase/config.toml                         # Modify: [auth.email.template.recovery] 등록
```

## 구성 요소

### 1) zod 스키마 — `src/lib/dto/auth.ts`
- `resetRequestSchema`: `{ email: z.email("이메일 형식을 확인해주세요.") }`.
- `newPasswordSchema`: `{ password: min 8 + 메시지, passwordConfirm }` + 일치 `.refine`(path: passwordConfirm). `signupSchema`와 메시지 일관.

### 2) 요청 액션 — `requestPasswordReset` (auth.ts)
- `resetRequestSchema` 검증 → `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/auth/confirm })`.
- `origin` 구성은 `signup`과 동일(NEXT_PUBLIC_SITE_URL ?? 요청 헤더).
- **결과는 항상 동일**: 성공이든 미존재 계정이든 `{ sent: true }`(이메일 enumeration 방지). 명시적 오류(rate limit 등)만 일반 메시지.
- 상태 타입: `ResetRequestState { error?: string; sent?: boolean }`.

### 3) 복구 메일 템플릿 — `supabase/templates/recovery.html` + config
- 링크: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
- `config.toml`에 `[auth.email.template.recovery]` 블록(subject 한국어, content_path는 confirmation과 동일 기준 경로).

### 4) 확인 콜백 — 변경 없음
- `/auth/confirm`이 `type=recovery`·`next=/reset-password`를 그대로 처리(verifyOtp → 세션 생성 → `/reset-password` redirect). `safeNext`가 내부 경로 보장.

### 5) 새 비밀번호 설정 — `/reset-password`
- `page.tsx`(Server Component): `getCurrentUser()`로 세션 확인 → **없으면 `redirect("/forgot-password")`**(복구 링크 없이 직접 접근 차단).
- `ResetPasswordForm`(client): `PasswordInput` 2개(새 비밀번호·확인) + `newPasswordSchema` 클라 즉시 검증 + `useActionState(updatePassword)`.
- `updatePassword` 액션: `newPasswordSchema` 서버 재검증 → 진입부에서 세션 재확인(미인증이면 오류 반환) → `supabase.auth.updateUser({ password })` → 성공 시 `redirect("/main")`(로그인 유지).
- 상태 타입: `UpdatePasswordState { error?: string }`.
- "같은 비밀번호로 변경" 등 GoTrue 오류는 일반 메시지("비밀번호 변경에 실패했습니다. 다른 비밀번호로 시도해주세요.")로 처리.

### 6) 로그인 화면 연결 — `LoginForm.tsx`
- `<span className={styles.forgot}>비밀번호를 잊으셨나요?</span>` → `<Link href="/forgot-password" className={styles.forgot}>…</Link>`. 디자인 클래스 그대로(시각 변화 없음).

## 화면 (디자인 재사용)

- 두 페이지 모두 `AuthLayout`(좌측 히어로) + `BrandLockup` + 기존 폼 클래스. Google 버튼·구분선은 **없음**(재설정 화면에 불필요).
- `/forgot-password`: 안내 문구("가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다") + 이메일 입력 + `재설정 링크 보내기`(submit) + 푸터 "로그인으로 돌아가기".
- 발송 후(`sent`): 폼 대신 "재설정 메일을 보냈습니다. 메일의 링크를 눌러 진행해주세요." + 푸터 로그인 링크 (SignupForm의 sent 화면과 동일 패턴).
- `/reset-password`: 새 비밀번호·확인(`PasswordInput`, label htmlFor 연결) + `비밀번호 변경`(submit).

## 보안

- 계정 존재 노출 방지: 요청 결과 항상 `{ sent: true }`.
- `/reset-password`는 세션 필수(page 가드 + 액션 진입부 재확인 — 권한 체크는 서버에서 이중으로).
- 복구 토큰 검증·비밀번호 해시는 GoTrue 담당. 토큰은 1회용·만료(otp_expiry 3600s).
- 오픈 리다이렉트: 기존 `safeNext` 경로를 그대로 사용(신규 위험면 없음).

## 검증 (lint/build + 로컬 e2e)

1. `/login`에서 "비밀번호를 잊으셨나요?" → `/forgot-password` 이동.
2. 가입된 이메일 제출 → "메일을 보냈습니다" + Mailpit에 복구 메일(`type=recovery&next=/reset-password`) 도착. 미가입 이메일도 동일 화면(enumeration 방지).
3. 메일 링크 → `/auth/confirm` → 세션 생성 → `/reset-password` 진입.
4. 새 비밀번호 설정 → `/main` 이동(로그인 유지) → 로그아웃 후 **새 비밀번호로 로그인 성공**, 옛 비밀번호 실패.
5. 세션 없이 `/reset-password` 직접 접근 → `/forgot-password`로 리다이렉트.
6. `pnpm lint` / `pnpm build` 통과.

## 범위 밖 (후속)
- 로그인 상태 사용자의 비밀번호 변경(계정 설정).
- Google OAuth, 이용약관·개인정보 페이지.
- 운영 SMTP 등록(배포 런북).
