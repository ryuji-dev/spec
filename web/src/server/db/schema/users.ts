// 사용자 — 인증 기반. 권한은 admin / member 두 등급만 (헌법).
// (server-only 미부착: drizzle-kit이 이 파일을 Node에서 평가하므로. 접속·시크릿 가드는 db/index.ts에서.)
import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "member"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // 직함 표시용 (예: 목사·전도사·집사) — 인증 역할(role)과 별개
  title: text("title"),
  church: text("church"),
  role: userRole("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
