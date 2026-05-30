// 인증 원시 함수 검증 — 실제 모듈을 import해 해시·JWT 동작을 확인.
//   실행: node --conditions=react-server scripts/verify-auth.ts
// (react-server 조건으로 'server-only'를 noop 처리해 Node에서 서버 모듈을 로드)
process.env.JWT_SECRET = "test-secret-".padEnd(48, "x");

import { SignJWT } from "jose";
import { hashPassword, verifyPassword } from "../src/server/auth/password.ts";
import {
  createSessionToken,
  verifySessionToken,
} from "../src/server/auth/session.ts";

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

// 1) 비밀번호 해시 라운드트립
const hash = await hashPassword("올바른비번1234");
assert(hash.startsWith("$argon2"), "argon2id 해시 형식");
assert(await verifyPassword(hash, "올바른비번1234"), "올바른 비밀번호 검증 성공");
assert(!(await verifyPassword(hash, "틀린비번")), "틀린 비밀번호 검증 실패");

// 2) 세션 토큰 발급·검증 라운드트립
const token = await createSessionToken({ sub: "user-1", role: "admin" });
const claims = await verifySessionToken(token);
assert(claims?.sub === "user-1" && claims?.role === "admin", "토큰 발급·검증 라운드트립");

// 3) 위조 토큰 거부
assert((await verifySessionToken(token + "x")) === null, "위조 토큰 거부");
assert((await verifySessionToken("not.a.jwt")) === null, "비정상 토큰 거부");

// 4) 다른 시크릿으로 서명된 토큰 거부
const otherSecret = new TextEncoder().encode("y".repeat(48));
const foreign = await new SignJWT({ role: "admin" })
  .setProtectedHeader({ alg: "HS256" })
  .setSubject("user-1")
  .setExpirationTime("7d")
  .sign(otherSecret);
assert((await verifySessionToken(foreign)) === null, "다른 시크릿 토큰 거부");

// 5) 만료된 토큰 거부
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const expired = await new SignJWT({ role: "admin" })
  .setProtectedHeader({ alg: "HS256" })
  .setSubject("user-1")
  .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
  .sign(secret);
assert((await verifySessionToken(expired)) === null, "만료 토큰 거부");

// 6) 잘못된 role 클레임 거부
const badRole = await new SignJWT({ role: "superadmin" })
  .setProtectedHeader({ alg: "HS256" })
  .setSubject("user-1")
  .setExpirationTime("7d")
  .sign(secret);
assert((await verifySessionToken(badRole)) === null, "허용되지 않은 role 거부");

console.log("\n✅ 인증 원시 함수 검증 통과");
