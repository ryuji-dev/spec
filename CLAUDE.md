# 서경노회 교육부 공식 홈페이지

## 프로젝트 개요

서경노회 교육부의 공식 홈페이지. 교사 강습회·성경고사·찬양대회 안내와 주일학교 교육 자료를 제공하는 **노회 차원의 교육 행정 포털**. 비영리·1인 운영, 무료 운영을 목표.

대상 사용자: **관리자**(노회 교육부 담당자)와 **일반 유저**(노회 산하 회원). 권한·역할은 이 두 그룹으로만 구분.

---

## 디렉터리 구조

```
spec/
├── CLAUDE.md          ← 이 파일 (전역 컨텍스트·규칙)
├── README.md          ← 프로젝트 외부 소개
├── TODO.md            ← 작업 큐 + Claude 프롬프트 보관소 (프로젝트 헌법 포함)
├── .claude/           ← Claude Code 설정/스킬/에이전트
│   ├── settings.json
│   ├── skills/        (필요 시)
│   ├── agents/        (필요 시)
│   └── commands/      (필요 시)
├── docs/              ← 작업 기록·설계 문서
│   └── superpowers/
│       ├── plans/     ← 실행 plan (superpowers:writing-plans 표준 경로)
│       └── specs/     ← 설계 문서 (superpowers:brainstorming 표준 경로)
├── frontend/          ← Next.js 16 LTS (TS strict, Tailwind, App Router, src/, pnpm)
└── backend/           ← (예정) PHP 8.x + MySQL — recpc의 APM 환경에 배포
```

**중요**: `frontend/`와 `backend/`는 **형제 폴더로 독립**. `frontend/` 안에서 PHP를 import하지 않고, 둘은 REST/JSON API로만 통신.

---

## 기술 스택

- **프론트엔드**: **Next.js 16.x = 활성 LTS** (2026.5 기준, 16.x 외 사용 금지), TypeScript **strict**, Tailwind CSS, App Router (`frontend/src/app/`), `src/` 디렉터리 사용, path alias `@/*`
- **패키지 매니저**: **pnpm** (npm·yarn 사용 금지). 잠금 파일은 `frontend/pnpm-lock.yaml`
- **백엔드**: **PHP 8.x + MySQL on `recpc`(로컬 APM)** 확정 — `backend/` 폴더(예정)에서 작업, recpc의 웹 루트로 업로드 배포
- **DB**: MySQL (recpc), `utf8mb4_unicode_ci`
- **파일 저장**: recpc 로컬 디스크 `/uploads` (S3 미사용)
- **호스팅**: 프론트는 Vercel(또는 추후 결정), 백엔드는 recpc

> ⚠️ Next.js 16부터 일부 API/컨벤션이 바뀌었습니다. 작업 전에 `frontend/AGENTS.md`와 `frontend/node_modules/next/dist/docs/`의 관련 가이드를 먼저 확인할 것.

> **프론트엔드는 절대 DB에 직접 붙지 않는다.** 항상 PHP API를 통해서만 통신.

---

## 통신 규약 (어기지 말 것)

- 프론트 ↔ 백엔드는 **REST(JSON)** 로만 통신. PHP는 HTML을 출력하지 않음.
- 모든 PHP 엔드포인트는 응답을 `Content-Type: application/json; charset=utf-8` 로 내려준다.
- 모든 PHP 엔드포인트 최상단에 **CORS 헤더**. 허용 Origin은 환경변수로 관리. 최소 다음 두 개 허용:
  - Vercel 프로덕션 도메인
  - `http://localhost:3000`
- **OPTIONS preflight** 요청은 200으로 즉시 종료.
- 인증은 **JWT(Bearer 토큰)**. 로그인 시 PHP가 발급, 이후 요청은 `Authorization: Bearer <token>` 헤더로 검증.

### 응답 JSON 스키마 (고정)

```json
// 성공
{ "ok": true, "data": <payload> }

// 실패
{ "ok": false, "error": { "code": "<STRING_CODE>", "message": "<사람이 읽을 메시지>" } }
```

- 프론트의 모든 API 호출은 `frontend/src/lib/api.ts` **단일 래퍼**를 거친다 (직접 `fetch` 금지). 래퍼는 위 스키마를 파싱하고 실패 시 `ApiError(code, message)` throw.

---

## 보안 기본기 (타협 금지)

- PHP의 모든 DB 쿼리는 **PDO + Prepared Statement**. 문자열 결합 쿼리 금지.
- 비밀번호는 `password_hash(PASSWORD_DEFAULT)` / `password_verify` 만 사용. 평문/MD5/SHA1 금지.
- 파일 업로드: (a) 확장자 화이트리스트, (b) 실제 MIME 검사, (c) 최대 용량 제한, (d) 저장 파일명은 서버에서 재생성(원본 파일명 그대로 저장 금지).
- JWT 시크릿·DB 비밀번호 등은 코드에 하드코딩 금지. `.env` / `config.php`(gitignore)로 분리.
- Next.js에서 사용자 입력 렌더 시 **`dangerouslySetInnerHTML` 사용 금지** (불가피하면 sanitize).

---

## 작업 규칙

### 디자인 이식
- 디자인 원본은 **Claude Design(claude.ai/design)에서 export한 HTML/CSS/JS** 핸드오프 번들
- 이식 위치: `frontend/_design/` (gitignore). 정적 자산은 `frontend/public/`에 복사
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
- Tailwind: 기본값 우선, 반복되는 조합은 컴포넌트로 추출
- 디자인 이식 페이지는 **CSS Modules**(`*.module.css`)로 캡슐화하여 디자인 원본 보존
- Path alias: `@/*` (이미 `tsconfig.json`에 설정됨)
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
7. 디자인 이식이 끝나기 전까지 백엔드 작업은 시작하지 않음

**문서 정리 위치:**
- `docs/superpowers/plans/<날짜>-<주제>.md` — 실행 plan (작업 전 작성)
- `docs/superpowers/specs/<날짜>-<주제>-design.md` — 설계 문서 (브레인스토밍 결과물)
- 두 폴더는 **superpowers 스킬이 표준으로 사용하는 경로**이므로 손대지 않고 그대로 활용

**커밋 단위:** 한 작업 = 한 PR이 기본. 큰 작업은 plan에서 단계로 쪼개고 단계별 커밋.

---

## 자주 쓰는 명령

```bash
# 개발 서버 (frontend/에서 실행)
cd frontend && pnpm dev             # http://localhost:3000

# 빌드/린트
cd frontend && pnpm build
cd frontend && pnpm lint

# 패키지 추가
cd frontend && pnpm add <패키지명>
cd frontend && pnpm add -D <개발 의존>

# pnpm 미설치 환경이면
corepack enable && corepack prepare pnpm@latest --activate
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

- **빈 placeholder 파일을 만들지 말 것**. `.claude/skills/` 등은 빈 폴더로 두고, 실제 스킬이 필요할 때만 SKILL.md 추가.
- **로컬 APM 서버 별칭**: `recpc` — 백엔드 PHP/MySQL 환경.
- **개인정보 주의**: 교회 회원 정보·연락처 등이 들어가면 데이터 민감도를 반영한 보안 조치 적용.
- **`.env`·`config.php`는 `.gitignore`로 분리**, 시크릿 코드 하드코딩 금지.
- 한국어 입력은 **IME 호환성** 점검 (특히 폼 입력).
- `frontend/_design/`은 디자인 원본 자산 보관소 (gitignore). 정적 파일은 `frontend/public/`로 복사해 사용.

---

## 다음 작업 (요약)

1. `TODO.md` Phase 1: DB 스키마와 시드 데이터
2. `TODO.md` Phase 2: 인증 (로그인·회원가입은 admin만·본인 정보)
3. `TODO.md` Phase 3: 게시물 CRUD + 파일 업로드
4. 메인페이지(`frontend/_design/.../서경노회 교육위원회 메인페이지.html`) 이식 — `app.jsx`의 모바일 컴포넌트 활용
5. `backend/` PHP 골격 생성 (Phase 0 (B) 후반부)
