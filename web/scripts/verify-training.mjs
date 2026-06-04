// 교역자수련회 순수 매퍼 검증 — DB 없이 실행.
//   실행: pnpm training:verify
import { toTrainingPostView, CATEGORY_EN } from "../src/lib/training.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

const now = new Date("2026-06-01T00:00:00Z");

const v = toTrainingPostView(
  {
    id: "abc",
    category: "강의자료",
    title: "이정훈 교수 강의안",
    excerpt: "요약",
    viewCount: 42,
    createdAt: new Date("2026-05-30T00:00:00Z"),
    authorName: "박혜진",
    authorTitle: "전도사",
    commentCount: 3,
    attachCount: 2,
  },
  now,
);

assert(v.id === "abc", "id 전달");
assert(v.cat === "강의자료" && v.catEn === "MATERIALS", "카테고리 KO→EN 매핑");
assert(v.author === "박혜진 전도사" && v.authorInit === "박", "작성자·이니셜 조합");
assert(v.date === "2026.05.30", "날짜 포맷 YYYY.MM.DD");
assert(v.attach === 2 && v.comments === 3, "첨부·댓글 카운트");
assert(v.isNew === true, "7일 이내 isNew=true");

const v2 = toTrainingPostView(
  {
    id: "x",
    category: null,
    title: "t",
    excerpt: null,
    viewCount: 0,
    createdAt: new Date("2026-04-01T00:00:00Z"),
    authorName: null,
    authorTitle: null,
    commentCount: 0,
    attachCount: 0,
  },
  now,
);
assert(v2.attach === undefined, "첨부 0 → attach undefined");
assert(v2.cat === "Q&A" && v2.catEn === "QNA", "미지정 카테고리 → Q&A 폴백");
assert(v2.author === "익명" && v2.excerpt === "", "작성자/요약 폴백");
assert(v2.isNew === false, "오래된 글 isNew=false");
assert(CATEGORY_EN["예정"] === "UPCOMING", "CATEGORY_EN 맵");

console.log("\n✅ 교역자수련회 순수 매퍼 검증 통과");
