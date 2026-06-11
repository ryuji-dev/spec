# 이메일 없는 인증 운영 전환 (설계)

> 작성일 2026-06-11 · 선행: 회원가입 기능(2026-06-09)·비밀번호 재설정(2026-06-10) — 둘 다 merged
> 범위: 인증 흐름에서 **이메일 발송 의존을 제거**한다. 이메일 주소는 로그인 ID로만 유지.

## 배경 / 정책 결정

- 사이트 도메인은 **vercel.app 유지**(`https://spec-webzin.vercel.app`). 자체 도메인을 사지 않으므로 Resend 등 커스텀 SMTP 인증이 불가하고, 내장 메일은 시간당 ~2통 제한이라 운영에 부적합.
- 결정: **이메일 인증 OFF + 비밀번호 분실은 관리자(고객센터) 경유**. 본인 확인 수단 없는 셀프 재설정은 계정 탈취 통로가 되므로 제공하지 않는다.
- 수용한 트레이드오프: 인증 메일이 없으므로 오타·타인 이메일로도 가입 가능. 노회 공동체 규모(관리자가 명부로 식별 가능)에서 수용.
- 도메인을 구입하면 git 히스토리의 이메일 인증·재설정 코드(2026-06-09·06-10 커밋)를 복원해 되돌릴 수 있다.

## 현재 상태 (확인됨)

- 운영 Auth: `enable_signup=true`, `enable_confirmations=true`(직전 config push), 한국어 메일 템플릿 2종 등록. SMTP는 미인증 도메인(`example.or.kr`)으로 잘못 설정돼 있어 **사용자가 대시보드에서 Custom SMTP OFF 예정**(메일이 전혀 안 나가는 상태였음).
- 코드: `signup`(확인 메일 안내 sent 화면), `requestPasswordReset`·`updatePassword` 액션, `/forgot-password`·`/reset-password` 페이지, `/auth/confirm` Route Handler, 템플릿 2개.
- config.toml에 `[remotes.production]` override 존재(site_url=vercel.app, 미push 상태 — 브랜치 `chore/prod-site-url`).

## 변경 사항

### 1) 회원가입 — 즉시 가입·로그인
- config: 로컬 `[auth.email] enable_confirmations = true → false` 원복. (운영도 같은 값으로 push)
- `signup` 액션: `enable_confirmations=false`면 `signUp()`이 즉시 세션을 만들고 @supabase/ssr이 쿠키를 설정한다 → `{ sent: true }` 반환 대신 **`redirect("/main")`**. `emailRedirectTo` 옵션 제거. `SignupState`에서 `sent` 제거(error만).
- 중복 이메일: GoTrue가 명시 오류를 반환 → 메시지는 기존 일반 문구 유지("가입 처리 중 문제가…", enumeration 비노출 유지).
- SignupForm: sent 화면 분기 제거(성공 시 서버가 redirect).

### 2) 비밀번호 분실 — 관리자 경유
- **admin 페이지에 "회원 비밀번호 재설정" 폼 추가**: 이메일 + 새 비밀번호(8자+) 입력 → Server Action `adminResetPassword`:
  - 진입부 `requireAdmin()` 재확인(서버 권한 이중 체크).
  - service-role `auth.admin.listUsers()` 순회로 이메일 → user id 조회(소규모 전제; 회원 수 증가 시 RPC로 전환).
  - `auth.admin.updateUserById(id, { password })`. 대상 미존재 시 "해당 이메일의 계정이 없습니다."
  - 새 비밀번호 검증은 `newPasswordSchema` 재사용(password·passwordConfirm 일치).
- 관리자가 임시 비밀번호를 정해 회원에게 오프라인(전화·카톡) 전달.
- 로그인 화면: "비밀번호를 잊으셨나요?" 링크 → **비활성 안내 텍스트로 변경**("비밀번호를 잊으셨나요? 관리자에게 문의해주세요" 형태, 디자인 톤 유지). 추후 고객센터 페이지가 생기면 그 링크로 교체.

### 3) 비밀번호 변경 — 유지(용도 전환)
- `/reset-password`는 **로그인 사용자의 비밀번호 변경 페이지**로 유지(이미 세션 가드 + `updatePassword`가 세션 기반). 문구를 "새 비밀번호 설정" 그대로 사용. 임시 비밀번호로 로그인한 회원이 스스로 변경하는 경로. 미로그인 직접 접근 시 redirect 대상은 `/forgot-password`가 사라지므로 **`/login`으로 변경**.

### 4) 제거
- `/forgot-password` 페이지(2파일), `requestPasswordReset` 액션, `resetRequestSchema`(+타입).
- `/auth/confirm` Route Handler — 확인·복구 메일 전용이라 호출처가 없어짐.
- `supabase/templates/confirmation.html`·`recovery.html` + config.toml의 `[auth.email.template.*]` 2블록.
- `signup`의 `emailRedirectTo`. `requestOrigin()` 헬퍼는 사용처가 없어지면 함께 제거.

### 5) 운영 반영(config push — 사용자 승인 후)
- `enable_confirmations=false`, 템플릿 등록 해제, `[remotes.production]`의 site_url·additional_redirect_urls(위생 차원 유지).
- 사용자 선행 작업: 대시보드에서 Custom SMTP OFF.

## 유지되는 것
- `updatePassword` 액션·`newPasswordSchema`·`/reset-password`(용도 전환), `safeNext`·`readUserRole`, 로그인 역할별/next 리다이렉트, `signupSchema`(terms 포함) 및 클라 검증.

## 보안
- 권한: `adminResetPassword`는 `requireAdmin` + service-role(서버 전용). RLS·role 가드 변동 없음.
- 셀프 재설정 제거로 무인증 재설정 공격면 자체가 사라짐. 가입 enumeration 정책(일반 메시지) 유지.

## 검증
- 로컬: config 원복 후 `supabase stop/start` → (1) 가입 즉시 로그인·`/main` 도착, `profiles` member 생성 (2) admin 페이지에서 member 비밀번호 재설정 → 새 비밀번호 로그인 성공·옛 비밀번호 거부 (3) `/reset-password` 로그인 상태 변경 동작, 미로그인 → `/login` (4) `/forgot-password`·`/auth/confirm` 404.
- `pnpm lint`/`pnpm build`. 운영 push 후 vercel.app에서 가입 스모크.

## 범위 밖 (후속)
- **고객센터(문의) 페이지** — 생기면 로그인 안내 문구를 링크로 교체. TODO.md 후보.
- 도메인 구입 시 이메일 인증·셀프 재설정 복원(git 히스토리).
- Google OAuth, 이용약관·개인정보 페이지.
