// 로컬 개발용 PostgreSQL — Docker 없이 PGlite를 PG 와이어 프로토콜 서버로 띄운다.
// 앱은 평소처럼 postgres-js로 127.0.0.1:5432에 접속(운영 코드 무변경).
//   실행: pnpm dev:db  (next dev와 함께 별도 터미널에서)
// 영속: web/.pglite (gitignore). 최초 1회 마이그레이션 적용 + admin 시드.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import argon2 from "@node-rs/argon2";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "../.pglite");
const migrationsDir = join(here, "../src/server/db/migrations");

const PORT = 5432;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@seogyeong.kr";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

const db = await PGlite.create({ dataDir });

// 최초 1회만 마이그레이션 적용 (users 테이블 유무로 판단)
const hasUsers = await db.query(
  `select 1 from information_schema.tables where table_schema='public' and table_name='users'`,
);
if (hasUsers.rows.length === 0) {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
  console.log(`[dev-db] 마이그레이션 적용: ${files.join(", ")}`);
} else {
  console.log("[dev-db] 스키마 이미 존재 — 마이그레이션 건너뜀");
}

// admin 시드 (없을 때만)
const exists = await db.query(`select 1 from users where email=$1`, [ADMIN_EMAIL]);
if (exists.rows.length === 0) {
  const hash = await argon2.hash(ADMIN_PASSWORD);
  await db.query(
    `insert into users (email, password_hash, name, title, role) values ($1,$2,$3,$4,'admin')`,
    [ADMIN_EMAIL, hash, "관리자", "교육위원회"],
  );
  console.log(`[dev-db] admin 시드: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
} else {
  console.log(`[dev-db] admin 이미 존재: ${ADMIN_EMAIL}`);
}

const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });
await server.start();
console.log(`[dev-db] PGlite 서버 listening: postgres://127.0.0.1:${PORT}`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
