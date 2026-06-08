# 서경노회 교육위원회 홈페이지

## 프로젝트 개요

서경노회 교육위원회의 홈페이지. 교사 강습회·성경고사·찬양대회 안내와 주일학교 교육 자료를 제공하는 **노회 차원의 교육 행정 포털**. 비영리·1인 운영, 저비용 운영(Supabase Pro 월 $25 수준)을 목표.

대상 사용자: **관리자**(노회 교육부 담당자)와 **일반 유저**(노회 산하 회원). 권한·역할은 이 두 그룹으로만 구분.

---

## 아키텍처 한눈에

**Next.js 풀스택 단일 앱**. 프론트·백엔드를 한 언어(TypeScript)·한 저장소·한 배포로 통합한다. 별도 PHP 백엔드는 없다.

- **프론트**: App Router의 Server/Client Component
- **백엔드**: 같은 앱 안의 `src/server/`(서버 전용 로직) + Server Actions + Route Handlers
- **DB·인증·저장**: **Supabase** (PostgreSQL + Auth + Storage). 데이터 접근은 supabase-js + **RLS**, 마이그레이션은 Supabase CLI(SQL)
- **배포**: **Vercel**(Next.js 호스팅) + **Supabase**(관리형 백엔드). 도메인·HTTPS는 Vercel이 자동 처리

> 변천: PHP 8.x + MySQL(`recpc` 로컬 APM) → 2026-05 Oracle Cloud ARM VM + Next.js 풀스택 + Drizzle 재설계 → 2026-06 **Supabase + Vercel** 전환(관리형 백엔드로 1인 운영 부담 최소화). 배경은 `docs/superpowers/specs/2026-06-07-supabase-migration-design.md` 참조.

---

## 디렉터리 구조

```
spec/
├── CLAUDE.md          ← 이 파일 (전역 컨텍스트·규칙)
├── README.md          ← 프로젝트 외부 소개
├── TODO.md            ← 작업 큐 + Claude 프롬프트 보관소
├── .env / .env.local  ← (gitignore) Supabase URL·키·시크릿
├── deploy/            ← 배포 런북 (Vercel + Supabase)
├── .claude/           ← Claude Code 설정/스킬/에이전트
├── docs/              ← 작업 기록·설계 문서
│   └── superpowers/
│       ├── plans/     ← 실행 plan (superpowers:writing-plans 표준 경로)
│       └── specs/     ← 설계 문서 (superpowers:brainstorming 표준 경로)
├── supabase/          ← DB 마이그레이션·config.toml (로컬 CLI 스택)
├── package.json · tsconfig.json · next.config.ts · *.config.mjs  ← 앱 설정 (pnpm)
├── public/            ← 정적 자산
├── scripts/           ← 빌드·시드 스크립트 (seed-supabase.mjs 등)
└── src/               ← Next.js 16 LTS 풀스택 앱 소스 (TS strict, Tailwind, App Router)
    ├── app/           ← App Router (UI 라우트 + api/ Route Handlers)
    ├── server/        ← 서버 전용(백엔드): auth/ · services/ · actions/ · supabase/ · uploads/
    ├── lib/           ← 클라이언트·공용 (api.ts 래퍼, dto/, 유틸)
    └── proxy.ts       ← 미들웨어 (Next 16: middleware→proxy 리네임)
```

> 앱은 **저장소 루트에 바로** 위치한다(`web/` 래퍼 없음). `src/`가 곧 앱 소스 루트다.

**중요**: 프론트와 백엔드는 **한 앱 안의 계층 분리**다. 경계는 폴더로 강제한다.
- `src/server/` = **서버 전용**. 각 파일 상단에 `import 'server-only'`. DB 접속·시크릿·비밀번호 해시는 **오직 여기서만**.
- `src/lib/` = **클라이언트에서도 import 가능한 것만** (타입·zod 스키마·fetch 래퍼·순수 유틸).
- `src/app/` = 라우팅·UI. 데이터는 `server/services`(읽기) 또는 `server/actions`(쓰기)를 통해 가져온다.

---

## 기술 스택

- **앱 프레임워크**: **Next.js 16.x = 활성 LTS** (2026.5 기준, 16.x 외 사용 금지), TypeScript **strict**, Tailwind CSS, App Router (`src/app/`), `src/` 디렉터리, path alias `@/*`
- **패키지 매니저**: **pnpm** (npm·yarn 사용 금지). 잠금 파일은 `pnpm-lock.yaml`
- **백엔드 런타임**: Next.js 서버(Node.js). Server Actions·Route Handlers로 구현. **별도 PHP 없음**
- **DB**: **Supabase PostgreSQL**(관리형). 데이터 접근은 **supabase-js**(PostgREST) + **RLS**. 마이그레이션은 **Supabase CLI**(SQL, `supabase/migrations/`). 인코딩 UTF-8
- **인증**: **Supabase Auth**(이메일+비밀번호). 세션은 **@supabase/ssr**이 httpOnly 쿠키로 관리. 역할(role)은 `profiles.role` → JWT 커스텀 클레임 `user_role`. 셀프 가입 없음(admin이 계정 발급)
- **파일 저장**: **Supabase Storage**(`attachments` 비공개 버킷). 다운로드는 service-role 스트리밍
- **배포/호스팅**: **Vercel**(Next.js, 비영리 Hobby 무료) + **Supabase Pro**(월 $25). 도메인·TLS는 Vercel 자동. 로컬 개발은 **Supabase CLI 스택**(Docker 런타임은 colima)

> ⚠️ Next.js 16부터 일부 API/컨벤션이 바뀌었습니다. 작업 전에 `AGENTS.md`와 `node_modules/next/dist/docs/`의 관련 가이드를 먼저 확인할 것.

---

## 통신 규약 (어기지 말 것)

**같은 출처(same-origin)** 단일 앱이므로 CORS·별도 도메인·Bearer 토큰 핸드셰이크가 필요 없다. 데이터 경로는 다음 우선순위를 따른다.

1. **읽기(조회)** — **Server Component가 `server/services/*`를 직접 호출**해 supabase-js로 가져온다. HTTP hop 없음. (가장 흔한 경로)
2. **쓰기(mutation)** — **Server Action**(`server/actions/*`, `'use server'`)을 폼에서 직접 호출. 입력은 **zod로 검증**.
3. **클라이언트에서 fetch가 꼭 필요할 때만**(무한 스크롤·검색·자동완성 등) — `src/app/api/<name>/route.ts` **Route Handler**를 만들고, 프론트는 **반드시 `src/lib/api.ts` 단일 래퍼**를 거친다 (직접 `fetch` 금지).

### Route Handler 응답 JSON 스키마 (고정)

Route Handler를 만들 때는 아래 스키마를 지킨다. `lib/api.ts`가 이 스키마를 파싱하고 실패 시 `ApiError(code, message)`를 throw한다.

```json
// 성공
{ "ok": true, "data": <payload> }

// 실패
{ "ok": false, "error": { "code": "<STRING_CODE>", "message": "<사람이 읽을 메시지>" } }
```

- 모든 Route Handler 응답은 `Content-Type: application/json; charset=utf-8`.
- (Server Component·Server Action 경로에는 이 스키마가 적용되지 않는다 — 함수가 값을 직접 반환/throw 한다.)

---

## 보안 기본기 (타협 금지)

- **보안 1차 경계는 RLS**다. 모든 테이블에 RLS를 켜고 정책으로 접근을 통제한다. 서버 코드는 그 위의 방어층.
- DB 접근은 **supabase-js 쿼리 빌더(PostgREST) / 파라미터 바인딩**으로. raw SQL이 필요하면 **RPC(security definer 함수)** 또는 `sql` 파라미터 바인딩만.
- 비밀번호 저장·검증은 **Supabase Auth(GoTrue)** 가 담당 — 앱은 평문 비밀번호를 보관·해시하지 않는다.
- **세션은 @supabase/ssr이 httpOnly·Secure·SameSite 쿠키**로 관리한다(localStorage 금지). JWT는 Supabase가 서명.
- 파일 업로드: (a) 확장자 화이트리스트, (b) 실제 MIME 검사, (c) 최대 용량 제한, (d) 저장 파일명은 서버에서 재생성(원본 파일명 그대로 저장 금지). Storage 버킷은 비공개로 두고 다운로드는 서버(service-role) 경유.
- 권한 체크는 **서버에서** 한다. `proxy.ts`(미들웨어)로 보호 라우트를 가드하고, Server Action·Route Handler 진입부에서 세션·역할을 재확인.
- **service-role 키**·DB 비밀번호 등은 코드에 하드코딩 금지. **`.env`(gitignore)** 로 분리하고 서버에서만 사용.
- Next.js에서 사용자 입력 렌더 시 **`dangerouslySetInnerHTML` 사용 금지** (불가피하면 sanitize).
- 개인정보(교회 회원 정보·연락처)는 데이터 민감도를 반영해 접근 권한·로깅을 최소화.

---

## 작업 규칙

### 디자인 이식
- 디자인 원본은 **Claude Design(claude.ai/design)에서 export한 HTML/CSS/JS** 핸드오프 번들
- 이식 위치: `_design/` (gitignore). 정적 자산은 `public/`에 복사
- **디자인은 100% 보존**: 여백·색상·타이포·반응형·애니메이션 모두 원본 그대로 (헌법 [7])
- 마크업·Tailwind 클래스·CSS는 **임의 변경 금지**. 데이터 바인딩·라우팅·상태·에러 처리만 추가
- HTML → JSX 변환 시 `class` → `className`, self-closing 등 **기계적 변환만** 허용
- 외부 폰트(Google Fonts 등)는 `next/font/google` 또는 `next/font/local`로 self-host 변환
- 인터랙션은 React 훅으로 옮기되 `'use client'`는 **상태/이벤트가 필요한 경우에만**
- 데이터(공지·일정 등)는 **mock 상수로 시작**, 백엔드 연동은 별도 PR

### 언어 정책 (필수)
- **모든 사용자 응답·문서·커밋 본문·주석은 한국어**. 영어 답변·영어 문서 작성 금지 (외부 라이브러리 인용·코드 식별자는 예외).
- **UI 텍스트**: 한국어
- **코드 식별자**(변수·함수·컴포넌트명): 영어
- **커밋 메시지**: **Conventional Commits prefix + 한국어 본문**. 예시:
  - `feat: 메인 페이지 히어로 섹션 추가`
  - `fix: 모바일 메뉴 닫힘 버그 수정`
  - `docs: 작업 정리 문서 추가`
  - `chore: 의존성 업데이트`
  - `refactor: 컴포넌트 분리`
  - `style: Tailwind 클래스 정리`
- **주석**: 한국어. 단 "왜"만 적고 "무엇을" 적지 말 것 (이름이 무엇을 알려줌)

### 코드 컨벤션 (Next.js / React 표준)
별도 명시가 없으면 **커뮤니티 암묵 컨벤션**을 따름:
- **TypeScript strict 필수** (`tsconfig.json`의 `compilerOptions.strict: true`). `any` 회피, 단언 최소화
- App Router 기본 Server Component, `'use client'`는 상태·이벤트 필요한 곳만
- 컴포넌트 파일/식별자: PascalCase (`NoticeCard.tsx`, `export default function NoticeCard`)
- 훅: `useXxx` camelCase 파일명 (`useSchedule.ts`)
- 라우트 폴더: 소문자·kebab-case (`app/notice/[id]/`)
- 서버 전용 모듈(`src/server/**`)은 상단에 `import 'server-only'`
- Tailwind: 기본값 우선, 반복되는 조합은 컴포넌트로 추출
- 디자인 이식 페이지는 **CSS Modules**(`*.module.css`)로 캡슐화하여 디자인 원본 보존
- Path alias: `@/*` (이미 `tsconfig.json`에 설정됨 → `src/*`)
- ESLint·Prettier는 Next.js 기본 설정 사용

### 작업 흐름 (브랜치 → 작업 → 기록 → PR → 정리)

**규칙:**
1. 새 작업은 **`TODO.md`에 프롬프트로 정리** 후 시작 (즉흥적 큰 변경 X)
2. **반드시 새 브랜치에서 작업** — `main` 직접 커밋 금지
   - 브랜치 명: `feat/<주제>`, `fix/<주제>`, `docs/<주제>` 등 prefix 일치
3. 작업 시작 시 **plan 문서 작성** → `docs/superpowers/plans/YYYY-MM-DD-<주제>.md`
   - `superpowers:writing-plans` 스킬 활용
4. 작업 진행은 **`superpowers:executing-plans`** 또는 **`superpowers:test-driven-development`** 스킬 사용
5. 작업 완료 시 **PR 작성 → 머지 → 브랜치 삭제** 한 큐 처리
   - **`superpowers:finishing-a-development-branch`** 스킬을 호출하면 자동 가이드
6. 페이지 추가 시 v1/v2 범위 의식 (`TODO.md` 참조)
7. **백엔드(Supabase 스키마·RLS·Auth·Storage·CRUD)는 마이그레이션 완료.** 새 백엔드 기능을 추가할 때는 **RLS 정책을 반드시 함께** 만들고 서버에서 권한을 재확인한다.

**문서 정리 위치:**
- `docs/superpowers/plans/<날짜>-<주제>.md` — 실행 plan (작업 전 작성)
- `docs/superpowers/specs/<날짜>-<주제>-design.md` — 설계 문서 (브레인스토밍 결과물)
- 두 폴더는 **superpowers 스킬이 표준으로 사용하는 경로**이므로 손대지 않고 그대로 활용

**커밋 단위:** 한 작업 = 한 PR이 기본. 큰 작업은 plan에서 단계로 쪼개고 단계별 커밋.

---

## 자주 쓰는 명령

```bash
# 개발 서버 (저장소 루트에서 실행)
pnpm dev                       # http://localhost:3000

# 빌드/린트
pnpm build
pnpm lint

# 패키지 추가
pnpm add <패키지명>
pnpm add -D <개발 의존>

# pnpm 미설치 환경이면
corepack enable && corepack prepare pnpm@latest --activate

# 로컬 Supabase 스택 (Docker 런타임은 colima)
colima start                   # 최초 1회: brew install colima docker
npx supabase start             # Postgres·Auth·Storage·Studio 기동
npx supabase stop

# DB 마이그레이션 (Supabase CLI)
npx supabase migration new <name>   # 새 마이그레이션 SQL 생성
npx supabase db reset               # 로컬 재적용(시드 포함)
npx supabase db push                # 운영 프로젝트에 반영
pnpm db:types                       # database.types.ts 재생성

# 시드 (로컬: admin·member + 콘텐츠)
pnpm seed
```

---

## 행동 규칙 (헌법 [7])

작업 시 다음을 지킨다:
- **한 번에 너무 많은 파일을 만들지 않는다.** Phase 단위로 진행하며 끝마다 동작 확인 방법을 알린다.
- **추측이 필요한 결정은 만들지 말고 사용자에게 묻는다.** (예: 정확한 도메인, 메뉴 구조, 권한 등급)
- **파일 생성/수정 전에 어떤 파일을 어떻게 바꿀지 1~2줄로 먼저 요약한다.**
- 디자인 클래스/마크업은 **사용자 허락 없이 임의로 바꾸지 않는다**.

---

## 주의사항

- **빈 placeholder 파일을 만들지 말 것**. `src/server/` 등 하위 폴더·파일은 해당 기능을 구현하는 시점에 생성한다. 백엔드 의존성(`@supabase/*` 등)도 사용 시점에 추가.
- **개인정보 주의**: 교회 회원 정보·연락처 등이 들어가면 데이터 민감도를 반영한 보안 조치 적용.
- **`.env`는 `.gitignore`로 분리**, 시크릿 코드 하드코딩 금지.
- 한국어 입력은 **IME 호환성** 점검 (특히 폼 입력).
- `_design/`은 디자인 원본 자산 보관소 (gitignore). 정적 파일은 `public/`로 복사해 사용.

---

## 다음 작업 (요약)

1. **(완료)** 아키텍처 재설계 — Oracle/Drizzle → **Supabase + Vercel** 전환 (`docs/superpowers/specs/2026-06-07-supabase-migration-design.md`)
2. **(완료)** Supabase 마이그레이션 — 스키마·RLS·Auth·Storage·supabase-js 전환, 로컬 CLI 스택으로 6섹션 e2e 검증
3. **(대기)** Supabase Pro 결제 → 운영 프로젝트 생성(리전 Seoul), `supabase link` + `db push` + admin 시드
4. **(대기)** Vercel 배포 — Root `./`, env 3개(URL·anon·service-role), 도메인·TLS
5. **(상시)** 디자인 이식 잔여 페이지(메인 등) + 운영 스모크 테스트
