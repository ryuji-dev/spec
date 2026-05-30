// DB 클라이언트 (서버 전용) — 접속·시크릿은 오직 여기서. drizzle-kit은 이 파일을 로드하지 않음.
import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
}

// 개발 중 HMR로 커넥션이 중복 생성되지 않도록 전역에 캐시
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};
const client = globalForDb.client ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
