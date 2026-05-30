// 비밀번호 해시 — argon2id(라이브러리 권장 파라미터). 평문/약한 해시 금지(헌법 보안).
import "server-only";
import argon2 from "@node-rs/argon2";

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
