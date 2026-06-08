# 서경노회 교육위원회 홈페이지

서경노회 교육위원회 홈페이지 — 교사 강습회·성경고사·찬양대회 안내와 주일학교 교육 자료를 제공하는 노회 차원의 교육 행정 포털.

## 기술 스택

- **앱**: Next.js 16 풀스택 (App Router, TypeScript strict, Tailwind CSS, src/, pnpm) — 프론트·백엔드 단일 앱
- **백엔드**: 같은 앱 안의 Server Actions·Route Handlers + `src/server/` 서버 전용 계층
- **DB·인증·저장**: Supabase (PostgreSQL + Auth + Storage) — supabase-js + RLS
- **배포**: Vercel(Next.js) + Supabase. 도메인·HTTPS는 Vercel 자동
- 자세한 규약·보안 기본기는 [`CLAUDE.md`](./CLAUDE.md) 참조

## 빠른 시작

```bash
# 의존성 설치 (저장소 루트에서 실행)
pnpm install   # pnpm 미설치 시: corepack enable && corepack prepare pnpm@latest --activate

# 로컬 Supabase 스택 (Docker 런타임은 colima)
colima start                 # 최초 1회: brew install colima docker
npx supabase start           # Postgres·Auth·Storage·Studio
pnpm seed                    # admin·member 계정 + 콘텐츠 시드 (멱등)
                             # admin@seogyeong.kr / admin1234

# 개발 서버
pnpm dev       # http://localhost:3000  (.env.local의 Supabase 키 사용)

# 빌드 / 린트 / 타입
pnpm build
pnpm lint
pnpm db:types  # database.types.ts 재생성
```

> 로컬은 Supabase CLI 스택으로 무료, 운영은 Vercel + Supabase Pro($25/월). 정지: `npx supabase stop && colima stop`.

## 폴더 구조

```
spec/
├── CLAUDE.md          ← 프로젝트 헌법·규칙 (Claude Code 자동 로드)
├── README.md          ← 이 파일
├── TODO.md            ← 작업 큐 + 후속 작업 프롬프트
├── deploy/            ← 배포 런북 (Vercel + Supabase)
├── supabase/          ← DB 마이그레이션·config.toml (로컬 CLI 스택)
├── docs/
│   └── superpowers/
│       ├── plans/     ← 작업 plan 기록 (날짜별)
│       └── specs/     ← 설계 문서 (브레인스토밍 결과)
├── package.json · tsconfig.json · next.config.ts  ← 앱 설정 (pnpm)
├── public/            ← 정적 자산
├── scripts/           ← 빌드·시드 스크립트
└── src/               ← Next.js 16 풀스택 앱 소스 (루트에 바로 위치, web/ 래퍼 없음)
    ├── app/           ← App Router (UI 라우트 + api/ Route Handlers)
    ├── server/        ← 서버 전용(백엔드): auth/ · services/ · actions/ · supabase/ · uploads/
    ├── lib/           ← 클라이언트·공용 (api.ts 래퍼, dto/, 유틸)
    └── proxy.ts       ← 미들웨어 (Next 16: middleware→proxy)
```

## 진행 현황

- [x] **랜딩페이지** — `src/app/page.tsx` (디자인 100% 보존, 휠 스크롤로 메인 진입)
- [x] **신학원웹진** — `src/app/webzine/` (mock 단계)
- [ ] 메인페이지·공통 레이아웃 (디자인 이식 진행 중)
- [x] **아키텍처 재설계** — Oracle/Drizzle → Supabase + Vercel 전환
- [x] **Supabase 마이그레이션** — 스키마·RLS·Auth·Storage·supabase-js (로컬 e2e 검증)
- [ ] Supabase Pro 결제 + Vercel 배포

전체 작업 큐는 [`TODO.md`](./TODO.md) 참조.

## 작업 흐름

신규 작업 시 (자세한 규칙은 [`CLAUDE.md`](./CLAUDE.md) "작업 흐름" 참조):

1. `TODO.md` 또는 `docs/superpowers/plans/YYYY-MM-DD-<주제>.md` 에 plan 작성
2. `feat/<주제>` 브랜치 생성 (main 직접 커밋 금지)
3. 구현 → 빌드/검증 → 커밋 (Conventional Commits prefix + 한국어 본문)
4. PR 작성 → 리뷰 → 머지 → 브랜치 삭제

## 라이선스 / 문의

서경노회 교육부 내부 프로젝트. 공식 문의는 노회 교육부 담당자에게.
