// 신학원 교수 디렉터리 — posts 게시판과 별개의 독립 테이블.
// dept(부서)·tone(아바타 색조)은 enum, teaches(담당 강좌)는 문자열 배열 jsonb.
// isCover로 커버 스토리 교수 1명을 구분하고, about은 커버용 소개(나머지는 null).
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const facultyDept = pgEnum("faculty_dept", [
  "ot",
  "nt",
  "st",
  "pt",
  "ch",
  "mn",
]);

export const facultyTone = pgEnum("faculty_tone", [
  "forest",
  "olive",
  "pine",
  "sage",
]);

export const faculty = pgTable("faculty", {
  id: uuid("id").primaryKey().defaultRandom(),
  dept: facultyDept("dept").notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  en: text("en").notNull(),
  degree: text("degree").notNull(),
  tone: facultyTone("tone").notNull(),
  field: text("field").notNull(),
  // 담당 강좌 목록
  teaches: jsonb("teaches").$type<string[]>().notNull().default([]),
  quote: text("quote").notNull(),
  years: integer("years").notNull().default(0),
  papers: integer("papers").notNull().default(0),
  office: text("office").notNull(),
  hours: text("hours").notNull(),
  // 커버 스토리 교수 여부 — 디렉터리 히어로에 노출
  isCover: boolean("is_cover").notNull().default(false),
  // 커버용 상세 소개 (일반 교수는 null)
  about: text("about"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Faculty = typeof faculty.$inferSelect;
export type NewFaculty = typeof faculty.$inferInsert;
