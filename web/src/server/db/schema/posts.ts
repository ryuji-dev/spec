// 통합 콘텐츠 — 공지·자유게시판·위원회·수련회·웹진·자료를 한 테이블로.
// 섹션(section)으로 게시판을 구분하고, 세부 분류는 category, 섹션별 추가 필드는 meta(jsonb)로.
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const postSection = pgEnum("post_section", [
  "notice",
  "board",
  "committee",
  "training",
  "webzine",
  "resource",
]);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    section: postSection("section").notNull(),
    // 섹션 내 세부 분류 (예: '회의록', '나눔', '신학산책')
    category: text("category"),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    // 작성자 삭제 시 글은 남기고 작성자만 비움
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    isPublished: boolean("is_published").notNull().default(true),
    viewCount: integer("view_count").notNull().default(0),
    // 일정·수련회 등 날짜성 콘텐츠용
    eventDate: timestamp("event_date", { withTimezone: true }),
    // 섹션별 추가 필드 (수련회 정원·강사, 자료 파일타입 등)
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_section_idx").on(t.section),
    index("posts_created_at_idx").on(t.createdAt),
  ],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
