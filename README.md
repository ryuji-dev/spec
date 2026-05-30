# 서경노회 교육위원회 홈페이지

서경노회 교육위원회 홈페이지 — 교사 강습회·성경고사·찬양대회 안내와 주일학교 교육 자료를 제공하는 노회 차원의 교육 행정 포털.

## 기술 스택

- **앱**: Next.js 16 풀스택 (App Router, TypeScript strict, Tailwind CSS, src/, pnpm) — 프론트·백엔드 단일 앱
- **백엔드**: 같은 앱 안의 Server Actions·Route Handlers + `src/server/` 서버 전용 계층
- **DB**: PostgreSQL (Drizzle ORM)
- **인증**: 경량 커스텀 세션 (httpOnly 쿠키 + JWT)
- **배포**: Oracle Cloud Always Free ARM VM 1대에 Docker Compose(`web` + `postgres` + `caddy`)
- 자세한 규약·보안 기본기는 [`CLAUDE.md`](./CLAUDE.md) 참조

## 빠른 시작

```bash
# 의존성 설치
cd web
pnpm install   # pnpm 미설치 시: corepack enable && corepack prepare pnpm@latest --activate

# 개발 서버
pnpm dev       # http://localhost:3000

# 빌드 / 린트
pnpm build
pnpm lint
```

## 폴더 구조

```
spec/
├── CLAUDE.md          ← 프로젝트 헌법·규칙 (Claude Code 자동 로드)
├── README.md          ← 이 파일
├── TODO.md            ← 작업 큐 + 후속 작업 프롬프트
├── docker-compose.yml ← web + postgres + caddy 오케스트레이션
├── deploy/            ← 배포 자산 (Caddyfile, OCI VM 셋업 메모)
├── docs/
│   └── superpowers/
│       ├── plans/     ← 작업 plan 기록 (날짜별)
│       └── specs/     ← 설계 문서 (브레인스토밍 결과)
└── web/               ← Next.js 16 풀스택 앱
    └── src/
        ├── app/       ← App Router (UI 라우트 + api/ Route Handlers)
        ├── server/    ← 서버 전용(백엔드): db/ · auth/ · services/ · actions/
        └── lib/       ← 클라이언트·공용 (api.ts 래퍼, dto/, 유틸)
```

## 진행 현황

- [x] **랜딩페이지** — `web/src/app/page.tsx` (디자인 100% 보존, 휠 스크롤로 메인 진입)
- [x] **신학원웹진** — `web/src/app/webzine/` (mock 단계)
- [ ] 메인페이지·공통 레이아웃 (디자인 이식 진행 중)
- [x] **아키텍처 재설계** — Oracle VM + Next.js 풀스택 + PostgreSQL/Drizzle
- [ ] 인프라 골격 (docker-compose · Caddy) — Phase 1
- [ ] DB 스키마·인증·게시물 CRUD — Phase 2~4 (디자인 이식 완료 후)
- [ ] Oracle ARM VM 배포 — Phase 5

전체 작업 큐는 [`TODO.md`](./TODO.md) 참조.

## 작업 흐름

신규 작업 시 (자세한 규칙은 [`CLAUDE.md`](./CLAUDE.md) "작업 흐름" 참조):

1. `TODO.md` 또는 `docs/superpowers/plans/YYYY-MM-DD-<주제>.md` 에 plan 작성
2. `feat/<주제>` 브랜치 생성 (main 직접 커밋 금지)
3. 구현 → 빌드/검증 → 커밋 (Conventional Commits prefix + 한국어 본문)
4. PR 작성 → 리뷰 → 머지 → 브랜치 삭제

## 라이선스 / 문의

서경노회 교육부 내부 프로젝트. 공식 문의는 노회 교육부 담당자에게.
