# 소셜 로그인 + 관리자 사이트 접근 + "메인 배너" 용어 변경 설계

## 배경·목표

- **일반 회원**이 Google·Kakao로 가입·로그인할 수 있게 한다(아이디/비밀번호 없이 편의 향상).
- **관리자**가 로그인 후 공개 사이트를 둘러보고, 헤더에서 관리자 대시보드로 오갈 수 있게 한다(현재는 로그인 시 `/admin`으로 떨어지고 사이트→대시보드 진입점이 없어 갇힌 느낌).
- 불명확한 **"메인 히어로"** 용어를 **"메인 배너"**로 통일.

## 현재 구조(반영 전제)

- 인증: Supabase Auth(이메일+비밀번호), `@supabase/ssr` httpOnly 쿠키, 역할은 `profiles.role` → JWT `user_role` 클레임. 이메일 인증 미사용(`enable_confirmations=false`) → 가입 즉시 세션.
- `handle_new_user` 트리거가 가입 시 `profiles`(role=member) 행을 자동 생성(현재 이메일 가입의 `name`/`church` 메타데이터 기준).
- 로그인 성공 시 역할별 fallback: admin→`/admin`, member→`/main`(유효한 `next` 우선).
- `proxy.ts`가 `/admin`(admin 전용)·`/board`(로그인 필요) 가드. 그 외 공개 사이트는 누구나 접근 가능.
- 공개 헤더(`DesktopNav`·`MobileStickyHeader`)는 인증 상태와 무관하게 항상 "로그인"만 표시.
- 로그인 화면의 "Google로 계속하기" 버튼은 `disabled` 디자인 자리표시자.

## 범위 — 3개 PR로 분리 실행

### PR 1 — 소셜 로그인(Google · Kakao)

- **계정·권한 모델**: 소셜 로그인 = **일반 회원(member) 즉시 가입**. 관리자는 이메일/비밀번호 유지하며, 소셜로는 admin이 생성될 수 없다(role 항상 member).
- **공급자**: Google·Kakao만(둘 다 Supabase 기본 지원). Naver는 기본 미지원이라 제외(YAGNI).
- **DB(새 마이그레이션)**: `handle_new_user` 트리거 보강 — 이름 도출 우선순위 `name` → `full_name` → `nickname`(Kakao) → 이메일 local-part. role은 항상 `member`. 기존 이메일 가입 동작은 그대로 유지.
- **콜백 라우트(신규)**: `src/app/auth/callback/route.ts` — `exchangeCodeForSession(code)` 후 안전한 `next`(없으면 `/main`)로 리다이렉트, 실패 시 `/login?notice=...`.
- **서버 액션(신규)**: `signInWithProvider(provider, next)` (`server/actions/auth.ts`) — `provider ∈ {google, kakao}` 화이트리스트, `redirectTo = <origin>/auth/callback?next=...`, `data.url`로 `redirect()`.
- **UI**: `LoginForm`·`SignupForm` — 비활성 Google 버튼 활성화 + **Kakao 버튼 추가**. 기존 `auth.module.css` 디자인 유지, Kakao 옐로 톤 클래스 추가.
- **동일 이메일 연동**: Supabase 기본 동작(이메일 일치 자동 연동)에 위임. 수동 연동 UI 없음(YAGNI).
- **공급자 설정(코드 외 — 사용자 작업)**: Supabase 대시보드에서 Google·Kakao provider 활성화 + 각 콘솔의 client ID/secret 등록, redirect URL(`<운영도메인>/auth/callback`) 등록. 로컬은 `supabase/config.toml`의 `[auth.external.google|kakao]`. 시크릿은 Claude가 입력하지 않는다 → **deploy 런북에 절차 문서화**.

### PR 2 — 관리자 공개 사이트 접근 + 헤더 진입점

- **로그인 후 도착지**: 관리자도 기본 `/main`(역할별 fallback에서 admin→`/main`으로 변경). 유효한 `next`는 그대로 우선.
- **공개 헤더 인증 인지화**: 서버에서 `role`을 읽어 `DesktopNav`·`MobileStickyHeader`에 `isAdmin`(필요 시 `isLoggedIn`) prop 전달. admin이면 헤더 우측에 **"관리자" 링크**(→`/admin`) 노출.
- **관리자 셸**: `admin-shell`에 **"사이트 보기"**(→`/main`) 링크 추가(대시보드↔사이트 왕복).
- 비-admin 로그인 상태의 헤더 "로그인↔로그아웃" 토글은 **이번 범위 밖**(추후 별도 검토).

### PR 3 — "메인 히어로" → "메인 배너" 용어 변경

- **변경 대상(사용자 가시 텍스트만)**: admin 사이드바 라벨, `hero` 목록·신규·편집 페이지의 제목·버튼·안내 문구.
- **유지**: 라우트 경로(`/admin/hero`)·코드 식별자(`hero`)·DB 테이블명. URL·식별자는 비노출이라 변경 리스크만 큼 → 텍스트만 "메인 배너"로 통일.

## 통신·보안

- 권한 체크는 서버(`proxy` + 액션 진입부) 그대로. provider 화이트리스트로 임의 provider 주입 차단.
- 콜백은 PKCE(`@supabase/ssr`) 쿠키로 `code`를 세션으로 교환.
- 소셜 가입도 role은 트리거가 강제 `member` → 권한 상승 경로 없음.

## 테스트

- **로컬**: 트리거(소셜 메타데이터를 모사한 `auth.users` INSERT로 `profiles` 생성·이름 도출 확인)·콜백 라우트·서버 액션 화이트리스트·헤더 `isAdmin` 분기·라벨 변경을 단위/렌더로 검증. 실제 Google·Kakao 왕복은 로컬에 실제 OAuth 앱이 필요해 제한적 → **운영 공급자 설정 후 스모크**로 확인.
- 각 PR `npx tsc --noEmit` · `pnpm lint` · `pnpm build` 통과.

## YAGNI 제외

- Naver 로그인, 수동 계정 연동 UI, 신규 회원 승인 대기 상태, 비-admin 헤더 로그인/로그아웃 토글.
