// 첨부파일 — posts에 연결. 저장 파일명(storedName)은 서버에서 재생성한 값(헌법 보안).
import { pgTable, uuid, text, bigint, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./posts";

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  originalName: text("original_name").notNull(),
  storedName: text("stored_name").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
