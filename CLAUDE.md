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
├── TODO.md            ← 작업 큐 + Claude 프롬프트 보관소
├── .claude/           ← Claude Code 설정/스킬/에이전트
│   ├── settings.json
│   ├── skills/        (필요 시)
│   ├── agents/        (필요 시)
│   └── commands/      (필요 시 — 예: /finish 같은 슬래시 alias)
├── docs/              ← 작업 기록·설계 문서
│   └── superpowers/
│       ├── plans/     ← 실행 plan (superpowers:writing-plans 표준 경로)
│       └── specs/     ← 설계 문서 (superpowers:brainstorming 표준 경로)
└── frontend/          ← Next.js 16 (TS, Tailwind, App Router, src/)
    └── (backend/는 백엔드 결정 후 추가 예정 — TODO.md 0번 참조)
```

---

## 기술 스택

- **프론트엔드**: Next.js 16, TypeScript, Tailwind CSS, App Router (`frontend/src/app/`)
- **패키지 매니저**: npm
- **백엔드**: **미정** — `TODO.md` 0번 항목에서 비교·결정 (Next.js 단독 / 로컬 APM + Cloudflare Tunnel / Cloudflare Pages + D1 / 한국 PHP 호스팅)
- **호스팅**: 백엔드 결정과 함께 정함

> ⚠️ Next.js 16부터 일부 API/컨벤션이 바뀌었습니다. 작업 전에 `frontend/AGENTS.md`와 `frontend/node_modules/next/dist/docs/`의 관련 가이드를 먼저 확인할 것.

---

## 작업 규칙

### 디자인 이식
- 디자인 원본은 **Claude Artifacts에서 export한 HTML**
- 이식 시 **디자인을 100% 보존**: 여백·색상·타이포·반응형 모두 그대로
- HTML → JSX 변환 시 `class` → `className`, self-closing 등 기계적 변환 우선
- 인터랙션은 React 훅으로 옮기되 `'use client'`는 **필요할 때만** (App Router 원칙)

### 언어 정책
- **UI 텍스트**: 한국어
- **코드 식별자**(변수·함수·컴포넌트명): 영어
- **커밋 메시지**: **Conventional Commits prefix + 한국어 본문**. 예시:
  - `feat: 메인 페이지 히어로 섹션 추가`
  - `fix: 모바일 메뉴 닫힘 버그 수정`
  - `docs: 작업 정리 문서 추가`
  - `chore: 의존성 업데이트`
  - `refactor: 컴포넌트 분리`
  - `style: Tailwind 클래스 정리`
- **주석**: 한국어 OK. 단 "왜"만 적고 "무엇을" 적지 말 것

### 코드 컨벤션 (Next.js / React 표준)
별도 명시가 없으면 **커뮤니티 암묵 컨벤션**을 따름:
- App Router 기본 Server Component, `'use client'`는 상태·이벤트 필요한 곳만
- 컴포넌트 파일/식별자: PascalCase (`NoticeCard.tsx`, `export default function NoticeCard`)
- 훅: `useXxx` camelCase 파일명 (`useSchedule.ts`)
- 라우트 폴더: 소문자·kebab-case (`app/notice/[id]/`)
- Tailwind: 기본값 우선, 반복되는 조합은 컴포넌트로 추출
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
cd frontend && npm run dev          # http://localhost:3000

# 빌드/린트
cd frontend && npm run build
cd frontend && npm run lint

# 패키지 추가
cd frontend && npm install <패키지명>
```

---

## 주의사항

- **빈 placeholder 파일을 만들지 말 것**. `.claude/skills/` 등은 빈 폴더로 두고, 실제 스킬이 필요할 때만 SKILL.md 추가.
- **로컬 APM 서버 별칭**: `recpc` (백엔드 후보 B로 갈 경우 사용)
- **개인정보 주의**: 교회 회원 정보·연락처 등이 들어가게 되면 백엔드 결정 시 데이터 민감도 반영
- **백엔드 결정 전엔 외부 API 호출 코드를 짜지 말 것** — 결정 후 일관된 구조로 작성
- 한국어 입력은 IME 호환성 점검 (특히 폼 입력)

---

## 다음 작업 (요약)

1. `TODO.md` 1번: Claude Artifacts HTML을 `frontend/`에 이식
2. `TODO.md` 0번: 백엔드 구조 결정
3. v1 페이지 골격 → v2 백로그
