# Phase 5 — Oracle VM 배포 자산·런북 설계

작성일: 2026-06-02
대상 브랜치: `chore/phase5-deploy`

## 배경 / 목표

교육위원회·자료공유 두 섹션 + 업로드/포맷 공통화가 완료됐다(PR #19~24 머지). 이제 완성된 앱을 **Oracle Cloud Always Free ARM VM 1대에 Docker Compose로 올인원 배포**(web + postgres + caddy)할 수 있도록 만든다.

Phase 1에서 인프라 골격(`docker-compose.yml`·`web/Dockerfile`·`deploy/Caddyfile`·`deploy/README.md`)이 정의됐으나, **완성된 앱 기준으로 빠진 부분**이 있다:
- DB 마이그레이션 적용 절차 없음(standalone 런너엔 drizzle-kit·migrations 미포함)
- 운영 초기 admin 시드 전략 없음(dev는 admin1234 — 운영 부적합)
- 실 PostgreSQL 대상 동작 미검증

### 환경/제약 (확정)
- **VM·도메인 미준비** → 이번 작업은 **배포 자산 + 런북 준비**까지. 실제 배포(프로비저닝·DNS·`docker compose up`)는 사용자가 VM 준비 후 런북대로 수행.
- **로컬 Docker 미설치** → 컨테이너 빌드·compose 스택은 이 머신에서 end-to-end 검증 불가. 마이그레이션/시드 스크립트는 PGlite 소켓(postgres-js 접속)으로 검증 가능. 컨테이너 빌드 검증은 VM 최초 빌드 시 수행(런북 명시).

### 확정된 결정 (사용자 승인)
| 항목 | 결정 |
|------|------|
| 범위 | 배포 자산·런북 준비 (실 배포는 VM 준비 후) |
| 마이그레이션 | 전용 `migrate.mjs`(postgres-js + `__migrations` 추적, 멱등) + compose one-shot |
| 운영 admin | `seed-admin.mjs`(SEED_ADMIN_EMAIL/PASSWORD env, argon2, 멱등) |
| 컨테이너 빌드 검증 | 로컬 불가 — 정적 점검 + 런북에 VM 검증 명시 |

## 아키텍처

운영 스택은 기존 compose 골격을 유지하되 **마이그레이션·시드 일회성 단계**를 추가한다.

```
[Caddy :80/:443]  ──reverse_proxy──>  [web :3000 (Next standalone)]  ──>  [postgres :5432 (내부망)]
   자동 HTTPS                              uploads volume                      pgdata volume
        │
   (배포 시 1회) docker compose run --rm migrate  →  migrate.mjs(스키마) + seed-admin.mjs(최초 admin)
```

- web/postgres 포트는 외부 비노출(Caddy·내부망만). 80/443만 개방.
- 마이그레이션·시드는 web 이미지를 재사용한 일회성 실행(별도 빌드 없음).

## 컴포넌트

### 1. `web/scripts/migrate.mjs` (운영 마이그레이션 — 멱등)
- postgres-js로 `DATABASE_URL` 접속.
- `src/server/db/migrations/` 의 `*.sql`을 **파일명 정렬** 순서로 적용.
- **`__migrations`(applied_name text pk, applied_at timestamptz) 추적 테이블**을 `CREATE TABLE IF NOT EXISTS`로 보장하고, 각 SQL은 미적용분만 트랜잭션으로 적용 후 기록 → **재배포 시 멱등**(이미 적용분 스킵).
- drizzle-kit 불필요(standalone 런너의 `node` + traced `postgres`로 동작). dev-db.mjs의 "SQL exec" 방식 + 운영용 추적 추가.
- 성공/스킵 건수 로그.

### 2. `web/scripts/seed-admin.mjs` (운영 초기 admin)
- postgres-js + `@node-rs/argon2`.
- `SEED_ADMIN_EMAIL`·`SEED_ADMIN_PASSWORD`(env) 필수. 둘 중 없으면 명확한 에러로 종료(운영 안전 — 무작위/기본 비번 금지).
- 해당 이메일 admin이 이미 있으면 skip, 없으면 argon2 해시로 `role='admin'` 생성.
- 멱등(재실행 안전).

### 3. `web/Dockerfile` (runner 보강)
- runner 스테이지에 다음을 추가 COPY:
  - `src/server/db/migrations/` → `/app/migrations/` (migrate.mjs가 읽음)
  - `scripts/migrate.mjs`·`scripts/seed-admin.mjs` → `/app/scripts/`
- web 실행은 기존 `CMD ["node","server.js"]`(standalone) 유지.
- `postgres`·`@node-rs/argon2`는 앱(getDb·password)에서 쓰여 standalone에 trace됨 → 스크립트 import 해결됨. (검증: build 후 traced node_modules 확인은 VM에서. 로컬은 import 경로 정합성까지.)
- migrate.mjs가 읽을 migrations 경로는 환경에 맞춰 `/app/migrations`(runner) 기준. (스크립트는 `process.cwd()` 기준 상대경로로 두되, dev에서는 `web/src/server/db/migrations`, 런너에서는 `/app/migrations` — 경로를 env(`MIGRATIONS_DIR`) 또는 인자로 받아 양쪽 대응. 기본값은 런너 기준 `migrations`, dev 검증 시 인자/ env로 지정.)

### 4. `docker-compose.yml` (migrate 일회성 서비스)
- `migrate` 서비스 추가: `build: ./web`(web 이미지 재사용), `command`로 `node scripts/migrate.mjs && node scripts/seed-admin.mjs` 실행, `environment`에 DATABASE_URL·SEED_ADMIN_*·MIGRATIONS_DIR, `depends_on: postgres(healthy)`, `profiles: ["migrate"]`(일반 `up`에선 안 뜨고 `docker compose run --rm migrate` 또는 `--profile migrate up migrate`로만 실행).
- 기존 web/postgres/caddy·volumes·healthcheck 유지.

### 5. `deploy/README.md` (완전한 런북)
순서: ① OCI ARM VM 프로비저닝(shape·이미지·보안목록 80/443·SSH 제한) → ② Docker/compose 설치 → ③ clone → ④ `.env` 작성(SITE_ADDRESS·POSTGRES_USER/PASSWORD/DB·DATABASE_URL·JWT_SECRET·SEED_ADMIN_EMAIL/PASSWORD; 시크릿 생성 `openssl rand -base64 48`) → ⑤ `docker compose up -d --build` → ⑥ `docker compose run --rm migrate`(스키마+admin) → ⑦ DNS A레코드 → Caddy HTTPS 자동 발급 확인 → ⑧ 동작 확인(/, /committee, /resources, /login·/admin) → ⑨ 백업·운영 체크리스트(pg_dump cron, uploads 볼륨 백업, JWT 로테이션, OCI 한도 모니터링).
- `.env`는 gitignore. 시크릿 커밋 금지.

## 검증 (지금 가능 / 나중)
**지금(PGlite 소켓 + 정적):**
- `pnpm dev:db`로 빈 PGlite(PG 와이어) 띄우고, `migrate.mjs`를 그 DATABASE_URL로 실행 → `__migrations` 생성·0000/0001 적용·테이블 생성 확인 → **재실행 시 "0건 적용(스킵)"** 멱등 확인.
- `seed-admin.mjs`를 SEED_ADMIN_* 지정해 실행 → admin 생성 → 재실행 skip → (선택) `auth:verify` 류로 argon2 해시 검증 또는 로그인 e2e.
- `pnpm build`·`pnpm lint` 통과. Dockerfile/compose는 정적 점검(문법·COPY 경로·command).
- 기존 `db/committee/uploads/resource:verify` 회귀.

**나중(VM):** `docker compose up --build`로 ARM 빌드(@node-rs/argon2·sharp arm64 prebuild), migrate 일회성, 도메인 HTTPS, 실 PostgreSQL 동작.

## 범위 밖 (후속)
- 실제 VM 프로비저닝·DNS·배포 실행(사용자).
- CI/CD 자동화, 무중단 배포, 오브젝트 스토리지 백업 자동화.
- 모니터링/알림, 로그 수집.
- 다른 섹션(자유게시판·수련회·웹진·교수소개) 기능 — 별도.

## 비고
- migrate.mjs의 `__migrations` 추적은 drizzle-kit의 `__drizzle_migrations`와 별개다. 이 프로젝트는 dev에서 SQL을 직접 적용(dev-db)하고 drizzle-kit은 SQL 생성에만 쓰므로, 운영 적용기를 자체 추적으로 두는 것이 일관적이다. (향후 drizzle-kit migrate로 통일하려면 추적 테이블 일원화 필요 — 후속.)
