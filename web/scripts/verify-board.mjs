// 자유게시판 순수 매퍼 검증 — DB 없이.
//   실행: pnpm board:verify
import { toFeedPostView, categoryToKind, BOARD_CATEGORY_EN } from "../src/lib/board.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

assert(categoryToKind("기도") === "prayer", "기도 → prayer");
assert(categoryToKind("Q&A") === "question", "Q&A → question");
assert(categoryToKind(null) === "story", "미지정 → story 폴백");
assert(BOARD_CATEGORY_EN["토론"] === "DISCUSS", "카테고리 EN 맵");

const now = new Date("2026-06-01T00:00:00Z");
const v = toFeedPostView(
  { id: "b1", category: "토론", title: "출석 감소 고민", excerpt: "요약", viewCount: 1843, createdAt: new Date("2026-05-30T00:00:00Z"), authorName: "김도현", authorChurch: "서경중앙교회", commentCount: 47, likeCount: 128, likedByMe: true },
  now,
);
assert(v.id === "b1" && v.cat === "토론" && v.kind === "discuss", "id·cat·kind 매핑");
assert(v.author === "김도현" && v.church === "서경중앙교회" && v.avatar === "김", "작성자·교회·아바타");
assert(v.comments === 47 && v.likes === 128 && v.views === 1843, "comments·likes·views");
assert(v.likedByMe === true, "likedByMe 전달");
assert(v.date === "2026.05.30" && v.isNew === true, "date·isNew");

const v2 = toFeedPostView(
  { id: "x", category: null, title: "t", excerpt: null, viewCount: 0, createdAt: new Date("2026-01-01T00:00:00Z"), authorName: null, authorChurch: null, commentCount: 0, likeCount: 0, likedByMe: false },
  now,
);
assert(v2.cat === "나눔" && v2.kind === "story", "null 카테고리 → 나눔/story");
assert(v2.likedByMe === false, "likedByMe=false 전달");
assert(v2.author === "익명" && v2.church === "" && v2.excerpt === "", "폴백 author/church/excerpt");
assert(v2.isNew === false, "오래된 글 isNew=false");

console.log("\n✅ 자유게시판 순수 매퍼 검증 통과");
