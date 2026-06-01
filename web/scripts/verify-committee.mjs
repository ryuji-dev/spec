// 교육위원회 순수 매퍼 검증 — DB 없이 실행.
//   실행: pnpm committee:verify
import { toCommitteePostView, CATEGORY_EN } from "../src/lib/committee.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

const now = new Date("2026-06-01T00:00:00Z");

const v = toCommitteePostView(
  {
    id: "abc",
    category: "회의록",
    title: "제5차 회의록",
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
assert(v.cat === "회의록" && v.catEn === "MINUTES", "카테고리 KO→EN 매핑");
assert(v.author === "박혜진 전도사" && v.authorInit === "박", "작성자·이니셜 조합");
assert(v.date === "2026.05.30", "날짜 포맷 YYYY.MM.DD");
assert(v.attach === 2 && v.comments === 3, "첨부·댓글 카운트");
assert(v.isNew === true, "7일 이내 isNew=true");

const v2 = toCommitteePostView(
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
assert(v2.author === "익명" && v2.excerpt === "", "작성자/요약 폴백");
assert(v2.isNew === false, "오래된 글 isNew=false");
assert(CATEGORY_EN["공지"] === "NOTICE", "CATEGORY_EN 맵");

console.log("\n✅ 교육위원회 순수 매퍼 검증 통과");
