# Oracle Cloud 전환 + Next.js 풀스택 아키텍처 재설계

> 실행 plan. 원본 승인 plan: `~/.claude/plans/spec-quiet-peacock.md`.
> 헌법(원칙·규약)의 진실의 원천은 `CLAUDE.md`.

## Context (왜 이 변경을 하는가)

기존 설계는 **프론트(Next.js, Vercel) + 백엔드(PHP 8.x + MySQL, 로컬 `recpc` APM)** 의 2-언어·2-저장소 구조였다. 백엔드 저장소를 어디에 둘지 결정하지 못해 작업이 멈춰 있었다.

**Oracle Cloud Always Free**의 핵심은 "DB 200GB"가 아니라 **직접 운영하는 ARM VM 1대(4 OCPU / 24GB RAM / 200GB 블록 스토리지)를 상시 무료로 받는 것**이다. 즉 `recpc`(로컬)를 대체하는 **24시간 가동 클라우드 서버**가 생긴다.

서버 한 대로 충분하므로 PHP와 TS 두 언어를 유지보수할 이유가 사라진다. **Next.js 하나로 프론트·백엔드를 통합**하면 1인·무료·비영리 운영에 가장 잘 맞는다.

### 확정된 결정 (사용자 승인 완료)

| 항목 | 결정 |
|------|------|
| 스택 | **Next.js 풀스택** (Route Handler + Server Action). PHP 폐기 |
| 배포 | **Oracle ARM VM 올인원** — Next.js + DB + 업로드를 Docker Compose 한 대에 |
| DB 엔진 | **PostgreSQL** (기존 MySQL 결정 변경) |
| ORM | **Drizzle** + drizzle-kit |
| 인증 | **경량 커스텀 세션** — httpOnly 쿠키 + jose(JWT), 비밀번호 해시 |
| 리버스 프록시 | **Caddy** (자동 HTTPS) |
| 폴더명 | `frontend/` → **`web/`** 리네임 |

---

## 목표 폴더 구조

> CLAUDE.md 규칙 "빈 placeholder 파일 금지" — 트리는 **목표 청사진**이며, 각 파일은 구현 시점에 생성한다.

```
spec/
├── CLAUDE.md                   # 헌법 — 스택/규약 섹션 재작성
├── README.md                   # 외부 소개 갱신
├── TODO.md                     # Phase 재정의
├── docker-compose.yml          # web + postgres + caddy 오케스트레이션
├── .env                        # (gitignore) 루트 인프라 env — DB 비번·JWT 시크릿 등
├── deploy/                     # 배포 자산
│   ├── Caddyfile               # 도메인·자동 TLS·프록시
│   └── README.md               # OCI VM 프로비저닝·배포 절차 메모
├── docs/superpowers/{plans,specs}
├── .claude/
└── web/                        # 단일 Next.js 풀스택 앱
    ├── Dockerfile              # standalone 빌드 → 경량 런타임 이미지
    ├── drizzle.config.ts       # 스키마·마이그레이션 경로 설정 (Phase 2)
    ├── next.config.ts          # output: 'standalone'
    ├── package.json
    ├── public/
    ├── uploads/                # (gitignore) 업로드 저장. compose 볼륨 마운트
    └── src/
        ├── middleware.ts       # 인증 가드
        ├── app/                # App Router (UI + API 라우트)
        │   ├── (public)/       # 비로그인 영역 라우트 그룹
        │   ├── (admin)/        # 관리자 영역 라우트 그룹
        │   ├── api/            # Route Handlers — 클라이언트 fetch·업로드 전용
        │   ├── _components/    # 기존 공용 컴포넌트 유지
        │   └── layout.tsx
        ├── server/             # 서버 전용(백엔드) — 'server-only'
        │   ├── db/             # index.ts(drizzle 클라이언트), schema/, migrations/
        │   ├── auth/           # session.ts(jose), password.ts(해시)
        │   ├── services/       # 도메인 로직 — DB 접근 캡슐화
        │   └── actions/        # Server Actions('use server') — 폼 mutation
        └── lib/                # 클라이언트·공용 (client-safe만)
            ├── api.ts          # 클라이언트 fetch 래퍼 (Route Handler 호출용)
            ├── dto/            # 공용 타입 + zod 스키마
            └── device.ts       # 기존 유지
```

### 핵심 경계 원칙
- **`server/`** = 서버 전용. `import 'server-only'`로 클라이언트 번들 유입 차단. DB·시크릿·해시는 여기서만.
- **`lib/`** = 클라이언트 import 가능한 것만 (타입·zod 스키마·fetch 래퍼·유틸).
- **`app/`** = 라우팅·UI. 데이터는 `server/services`(읽기) 또는 `server/actions`(쓰기)에서.

### 데이터 흐름
1. **읽기**: Server Component → `server/services/*` → `server/db` 직접 조회. HTTP hop 없음. mock `lib/*-data.ts` → services로 점진 교체.
2. **쓰기**: 폼 → `server/actions/*` → service → db. zod 입력 검증.
3. **클라이언트 fetch 필요 시**: `app/api/*/route.ts` + `lib/api.ts` 래퍼.
4. **인증**: `middleware.ts`가 `(admin)` 가드 → `server/auth/session.ts` 쿠키 검증.

---

## 단계별 로드맵

> CLAUDE.md 규칙: **"디자인 이식이 끝나기 전까지 백엔드 작업은 시작하지 않음."** Phase 2 이후(백엔드 로직)는 디자인 이식 완료 후 착수. 지금 실행: Phase 0~1.

- **Phase 0 — 결정의 문서화 (지금)**: CLAUDE.md/README/TODO 갱신, `frontend`→`web` 리네임, `next.config` standalone, plan 문서화.
- **Phase 1 — 인프라 골격 (지금)**: `docker-compose.yml`·`web/Dockerfile`·`deploy/Caddyfile`·`uploads` gitignore. 로컬 `docker compose`로 postgres+web 기동 확인.
- **Phase 2 — 데이터 계층 (게이트 후)**: drizzle deps·config, `server/db`·`schema/`·마이그레이션. mock → services 교체.
- **Phase 3 — 인증 (게이트 후)**: jose·해시·로그인·`middleware.ts` 가드·admin 전용 가입.
- **Phase 4 — CRUD + 업로드 (게이트 후)**: Server Action/Route Handler, 업로드(화이트리스트·MIME·용량·파일명 재생성).
- **Phase 5 — Oracle VM 배포 (게이트 후)**: OCI ARM VM → Docker → compose 배포 → Caddy TLS → 방화벽.

### 백엔드 의존성은 사용 시점에 추가 (placeholder 금지 원칙)
- `drizzle-orm`/`drizzle-kit`/`postgres` → Phase 2
- `jose`/`zod`/argon2 해시 → Phase 3
- Phase 0~1에서는 unused 의존성을 미리 깔지 않는다.

---

## Verification

- **Phase 0**: `cd web && pnpm install && pnpm build` 통과(standalone 출력), `pnpm lint` 통과. CLAUDE.md/TODO.md가 새 스택과 모순 없는지 통독.
- **Phase 1**: `docker compose up -d`로 postgres 헬스체크 + web `:3000` 응답 + Caddy 경유 확인. `docker compose down -v` 정리.
- **Phase 2+** (게이트 후): 마이그레이션 적용 후 서버 컴포넌트가 DB 데이터 렌더, 인증 가드가 미로그인 시 `(admin)` 차단 확인.

> Next.js 16 breaking change(standalone·middleware 런타임·Server Action)는 구현 직전 `web/node_modules/next/dist/docs/` 확인 — `web/AGENTS.md` 규칙.
