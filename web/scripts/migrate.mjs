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
