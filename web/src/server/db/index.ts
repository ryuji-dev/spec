// DB 클라이언트 (서버 전용) — 접속·시크릿은 오직 여기서. drizzle-kit은 이 파일을 로드하지 않음.
// 지연 초기화: 모듈 import만으로 커넥션을 만들지 않는다(빌드 시 DATABASE_URL 없이도 안전).
import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

// 개발 중 HMR로 커넥션이 중복 생성되지 않도록 전역 캐시
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
  drizzleDb?: DB;
};

export function getDb(): DB {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  }
  const client = globalForDb.pgClient ?? postgres(connectionString);
  const db = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.pgClient = client;
    globalForDb.drizzleDb = db;
  }
  return db;
}
