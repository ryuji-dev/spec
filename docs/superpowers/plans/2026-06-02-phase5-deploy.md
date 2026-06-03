# Phase 5 — 배포 자산·런북 구현 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 완성된 앱을 Oracle ARM VM에 Docker Compose로 올인원 배포할 수 있도록 운영 마이그레이션·시드 스크립트, Dockerfile/compose 보완, 배포 런북을 완성한다. (VM 미준비 → 자산·런북까지. 실 배포는 사용자가 런북대로.)

**Architecture:** 운영 마이그레이션은 postgres-js로 `migrations/*.sql`을 `__migrations` 추적 테이블 기반 멱등 적용(drizzle-kit 불필요, standalone 런너 동작). 초기 admin은 env 기반 멱등 시드. compose에 일회성 `migrate` 서비스(web 이미지 재사용). 마이그레이션/시드는 자체 PGlite 소켓 e2e로 검증(컨테이너 빌드는 로컬 Docker 부재로 VM에서 검증).

**Tech Stack:** Next.js 16(standalone), PostgreSQL 17, postgres-js, @node-rs/argon2, Docker Compose, Caddy, PGlite(검증).

**검증 방식:** `scripts/verify-migrate.mjs`(빈 PGlite 소켓에 migrate→seed를 실제 스크립트로 e2e, 멱등 포함) + `pnpm build`/`lint` + Dockerfile/compose 정적 점검 + 기존 verify 회귀.

**범위 밖:** 실제 VM 프로비저닝·DNS·`docker compose up`(사용자), 컨테이너 빌드 런타임 검증(VM), CI/CD.

---

## File Structure

- `web/scripts/migrate.mjs` — 운영 마이그레이션(멱등) (신규)
- `web/scripts/seed-admin.mjs` — env 기반 초기 admin 시드(멱등) (신규)
- `web/scripts/verify-migrate.mjs` — 빈 PGlite 소켓 e2e 검증 (신규)
- `web/package.json` — `migrate:prod`·`seed:admin`·`deploy:verify` 스크립트 (수정)
- `web/Dockerfile` — runner에 `migrations/`·`scripts/` COPY (수정)
- `docker-compose.yml` — `migrate` one-shot 서비스(profiles) (수정)
- `deploy/README.md` — 완전한 배포 런북 (재작성)

---

## Task 1: migrate.mjs + seed-admin.mjs + package.json

**Files:** Create `web/scripts/migrate.mjs`, `web/scripts/seed-admin.mjs`; Modify `web/package.json`.

- [ ] **Step 1: 운영 마이그레이션 스크립트** — `web/scripts/migrate.mjs`:

```js
// 운영 DB 마이그레이션 — postgres-js로 migrations/*.sql을 멱등 적용.
// 추적: __migrations(applied_name) 테이블. 이미 적용분은 스킵 → 재배포 안전.
//   실행: node scripts/migrate.mjs  (DATABASE_URL 필수, MIGRATIONS_DIR 기본 "migrations")
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("migrate: DATABASE_URL 환경변수가 필요합니다.");
  process.exit(1);
}
const dir = process.env.MIGRATIONS_DIR ?? "migrations";

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  await sql`create table if not exists __migrations (
    applied_name text primary key,
    applied_at timestamptz not null default now()
  )`;
  const rows = await sql`select applied_name from __migrations`;
  const applied = new Set(rows.map((r) => r.applied_name));

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let n = 0;
  for (const f of files) {
    if (applied.has(f)) continue;
    const ddl = readFileSync(join(dir, f), "utf8");
    // drizzle 생성 SQL은 "--> statement-breakpoint"로 문장 구분
    const statements = ddl
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    await sql.begin(async (tx) => {
      for (const stmt of statements) await tx.unsafe(stmt);
      await tx`insert into __migrations (applied_name) values (${f})`;
    });
    console.log(`migrate: 적용 ${f}`);
    n++;
  }
  console.log(n === 0 ? "migrate: 최신 상태(적용 0건)" : `migrate: ${n}건 적용 완료`);
} finally {
  await sql.end();
}
```

- [ ] **Step 2: 초기 admin 시드 스크립트** — `web/scripts/seed-admin.mjs`:

```js
// 운영 초기 admin 시드 — env 기반, 멱등. argon2 해시.
//   실행: node scripts/seed-admin.mjs  (DATABASE_URL·SEED_ADMIN_EMAIL·SEED_ADMIN_PASSWORD 필수)
import postgres from "postgres";
import argon2 from "@node-rs/argon2";

const url = process.env.DATABASE_URL;
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!url || !email || !password) {
  console.error(
    "seed-admin: DATABASE_URL·SEED_ADMIN_EMAIL·SEED_ADMIN_PASSWORD 환경변수가 모두 필요합니다.",
  );
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const existing = await sql`select 1 from users where email = ${email} limit 1`;
  if (existing.length > 0) {
    console.log(`seed-admin: 이미 존재 — ${email} (건너뜀)`);
  } else {
    const hash = await argon2.hash(password);
    await sql`insert into users (email, password_hash, name, role)
              values (${email}, ${hash}, '관리자', 'admin')`;
    console.log(`seed-admin: admin 생성 — ${email}`);
  }
} finally {
  await sql.end();
}
```

- [ ] **Step 3: package.json 스크립트 추가** — `web/package.json`의 `scripts`에 추가:
```json
    "migrate:prod": "node scripts/migrate.mjs",
    "seed:admin": "node scripts/seed-admin.mjs",
    "deploy:verify": "node scripts/verify-migrate.mjs",
```

- [ ] **Step 4: 빌드/린트** — `cd web && pnpm build && pnpm lint`. 성공(스크립트는 빌드 대상 아님 — 빌드는 앱 무변경 확인용). 다음 task에서 런타임 검증.

- [ ] **Step 5: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/scripts/migrate.mjs web/scripts/seed-admin.mjs web/package.json
git commit -m "feat: 운영 마이그레이션·초기 admin 시드 스크립트 추가"
```
(트레일러: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 2: verify-migrate.mjs (빈 PGlite 소켓 e2e)

**Files:** Create `web/scripts/verify-migrate.mjs`.

- [ ] **Step 1: 검증 스크립트** — `web/scripts/verify-migrate.mjs`:

```js
// 배포 스크립트 e2e 검증 — 빈 PGlite를 PG 와이어 소켓(127.0.0.1:5434)으로 띄우고
// 실제 migrate.mjs·seed-admin.mjs를 child process로 실행해 멱등성까지 확인. Docker 불필요.
//   실행: pnpm deploy:verify
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "../src/server/db/migrations");
const PORT = 5434;
const URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`;

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};
const runScript = (script, extraEnv) =>
  execFileSync("node", [join(here, script)], {
    env: { ...process.env, DATABASE_URL: URL, MIGRATIONS_DIR: migrationsDir, ...extraEnv },
    encoding: "utf8",
  });

const db = await PGlite.create(); // 빈 인메모리 DB (마이그레이션 미적용)
const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });
await server.start();
try {
  // 1) migrate 최초 실행 → 0000/0001 적용
  const out1 = runScript("migrate.mjs");
  assert(/적용 2건 완료/.test(out1), "migrate 최초 실행 2건 적용");

  // 2) 스키마 생성 확인 (검증용 별도 연결)
  const sql = postgres(URL, { max: 1, onnotice: () => {} });
  const tables = (
    await sql`select table_name from information_schema.tables where table_schema='public' order by table_name`
  ).map((r) => r.table_name);
  assert(
    ["attachments", "comments", "posts", "users", "__migrations"].every((t) => tables.includes(t)),
    `핵심 테이블 + __migrations 생성 (${tables.join(", ")})`,
  );

  // 3) migrate 재실행 → 멱등(0건)
  const out2 = runScript("migrate.mjs");
  assert(/적용 0건/.test(out2), "migrate 재실행 멱등(0건)");

  // 4) seed-admin 최초 → admin 생성
  const outS1 = runScript("seed-admin.mjs", {
    SEED_ADMIN_EMAIL: "deploy@test.kr",
    SEED_ADMIN_PASSWORD: "deploy-pw-1234",
  });
  assert(/admin 생성/.test(outS1), "seed-admin 최초 생성");
  const admin = await sql`select role, left(password_hash,9) as h from users where email='deploy@test.kr'`;
  assert(admin[0]?.role === "admin" && admin[0]?.h === "$argon2id", "admin role·argon2id 해시");

  // 5) seed-admin 재실행 → skip
  const outS2 = runScript("seed-admin.mjs", {
    SEED_ADMIN_EMAIL: "deploy@test.kr",
    SEED_ADMIN_PASSWORD: "deploy-pw-1234",
  });
  assert(/건너뜀/.test(outS2), "seed-admin 재실행 멱등(skip)");

  // 6) 필수 env 누락 → 실패 종료
  let failed = false;
  try {
    execFileSync("node", [join(here, "seed-admin.mjs")], {
      env: { ...process.env, DATABASE_URL: URL },
      encoding: "utf8",
    });
  } catch {
    failed = true;
  }
  assert(failed, "seed-admin: SEED_ADMIN_* 누락 시 비정상 종료");

  await sql.end();
  console.log("\n✅ 배포 스크립트 검증 통과");
} finally {
  await server.stop();
  await db.close();
}
```

- [ ] **Step 2: 검증 실행** — Run: `cd web && pnpm deploy:verify`
Expected: 6개 `✓` 후 `✅ 배포 스크립트 검증 통과`. (포트 5434 사용 — 5432 dev:db와 충돌 없음.)
- 만약 PGlite 소켓이 트랜잭션/순차연결에서 문제를 내면(ECONNRESET 등) 보고. 대안: migrate를 `sql.begin` 대신 단순 순차 적용으로 조정(멱등 추적은 유지).

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/scripts/verify-migrate.mjs
git commit -m "test: 배포 마이그레이션·시드 PGlite 소켓 e2e 검증 추가"
```

---

## Task 3: Dockerfile runner 보강

**Files:** Modify `web/Dockerfile`.

- [ ] **Step 1: runner에 migrations + scripts COPY** — `web/Dockerfile`의 runner 스테이지에서 `COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static` **다음**, `RUN mkdir -p /app/uploads ...` **앞**(또는 그 근처)에 추가:
```dockerfile
# 운영 마이그레이션·시드 스크립트와 마이그레이션 SQL (standalone에 미포함 → 별도 복사)
COPY --from=builder /app/src/server/db/migrations ./migrations
COPY --from=builder /app/scripts/migrate.mjs /app/scripts/seed-admin.mjs ./scripts/
```
(standalone node_modules에 `postgres`·`@node-rs/argon2`가 trace됨 → 스크립트 import 해결. web 실행 CMD는 기존 `node server.js` 유지.)

- [ ] **Step 2: 정적 점검** — Dockerfile 문법·COPY 경로 검토:
  - builder는 `COPY . .` 후 `pnpm build` → `/app/src/server/db/migrations`·`/app/scripts/*` 존재.
  - runner 최종 트리: `/app/server.js`(standalone), `/app/.next/static`, `/app/public`, `/app/migrations`, `/app/scripts/`, `/app/node_modules`(traced).
  - `node scripts/migrate.mjs`는 cwd `/app` → `MIGRATIONS_DIR` 기본 `migrations` = `/app/migrations` 해석. (compose에서 명시도 함.)
  - **로컬 Docker 없음 → 실 빌드 미검증.** 이 점검은 경로·문법 정합성까지. (VM 최초 `docker compose up --build`에서 실검증 — 런북 명시.)

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/Dockerfile
git commit -m "feat: Docker runner에 마이그레이션·시드 자산 포함"
```

---

## Task 4: docker-compose migrate 서비스

**Files:** Modify `docker-compose.yml`.

- [ ] **Step 1: migrate 일회성 서비스 추가** — `docker-compose.yml`의 `web` 서비스 **다음**, `caddy` **앞**에 추가:
```yaml
  # 일회성 마이그레이션·초기 admin 시드. `docker compose run --rm migrate`로 실행.
  # profiles로 일반 `up`에서는 기동하지 않음.
  migrate:
    build:
      context: ./web
    environment:
      DATABASE_URL: ${DATABASE_URL:-postgres://seogyeong:devpassword@postgres:5432/seogyeong}
      MIGRATIONS_DIR: /app/migrations
      SEED_ADMIN_EMAIL: ${SEED_ADMIN_EMAIL:-}
      SEED_ADMIN_PASSWORD: ${SEED_ADMIN_PASSWORD:-}
    command: ["sh", "-c", "node scripts/migrate.mjs && node scripts/seed-admin.mjs"]
    depends_on:
      postgres:
        condition: service_healthy
    profiles: ["migrate"]
```
(`web` 이미지를 그대로 재사용 — build context 동일. `profiles: ["migrate"]`라 `docker compose up -d`엔 안 뜨고, `docker compose run --rm migrate`로만 실행됨.)

- [ ] **Step 2: 정적 점검** — YAML 문법·서비스 참조 확인:
  - `migrate`는 `postgres` healthy 후 실행, web 이미지 재사용(중복 빌드는 캐시로 빠름).
  - `SEED_ADMIN_*` 기본값 빈 문자열 → 미지정 시 seed-admin이 에러 종료(의도 — .env에 반드시 지정). migrate는 항상 동작.
  - 기존 web/postgres/caddy·volumes·healthcheck 무변경 확인.
  - (선택) YAML 파서로 점검: `cd <root> && python3 -c "import yaml; yaml.safe_load(open('docker-compose.yml'))" && echo OK` (PyYAML 있으면).

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add docker-compose.yml
git commit -m "feat: compose 일회성 migrate 서비스(마이그레이션+admin 시드) 추가"
```

---

## Task 5: deploy/README 런북 재작성

**Files:** Modify `deploy/README.md`.

- [ ] **Step 1: 런북 재작성** — `deploy/README.md`를 다음으로 교체:

````markdown
# 배포 — Oracle Cloud Always Free ARM VM

완성된 앱(web + postgres + caddy)을 Oracle Cloud 상시 무료 **ARM 컴퓨트 VM 1대**에 Docker Compose로 올인원 배포한다.

> **중요:** 오라클의 관리형 DB(Autonomous Database)를 쓰지 않는다. PostgreSQL은 VM 안의 **Docker 컨테이너**로 직접 돌아간다. 오라클에서 "DB 생성"은 필요 없고, **ARM 컴퓨트 VM**만 있으면 된다. (이 compose 스택은 오라클 전용이 아니며 어떤 리눅스 호스트에서도 동일하게 동작한다.)

## 1. VM 프로비저닝 (OCI 콘솔)
- **Shape**: `VM.Standard.A1.Flex` (ARM Ampere) — Always Free 최대 4 OCPU / 24GB RAM
- **이미지**: Ubuntu LTS (aarch64), 부팅 볼륨 ≥ 47GB (Always Free 블록 합산 200GB)
- **보안 목록(Ingress)**: **80·443만 개방**, SSH(22)는 본인 IP로 제한. **PostgreSQL 포트는 개방 금지**(컨테이너 내부망 전용)
- 용량 부족("out of capacity") 시 다른 가용 도메인/리전 재시도 또는 시간차 재시도.

## 2. 서버 셋업
```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # 재로그인 후 적용
git clone <repo-url> seogyeong && cd seogyeong
```

## 3. 환경 변수 (.env — 서버에서 직접 작성, 커밋 금지)
루트에 `.env`:
```dotenv
SITE_ADDRESS=교육위원회도메인.kr        # 도메인 지정 시 Caddy가 HTTPS 자동 발급. 없으면 :80
POSTGRES_USER=seogyeong
POSTGRES_PASSWORD=<openssl rand -base64 36>
POSTGRES_DB=seogyeong
DATABASE_URL=postgres://seogyeong:<위 비번>@postgres:5432/seogyeong
JWT_SECRET=<openssl rand -base64 48>
SEED_ADMIN_EMAIL=admin@교육위원회도메인.kr
SEED_ADMIN_PASSWORD=<강한 무작위 값 — 최초 로그인 후 변경 권장>
```
> `.env`는 `.gitignore` 대상. 시크릿 커밋 금지.

## 4. 기동
```bash
docker compose up -d --build       # web·postgres·caddy 기동 (최초 빌드 — ARM 네이티브)
docker compose ps                  # postgres healthy, web·caddy running 확인
```

## 5. 마이그레이션 + 초기 admin (최초 1회 / 스키마 변경 시)
```bash
docker compose run --rm migrate    # migrate.mjs(스키마) → seed-admin.mjs(초기 admin)
```
- 멱등: 재실행해도 적용된 마이그레이션·기존 admin은 건너뛴다.
- 스키마 변경 배포 시: `git pull` → `docker compose up -d --build` → `docker compose run --rm migrate`.

## 6. 도메인·HTTPS
- DNS A 레코드를 VM 공인 IP로 연결. `SITE_ADDRESS`가 도메인이면 Caddy가 Let's Encrypt 인증서를 자동 발급(80/443 개방 필요).
- 확인: `https://<도메인>/`, `/committee`, `/resources`, `/login`(admin 로그인) → `/admin`.

## 7. 운영 체크리스트
- [ ] PostgreSQL 정기 백업: `docker compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql` (cron → 블록 볼륨/Object Storage)
- [ ] 업로드 볼륨(`uploads`) 백업: `docker run --rm -v seogyeong_uploads:/v -v $PWD:/b alpine tar czf /b/uploads.tgz -C /v .`
- [ ] 로그 확인: `docker compose logs -f web` / `caddy`
- [ ] `JWT_SECRET` 로테이션 정책(로테이션 시 전 세션 무효화)
- [ ] OCI 무료 한도·유휴 자원 회수 정책 모니터링

## 8. 트러블슈팅
- web 컨테이너 DB 연결 실패: `.env`의 `DATABASE_URL` 호스트가 `postgres`(서비스명)인지 확인.
- 마이그레이션 에러: `docker compose run --rm migrate` 출력 확인. `__migrations` 테이블로 적용 이력 추적.
- HTTPS 미발급: 80/443 개방·DNS 전파·`SITE_ADDRESS` 도메인 정확성 확인.
````

- [ ] **Step 2: 정적 점검** — 런북의 명령·env 키가 실제 자산과 일치하는지 확인(`SITE_ADDRESS`/`POSTGRES_*`/`DATABASE_URL`/`JWT_SECRET`/`SEED_ADMIN_*`, `docker compose run --rm migrate`, 볼륨명 `seogyeong_uploads`는 compose 프로젝트명 기준 — 실제 프로젝트 디렉터리명에 따라 다를 수 있음을 주석).

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add deploy/README.md
git commit -m "docs: Oracle VM 배포 런북 완성(마이그레이션·시드·HTTPS·백업)"
```

---

## Task 6: 통합 검증 (회귀 + 정적)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 배포 스크립트 e2e** — `cd web && pnpm deploy:verify` → `✅ 배포 스크립트 검증 통과`.
- [ ] **Step 2: 회귀** — `cd web && pnpm lint && pnpm build && pnpm db:verify && pnpm committee:verify && pnpm uploads:verify && pnpm resource:verify` 전부 통과(앱 무변경 확인).
- [ ] **Step 3: 정적 점검 요약** — Dockerfile COPY 경로·compose YAML·런북 env 키 일치 재확인. 포트(5434 검증 전용) 정리 확인. (컨테이너 빌드는 VM 검증 — 런북 명시됨.)

---

## Self-Review 메모

- **스펙 커버리지:** migrate(멱등·__migrations)·seed-admin(env·멱등)·Dockerfile COPY·compose migrate 서비스·런북 = 태스크 매핑. 검증 한계(Docker 부재 → 컨테이너 빌드 VM 검증)도 명시.
- **타입/계약:** migrate는 DATABASE_URL/MIGRATIONS_DIR, seed-admin은 +SEED_ADMIN_*. compose migrate 서비스 env가 이를 공급. Dockerfile COPY 경로가 스크립트 cwd(/app)와 정합.
- **검증 가능성:** verify-migrate.mjs가 빈 PGlite 소켓에 실제 스크립트를 돌려 적용·멱등·시드·env가드를 e2e로 확인(Docker 불필요). PGlite 소켓 트랜잭션 이슈 시 fallback 명시.
- **플레이스홀더:** 없음.
