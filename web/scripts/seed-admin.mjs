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
