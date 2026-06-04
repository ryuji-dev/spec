// 글 좋아요 — 회원당 글 1회. (postId, userId) 유니크로 멱등 토글 보장.
import { pgTable, uuid, timestamp, unique, index } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { users } from "./users";

export const postLikes = pgTable(
  "post_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("post_likes_post_user_uq").on(t.postId, t.userId),
    index("post_likes_post_id_idx").on(t.postId),
  ],
);

export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
