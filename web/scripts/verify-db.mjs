// DB 스키마 스모크 테스트 — PGlite(인메모리 Postgres)에 생성된 마이그레이션을 적용하고
// 핵심 동작(삽입·조인·FK 위반·cascade 삭제)을 검증한다. Docker/로컬 Postgres 없이 실행.
//   실행: pnpm exec node scripts/verify-db.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "../src/server/db/migrations");

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

const db = new PGlite();

// 1) 마이그레이션 SQL 전부 순서대로 적용
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
for (const f of files) {
  await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
}
console.log(`마이그레이션 적용: ${files.join(", ")}`);

// 2) 테이블·enum 생성 확인
const tables = await db.query(
  `select table_name from information_schema.tables where table_schema='public' order by table_name`,
);
const names = tables.rows.map((r) => r.table_name);
assert(
  ["attachments", "posts", "users"].every((t) => names.includes(t)),
  `3개 테이블 생성됨 (${names.join(", ")})`,
);

// 3) 사용자 삽입 (role 기본값 member 확인)
const u = await db.query(
  `insert into users (email, password_hash, name) values ($1,$2,$3) returning id, role`,
  ["admin@example.com", "x", "관리자"],
);
const userId = u.rows[0].id;
assert(u.rows[0].role === "member", "role 기본값이 member");

// 4) 게시글 삽입 (작성자 FK + 기본값)
const p = await db.query(
  `insert into posts (section, title, author_id) values ($1,$2,$3) returning id, is_published, view_count`,
  ["board", "첫 글", userId],
);
const postId = p.rows[0].id;
assert(p.rows[0].is_published === true, "is_published 기본값 true");
assert(p.rows[0].view_count === 0, "view_count 기본값 0");

// 5) 첨부 삽입 + 조인 조회
await db.query(
  `insert into attachments (post_id, original_name, stored_name, mime, size_bytes) values ($1,$2,$3,$4,$5)`,
  [postId, "원본.pdf", "a1b2.pdf", "application/pdf", 12345],
);
const joined = await db.query(
  `select p.title, u.name as author, a.original_name
   from posts p join users u on u.id = p.author_id
   join attachments a on a.post_id = p.id`,
);
assert(
  joined.rows[0].author === "관리자" && joined.rows[0].original_name === "원본.pdf",
  "게시글-작성자-첨부 조인 정상",
);

// 6) 잘못된 섹션 enum 거부
let enumRejected = false;
try {
  await db.query(`insert into posts (section, title) values ('invalid','x')`);
} catch {
  enumRejected = true;
}
assert(enumRejected, "잘못된 section enum 값 거부");

// 7) 존재하지 않는 post_id 첨부 → FK 위반 거부
let fkRejected = false;
try {
  await db.query(
    `insert into attachments (post_id, original_name, stored_name, mime, size_bytes)
     values ('00000000-0000-0000-0000-000000000000','x','x','x',1)`,
  );
} catch {
  fkRejected = true;
}
assert(fkRejected, "고아 첨부(FK 위반) 거부");

// 8) 게시글 삭제 시 첨부 cascade 삭제
await db.query(`delete from posts where id = $1`, [postId]);
const left = await db.query(`select count(*)::int as n from attachments`);
assert(left.rows[0].n === 0, "게시글 삭제 시 첨부 cascade 삭제");

console.log("\n✅ DB 스키마 검증 통과");
await db.close();
