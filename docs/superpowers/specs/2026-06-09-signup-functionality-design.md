# 회원가입 기능 연결 (설계)

> 작성일 2026-06-09 · 선행: 2026-06-09 인증 페이지 디자인 이식(merged)
> 범위: 셀프 회원가입의 **백엔드 기능 연결**(Server Action + 이메일 인증 + 로그인 리다이렉트 수정). 디자인은 완료됨.

## 배경 / 정책 결정

- 인증 정책이 "admin 발급, 셀프 가입 없음" → **"셀프 회원가입 허용"**으로 전환.
- **이메일 인증 필수**(확인 메일 링크로 본인 검증), **관리자 승인 절차 없음**. 인증 완료 시 즉시 `member`.
- 로그인 후 이동: **역할별 기본 + `next` 우선**(현재 무조건 `/admin` 버그 수정).
- 비밀번호 재설정·Google OAuth는 범위 밖(같은 SMTP를 쓰는 후속 작업).

## 현재 상태 (확인됨)

- `signupSchema`(`src/lib/dto/auth.ts`): name(필수)·church(선택→null)·email·password(8자+)·passwordConfirm·terms + 비밀번호 일치 refine. 클라이언트 검증에 이미 사용 중.
- `SignupForm`은 현재 **스텁**(`safeParse` 통과 시 `setDone`). 이걸 Server Action 호출로 교체.
- `handle_new_user` 트리거: `auth.users` insert 시 `profiles`를 **항상 `member`**로 생성, `name`·`title`·`church`를 `raw_user_meta_data`에서 읽음 → 셀프 가입 그대로 호환.
- `config.toml`: `enable_signup=true`, `enable_confirmations=false`(→ true로 변경), SMTP 미설정.
- `proxy.ts`: 보호 라우트 차단 시 `/login?next=<원래경로>` 부여. `login` 액션은 이를 무시하고 `/admin`으로 감(버그).
- `createSupabaseServer`(@supabase/ssr, 쿠키) / `createSupabaseService`(service-role) 존재.
- 홈: `/`=랜딩(인트로→`/main`), `/main`=앱 메인.

## 접근 방식

- **회원가입은 Server Action에서 `supabase.auth.signUp()`**: 프로젝트 mutation 표준, `enable_signup`/`enable_confirmations` 정책 준수, 트리거가 member 생성. 기각: service-role `admin.createUser`(셀프 가입 부적합·확인메일 우회), Route Handler+fetch(불필요).
- **이메일 인증은 token_hash + `/auth/confirm` Route Handler `verifyOtp`** (Supabase 공식 SSR 패턴). 기각: PKCE code 방식(메일을 다른 기기/브라우저에서 열면 code_verifier 쿠키 불일치로 실패).

## 구성 요소

### 1) 회원가입 Server Action — `src/server/actions/auth.ts`에 `signup` 추가
- `signupSchema.safeParse(FormData)`로 **서버 재검증**(클라와 동일 스키마). 실패 시 첫 오류 메시지 반환.
- `supabase.auth.signUp({ email, password, options: { data: { name, church }, emailRedirectTo: ${origin}/auth/confirm } })`.
  - `church`는 null 가능 → 메타데이터에 빈 값이면 트리거가 null 처리.
  - `origin`은 요청 헤더(`headers()`의 origin/host) 또는 `NEXT_PUBLIC_SITE_URL`로 구성.
  - 본인 검증 링크는 **확인 메일 템플릿의 token_hash 링크**(§2·§3)가 담당한다. `emailRedirectTo`는 Supabase의 허용 redirect 등록·기본 폴백 용도이며, 실제 인증은 token_hash 콜백으로 처리한다.
- **이메일 중복**: GoTrue는 보안상 중복 시에도 성공처럼 응답할 수 있음(enumeration 방지). 앱은 **항상 동일한 "확인 메일을 보냈습니다" 결과**를 반환(계정 존재 노출 방지). 명시적 에러만 일반 메시지로.
- 반환 타입 `SignupState { error?: string; sent?: boolean }`. 성공 시 `{ sent: true }`(세션 없음, 인증 대기).

### 2) 이메일 확인 콜백 — `src/app/auth/confirm/route.ts` (Route Handler, GET)
- 쿼리 `token_hash`, `type`(=`email`/`signup`), `next`(기본 `/main`) 수신.
- `createSupabaseServer().auth.verifyOtp({ type, token_hash })` → 성공 시 세션 쿠키 설정 후 `next`로 `redirect`.
- 실패/누락 시 `/login?error=확인 링크가 만료되었거나 유효하지 않습니다`로 redirect.
- `next`는 **내부 경로 화이트리스트**(`/`로 시작 & `//`·`http` 차단)만 허용(오픈 리다이렉트 방지).
- 응답은 redirect이므로 Route Handler JSON 스키마(§통신규약) 비적용 — 콜백 전용 예외.

### 3) Supabase 설정 — `supabase/config.toml`
- `[auth.email] enable_confirmations = true`.
- `[auth.email.template.confirmation]`을 token_hash 링크로 커스터마이즈: 본문 링크가 `${SITE_URL}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/main` 형태가 되도록 템플릿 파일 지정.
- **로컬 개발**: 내장 메일함(Inbucket/Mailpit, `[inbucket]`)으로 확인 메일을 캡처해 SMTP 없이 e2e 검증.
- **운영 SMTP**: 비영리·저비용 → Resend(무료 3,000통/월) 권장. Supabase 운영 프로젝트 대시보드(또는 `[auth.email.smtp]`)에 등록 — **배포 단계 설정, 애플리케이션 코드와 무관**.

### 4) 로그인 리다이렉트 수정 — `src/server/actions/auth.ts` `login`
- 로그인 폼에 `next` 히든 필드 전달(현재 `LoginForm`이 `searchParams`의 next를 받아 hidden input으로). 액션에서 `next` 파싱.
- 우선순위: 유효한 내부 `next` → 그곳 / 없으면 역할 기반 — `admin`→`/admin`, `member`→`/main`. 역할은 로그인 직후 `profiles.role` 또는 세션 클레임으로 판별.
- `next` 검증은 콜백과 동일한 내부 경로 화이트리스트 유틸 공유(`src/lib/safe-redirect.ts` 또는 `lib/dto` 인접 유틸).

### 5) SignupForm 연결 — `src/app/(public)/signup/SignupForm.tsx`
- 현재 스텁(`onSubmit`+`safeParse`+`setDone`)을 **`useActionState(signup, ...)`** + `<form action={...}>`로 교체.
- 클라이언트 zod 검증은 즉시 피드백용으로 유지 가능하나, 제출은 Server Action이 담당(서버 재검증이 최종).
- 성공(`sent`) 시: 폼 대신 "**{email}로 확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료해주세요.**" 안내 표시.
- 비밀번호 필드는 controlled 유지(`PasswordInput`), 폼 제출 시 `name`으로 값 전달.

## 데이터 흐름

```
SignupForm(use client)
  └─(form action)→ signup Server Action
        ├─ signupSchema 서버 검증
        └─ supabase.auth.signUp(data: name·church, emailRedirectTo)
              └─ trigger handle_new_user → profiles(member) 생성(미인증)
        ←{ sent:true }  → 폼에 "확인 메일 발송" 안내
메일 링크 클릭
  └─→ /auth/confirm?token_hash&type&next
        └─ verifyOtp → 세션 쿠키 설정 → redirect(next=/main)
이후 로그인
  └─ login 액션 → 역할별/next 리다이렉트
```

## 보안

- 서버에서 zod 재검증(클라 검증은 UX용). 권한 위조 차단은 트리거(role 항상 member) + RLS가 담당.
- 이메일 enumeration 방지: 중복 가입 시도에도 동일한 "확인 메일 발송" 결과.
- 오픈 리다이렉트 방지: `next`는 내부 경로 화이트리스트만.
- service-role 키·SMTP 비밀번호는 `.env`/대시보드에만(코드 하드코딩 금지).
- 비밀번호는 GoTrue가 해시·검증(앱은 평문 미보관).

## 검증 (테스트 러너 없음 → lint/build + 로컬 e2e)

- 로컬 Supabase 스택(`supabase start`) + 내장 메일함으로:
  1. `/signup` 제출 → "확인 메일 발송" 안내, 메일함에 확인 메일 도착.
  2. 메일 링크 → `/auth/confirm` → `/main` 진입(세션 생성), `profiles`에 member 생성 확인.
  3. 인증 전 로그인 시도 → 차단(미확인) 메시지.
  4. 로그인 리다이렉트: member→`/main`, admin→`/admin`, `?next=/board/..` 보존.
  5. 오픈 리다이렉트 차단(`next=//evil.com` 무시).
- `pnpm lint` / `pnpm build` 통과.

## 범위 밖 (후속)
- 비밀번호 재설정(동일 SMTP 재사용) — "비밀번호를 잊으셨나요?" 활성화.
- Google OAuth.
- 이용약관·개인정보 처리방침 실제 페이지.
- 운영 SMTP 실제 등록·발송 도메인 인증(DNS)은 배포 런북에서.
