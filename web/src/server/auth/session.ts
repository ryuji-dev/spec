// 세션 토큰 — jose(HS256) JWT 발급·검증. 만료 7일. 시크릿은 .env(JWT_SECRET).
// 쿠키 read/write는 요청 컨텍스트가 필요하므로 Server Action 쪽에서 처리한다(여기는 순수 토큰 코어).
import "server-only";
import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const EXPIRES = "7d";

export interface SessionClaims {
  sub: string; // user id
  role: "admin" | "member";
}

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  return new TextEncoder().encode(s);
}

export function createSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(EXPIRES)
    .sign(getSecret());
}

// 만료·위조·서명불일치는 모두 null로 (호출부에서 미인증 처리)
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    const role = payload.role;
    if (typeof payload.sub !== "string") return null;
    if (role !== "admin" && role !== "member") return null;
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}
