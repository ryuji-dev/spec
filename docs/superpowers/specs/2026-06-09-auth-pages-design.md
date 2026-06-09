# 로그인·회원가입 페이지 디자인 이식 (설계)

> 작성일 2026-06-09 · 브랜치 `feat/supabase-migration` (또는 신규 `feat/auth-pages`)
> 범위: **디자인 이식 + 화면간 이동·인터랙션까지**. 실제 가입·로그인 처리 로직은 별도 '기능' 단계.

## 배경

- 인증 정책이 "셀프 가입 없음(admin 발급)"에서 **"일반 회원가입 허용"**으로 바뀐다. Google 소셜 로그인은 나중에 연동한다.
- 기능 구현 전에 **로그인·회원가입 화면 디자인을 먼저** 만들어 둔다.
- 디자인 원본은 Claude Design 핸드오프:
  - 로그인: 번들 `로그인 · 서경노회 교육위원회.html` (Claude Design self-contained bundle)
  - 회원가입: 사용자 제공 디자인 이미지(로그인과 동일 디자인 시스템)

## 현재 상태 (확인됨)

- 기존 로그인: `src/app/(public)/login/`에 **임시 기능형 화면**이 있다(인라인 스타일). `login` Server Action은 이미 동작한다.
- 폰트는 `src/app/layout.tsx`에서 `next/font/google`로 이미 로드: Noto Serif KR · Noto Sans KR · Inter · Cormorant Garamond → CSS 변수 `--font-noto-serif-kr` 등. **번들의 폰트 패밀리와 정확히 일치.**
- 백엔드는 셀프 가입을 받을 준비가 거의 돼 있다(이번 범위 밖, 기능 단계 참고용):
  - `handle_new_user` 트리거가 가입자를 **무조건 `member`로 생성**(메타데이터 role 위조 차단)
  - `guard_profile_role` 트리거가 권한 상승 차단
  - `config.toml`에 `enable_signup = true`
- `proxy.ts` 가드는 `/admin`·`/board`만 보호 → `/login`·`/signup`은 이미 공개. **조정 불필요.**

## 번들 분석 결과

- 파일은 Claude Design **셀프 컨테인드 번들**: `__bundler/template`(렌더 HTML+CSS), `__bundler/manifest`(에셋), `__bundler/ext_resources`.
- 에셋: 히어로 배경 webp 1개, woff2 폰트 260여 개, JS/JSX 6개.
- **번들에는 로그인 페이지 디자인만** 있다. 회원가입 화면은 별도 이미지로 제공됨.

## 접근 방식 (CSS 전략)

**채택: 로그인/회원가입 전용 CSS만 추출 → CSS Module + 기존 next/font 재사용.**

번들 전역 CSS에는 `@font-face` 260여 개를 포함한 디자인 시스템 전체가 들어 있으나, 프로젝트는 이미 같은 폰트를 `next/font`로 self-host한다. 따라서 폰트 관련 CSS는 가져오지 않고 기존 `--font-*` 변수를 사용하며, **레이아웃/컴포넌트 CSS만** 떼어 `*.module.css`로 캡슐화한다(`CLAUDE.md` 디자인 이식 규칙 준수).

기각:
- 번들 전역 CSS 통째 이식 → 폰트 중복·전역 충돌·과대 용량.
- Tailwind 재작성 → 디자인 임의 변경 위험(헌법 [7] 위반).

## 파일 구조

```
_design/auth/              # 번들 언팩 결과(gitignore, 원본 보존)
public/images/
  auth-hero.webp           # 좌측 히어로 배경 (번들 webp 추출)
src/lib/dto/
  auth.ts                  # 공유 zod 스키마 (loginSchema, signupSchema) — 클라이언트/서버 공용
src/app/(public)/
  login/
    page.tsx               # 디자인 교체 (기존 임시 화면 → 번들 디자인)
    LoginForm.tsx          # 디자인 반영 + 기존 login 액션 유지
    login.module.css       # 추출 CSS
  signup/                  # 신설
    page.tsx
    SignupForm.tsx
    signup.module.css
  _components/auth/         # 두 화면 공통
    AuthHero.tsx           # 좌측 히어로 (동일하므로 공통화)
    AuthHero.module.css
```

> 좌측 히어로는 두 화면이 동일하므로 `AuthHero`로 공통화한다. 폼은 화면별로 다르므로 분리한다.

## 화면 명세

### 로그인 (`/login`)
- 좌측: 설산/별 히어로 + 키커 `서경노회 · 교육위원회` + `EDUCATION · COMMUNITY · FAITH` + 제목 "가르치는 자의 / *거룩한 부르심*" + 시편 133:1 인용.
- 우측: 로고(십자가) + 기관명(국/영문) + `Google로 계속하기`(**disabled**) + "또는" 구분선 + 이메일/비밀번호 + 비밀번호 표시 토글 + "비밀번호를 잊으셨나요?"(placeholder 링크) + `로그인` 버튼 + "계정이 없으신가요? **회원가입**"(`/signup` 이동).
- 동작: 기존 `login` Server Action을 **그대로 연결**(이미 동작). 추가 제출 로직 없음.

### 회원가입 (`/signup`)
- 좌측: 로그인과 동일(`AuthHero` 재사용).
- 우측 폼 필드(위→아래):
  - `Google로 계속하기` (**disabled**)
  - "또는" 구분선
  - **성함**(필수) | **소속 교회**(선택) — 2열 가로 배치. placeholder `홍길동` | `서경중앙교회`
  - **이메일** — placeholder `you@example.com`
  - **비밀번호** — placeholder `8자 이상 입력하세요` + 표시 토글
  - **비밀번호 확인** — placeholder `비밀번호를 다시 입력하세요` + 표시 토글
  - ☐ **이용약관 및 개인정보 처리방침에 동의합니다.** (약관·방침 링크는 placeholder)
  - `가입하기` (골드 버튼) — **제출 스텁(미연동)**
  - "이미 계정이 있으신가요? **로그인**" (`/login` 이동)
- `profiles` 스키마 정합: 이름(필수)·교회(선택)는 가입 시 수집, 직함은 admin만 수집(가입 폼 제외).

## 검증 (zod 공유 스키마)

입력 검증은 **zod**로 한다(`CLAUDE.md`: 입력은 zod 검증). 클라이언트 인터랙션 검증과 (기능 단계의) 서버 검증이 **같은 스키마를 공유**하도록 `src/lib/dto/auth.ts`에 정의한다(server-only 의존 없음 → 클라이언트 import 가능).

- `loginSchema`: `email`, `password`. 기존 `actions/auth.ts`의 인라인 스키마를 이 파일로 추출해 server action도 동일 스키마를 import(소폭 리팩터, 로그인을 손대는 김에 함께).
- `signupSchema`: `name`(필수, trim 후 1자 이상) · `church`(선택) · `email` · `password`(8자 이상) · `passwordConfirm` · `terms`(동의 필수, `literal(true)`). 비밀번호 일치는 객체 단위 `.refine()`로 검증.
- 회원가입 폼은 제출 시 `signupSchema`로 **클라이언트 검증**해 필드별 오류를 표시한다(인터랙션, 범위 내). 검증 통과 시 실제 가입은 **스텁**(기능 단계에서 동일 `signupSchema`를 쓰는 Server Action으로 연결).

## 인터랙션 (범위 내, `'use client'`)
- 비밀번호 표시/숨김 토글 (로그인 1개, 회원가입 2개).
- 회원가입: zod 기반 클라이언트 검증(비밀번호 일치·필드 형식·약관 동의), 약관 동의 체크박스 상태.
- 로그인 ↔ 회원가입 링크 이동.
- `Google로 계속하기`는 양쪽 모두 `disabled`(시각 보존, 클릭 무반응).

## 이번에 하지 않는 것 (기능 단계)
- 회원가입 Server Action(`supabase.auth.signUp`) 및 이메일 인증(`enable_confirmations`) 정책.
- Google OAuth 실제 연동.
- 이용약관·개인정보 처리방침 실제 페이지(현재 링크는 placeholder).
- `proxy.ts` 가드 변경(불필요).

## 검증
- 로컬 dev 서버 + Claude Preview로 두 화면을 렌더해 디자인 원본(스크린샷)과 비교.
- 반응형(데스크톱/모바일) 및 폼 인터랙션(토글·이동) 동작 확인.
- `pnpm lint` / TypeScript strict 통과.
