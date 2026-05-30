import type { Config } from "drizzle-kit";

// 로컬 기본값은 docker-compose의 postgres 기본 자격과 일치 (운영은 .env의 DATABASE_URL)
export default {
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://seogyeong:devpassword@localhost:5432/seogyeong",
  },
} satisfies Config;
