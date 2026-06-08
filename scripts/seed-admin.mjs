// 운영 admin 시드 — 관리자 계정 1명만 생성·승격. 멱등. 데모 콘텐츠 없음.
//   실행: node --env-file=.env.production.local scripts/seed-admin.mjs
//   필수 env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
//   선택 env: ADMIN_NAME, ADMIN_TITLE, ADMIN_CHURCH
// createUser → on_auth_user_created 트리거가 profiles를 member로 생성, 이후 service-role로 admin 승격.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey) {
  console.error("seed-admin: NEXT_PUBLIC_SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}
// 운영 비밀번호를 직접 지정하게 강제(기본값 주입 방지).
if (!email || !password) {
  console.error("seed-admin: ADMIN_EMAIL·ADMIN_PASSWORD 필요(운영 비밀번호를 직접 지정)");
  process.exit(1);
}
if (password.length < 8) {
  console.error("seed-admin: ADMIN_PASSWORD는 8자 이상이어야 합니다");
  process.exit(1);
}

const meta = {
  name: process.env.ADMIN_NAME || "관리자",
  title: process.env.ADMIN_TITLE || "교육위원회",
  church: process.env.ADMIN_CHURCH || "교육위원회",
};

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: list, error: le } = await db.auth.admin.listUsers();
if (le) {
  console.error(`listUsers: ${le.message}`);
  process.exit(1);
}
const found = list.users.find((u) => u.email === email);

let id;
if (found) {
  console.log(`skip create (이미 존재): ${email}`);
  id = found.id;
} else {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) {
    console.error(`createUser ${email}: ${error.message}`);
    process.exit(1);
  }
  console.log(`created admin user: ${email}`);
  id = data.user.id;
}

const { error: re } = await db.from("profiles").update({ role: "admin" }).eq("id", id);
if (re) {
  console.error(`set role admin: ${re.message}`);
  process.exit(1);
}
console.log(`✅ admin 준비 완료: ${email} (role=admin)`);
