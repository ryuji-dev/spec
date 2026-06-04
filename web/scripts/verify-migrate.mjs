// 배포 스크립트 e2e 검증 — 빈 PGlite를 PG 와이어 소켓(127.0.0.1:5434)으로 띄우고
// 실제 migrate.mjs·seed-admin.mjs를 child process로 실행해 멱등성까지 확인. Docker 불필요.
//   실행: pnpm deploy:verify
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "../src/server/db/migrations");
// 기대 적용 건수는 migrations/*.sql 개수에서 동적으로 — 마이그레이션 추가 시 자동 반영(하드코딩 금지).
const migrationCount = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).length;
const PORT = 5434;
const URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`;

// execFileSync는 부모 이벤트 루프를 막아 같은 프로세스의 PGlite 소켓 서버가
// 자식의 접속을 처리하지 못함(CONNECT_TIMEOUT). 비동기 execFile로 루프를 비워둔다.
const execFileP = promisify(execFile);

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};
const runScript = async (script, extraEnv) =>
  (
    await execFileP("node", [join(here, script)], {
      env: { ...process.env, DATABASE_URL: URL, MIGRATIONS_DIR: migrationsDir, ...extraEnv },
      encoding: "utf8",
    })
  ).stdout;

// PGlite 소켓 서버는 동시 접속 1개만 허용 → 부모가 연결을 붙들면 자식이 ECONNRESET.
// 검사 쿼리는 매번 짧게 열고 닫아 자식 실행과 겹치지 않게 한다.
const query = async (fn) => {
  const sql = postgres(URL, { max: 1, onnotice: () => {} });
  try {
    return await fn(sql);
  } finally {
    await sql.end();
  }
};

const db = await PGlite.create();
const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });
await server.start();
try {
  const out1 = await runScript("migrate.mjs");
  assert(
    new RegExp(`${migrationCount}건 적용 완료`).test(out1),
    `migrate 최초 실행 ${migrationCount}건 적용`,
  );

  const tables = await query((sql) =>
    sql`select table_name from information_schema.tables where table_schema='public' order by table_name`.then(
      (rows) => rows.map((r) => r.table_name),
    ),
  );
  assert(
    ["attachments", "comments", "posts", "users", "post_likes", "faculty", "__migrations"].every(
      (t) => tables.includes(t),
    ),
    `핵심 테이블 + __migrations 생성 (${tables.join(", ")})`,
  );

  const out2 = await runScript("migrate.mjs");
  assert(/적용 0건/.test(out2), "migrate 재실행 멱등(0건)");

  const outS1 = await runScript("seed-admin.mjs", {
    SEED_ADMIN_EMAIL: "deploy@test.kr",
    SEED_ADMIN_PASSWORD: "deploy-pw-1234",
  });
  assert(/admin 생성/.test(outS1), "seed-admin 최초 생성");
  const admin = await query(
    (sql) =>
      sql`select role, left(password_hash,9) as h from users where email='deploy@test.kr'`,
  );
  assert(admin[0]?.role === "admin" && admin[0]?.h === "$argon2id", "admin role·argon2id 해시");

  const outS2 = await runScript("seed-admin.mjs", {
    SEED_ADMIN_EMAIL: "deploy@test.kr",
    SEED_ADMIN_PASSWORD: "deploy-pw-1234",
  });
  assert(/건너뜀/.test(outS2), "seed-admin 재실행 멱등(skip)");

  let failed = false;
  try {
    await execFileP("node", [join(here, "seed-admin.mjs")], {
      env: { ...process.env, DATABASE_URL: URL },
      encoding: "utf8",
    });
  } catch {
    failed = true;
  }
  assert(failed, "seed-admin: SEED_ADMIN_* 누락 시 비정상 종료");

  console.log("\n✅ 배포 스크립트 검증 통과");
} finally {
  await server.stop();
  await db.close();
}
