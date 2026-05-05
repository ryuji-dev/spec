# 서경노회 교육부 공식 홈페이지

서경노회 교육부의 공식 홈페이지 — 교사 강습회·성경고사·찬양대회 안내와 주일학교 교육 자료를 제공하는 노회 차원의 교육 행정 포털.

## 기술 스택

- **프론트엔드**: Next.js 16 (App Router, TypeScript strict, Tailwind CSS, src/, pnpm)
- **백엔드**: PHP 8.x + MySQL — 로컬 APM 서버(`recpc`)에 배포 예정
- **호스팅**: 프론트는 Vercel, 백엔드는 `recpc`(Cloudflare Tunnel로 외부 노출)
- **통신 규약**: REST/JSON + JWT(Bearer) + CORS 화이트리스트 (자세한 사항은 [`CLAUDE.md`](./CLAUDE.md) 참조)

## 빠른 시작

```bash
# 의존성 설치
cd frontend
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
├── docs/
│   └── superpowers/
│       ├── plans/     ← 작업 plan 기록 (날짜별)
│       └── specs/     ← 설계 문서 (브레인스토밍 결과)
├── frontend/          ← Next.js 16
│   ├── src/app/       ← App Router 페이지
│   ├── public/        ← 정적 자산 (이미지·폰트 등)
│   └── _design/       ← Claude Design 핸드오프 원본 (gitignore)
└── backend/           ← (예정) PHP 8.x + MySQL
```

## 진행 현황

- [x] **랜딩페이지** — `frontend/src/app/page.tsx` (PR #1, 디자인 100% 보존, 휠 스크롤로 메인 진입)
- [ ] 메인페이지 (다음 PR)
- [ ] 백엔드 골격 (`backend/` PHP) — TODO #3
- [ ] DB 스키마, 인증, 게시물 CRUD — TODO #4–6
- [ ] 배포 (Vercel + recpc + Cloudflare Tunnel) — TODO #8

전체 작업 큐는 [`TODO.md`](./TODO.md) 참조.

## 작업 흐름

신규 작업 시 (자세한 규칙은 [`CLAUDE.md`](./CLAUDE.md) "작업 흐름" 참조):

1. `TODO.md` 또는 `docs/superpowers/plans/YYYY-MM-DD-<주제>.md` 에 plan 작성
2. `feat/<주제>` 브랜치 생성 (main 직접 커밋 금지)
3. 구현 → 빌드/검증 → 커밋 (Conventional Commits prefix + 한국어 본문)
4. PR 작성 → 리뷰 → 머지 → 브랜치 삭제

## 라이선스 / 문의

서경노회 교육부 내부 프로젝트. 공식 문의는 노회 교육부 담당자에게.
