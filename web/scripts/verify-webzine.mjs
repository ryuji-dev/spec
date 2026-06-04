// 신학원웹진 순수 매퍼 검증 — DB 없이 실행.
//   실행: pnpm webzine:verify
import {
  toWebzineArticleView,
  toWebzineFeaturedView,
  readingTime,
  WZ_CATEGORY_EN,
  WZ_CATEGORY_COVER,
  CURRENT_ISSUE,
} from "../src/lib/webzine.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

// 카테고리 맵
assert(WZ_CATEGORY_EN["신학산책"] === "THEOLOGY", "WZ_CATEGORY_EN 맵");
assert(WZ_CATEGORY_EN["대담"] === "DIALOGUE", "WZ_CATEGORY_EN 대담→DIALOGUE");
assert(WZ_CATEGORY_COVER["북리뷰"] === "book2", "WZ_CATEGORY_COVER 맵");
assert(WZ_CATEGORY_COVER["교회사"] === "history", "WZ_CATEGORY_COVER 교회사→history");

// readingTime
assert(readingTime(0) === "1분", "readingTime 최소 1분");
assert(readingTime(350) === "1분", "readingTime 350자→1분");
assert(readingTime(3500) === "10분", "readingTime 3500자→10분");

// article 매퍼
const a = toWebzineArticleView({
  id: "abc",
  category: "신학산책",
  title: "칼뱅의 교사론",
  excerpt: "요약문",
  viewCount: 42,
  createdAt: new Date("2026-05-30T00:00:00Z"),
  isPinned: false,
  authorName: "이정훈",
  authorTitle: "교수",
  bodyLength: 2800,
});
assert(a.id === "abc", "article id 전달");
assert(a.cat === "신학산책" && a.tag === "THEOLOGY", "article cat·tag 매핑");
assert(a.cover === "book", "article cover 매핑");
assert(a.author === "이정훈 교수", "article 작성자 조합");
assert(a.date === "2026.05.30", "article 날짜 포맷");
assert(a.excerpt === "요약문" && a.read === "8분", "article excerpt·read");

// featured 매퍼
const f = toWebzineFeaturedView({
  id: "f1",
  category: "에세이",
  title: "광야로 보내심을",
  excerpt: "부제문",
  viewCount: 0,
  createdAt: new Date("2026-04-18T00:00:00Z"),
  isPinned: true,
  authorName: "김도현",
  authorTitle: "학장",
  bodyLength: 4200,
});
assert(f.issue === CURRENT_ISSUE, "featured issue=CURRENT_ISSUE");
assert(f.category === "ESSAY", "featured category 매핑");
assert(f.title === "광야로 보내심을" && f.subtitle === "부제문", "featured 제목·부제");
assert(f.author === "김도현 학장" && f.authorRole === "학장", "featured 작성자·역할");
assert(f.cover === "wilderness", "featured cover=wilderness");
assert(f.read === "12분", "featured read");

// 폴백 단언
const fb = toWebzineArticleView({
  id: "x",
  category: null,
  title: "t",
  excerpt: null,
  viewCount: 0,
  createdAt: new Date("2026-04-01T00:00:00Z"),
  isPinned: false,
  authorName: null,
  authorTitle: null,
  bodyLength: 0,
});
assert(fb.cat === "에세이" && fb.tag === "ESSAY", "미지정 카테고리 → 에세이 폴백");
assert(fb.cover === "child", "폴백 cover=child");
assert(fb.author === "익명" && fb.excerpt === "", "작성자/요약 폴백");
assert(fb.read === "1분", "bodyLength 0 → read 1분");

console.log("\n✅ 신학원웹진 순수 매퍼 검증 통과");
