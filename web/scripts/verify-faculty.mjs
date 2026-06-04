// 신학원 교수 순수 매퍼 검증 — DB 없이 실행.
//   실행: pnpm faculty:verify
import {
  toFacultyMemberView,
  toFacultyCoverView,
  FACULTY_DEPT_META,
  COVER_TAG,
} from "../src/lib/faculty.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

// 부서 메타
assert(FACULTY_DEPT_META.ot.ko === "구약학" && FACULTY_DEPT_META.ot.en === "OLD TESTAMENT", "FACULTY_DEPT_META ot");
assert(FACULTY_DEPT_META.mn.ko === "선교/디아스포라" && FACULTY_DEPT_META.mn.en === "MISSIONS", "FACULTY_DEPT_META mn");
assert(Object.keys(FACULTY_DEPT_META).length === 6, "부서 메타 6개");

// member 매퍼
const m = toFacultyMemberView({
  id: "uuid-1",
  dept: "ot",
  name: "문성재",
  title: "구약학 교수",
  en: "MOON, SEONG-JAE",
  degree: "Ph.D · Princeton",
  tone: "forest",
  field: "예언서·시편 신학",
  teaches: ["예언서 강해", "시편의 신학", "히브리어 강독 II"],
  quote: "본문이 입을 다물 때까지",
  years: 14,
  papers: 23,
  office: "본관 207호",
  hours: "월·수 14:00–17:00",
  isCover: false,
  about: null,
  sortOrder: 0,
});
assert(m.id === "uuid-1", "member id 전달(string)");
assert(m.init === "문", "member init = 이름 첫 글자 파생");
assert(m.dept === "ot" && m.tone === "forest", "member dept·tone 전달");
assert(m.teaches.length === 3 && m.teaches[0] === "예언서 강해", "member teaches 배열 전달");
assert(m.years === 14 && m.papers === 23, "member years·papers 전달");
assert(m.office === "본관 207호" && m.hours === "월·수 14:00–17:00", "member office·hours 전달");

// cover 매퍼
const c = toFacultyCoverView({
  id: "uuid-cover",
  dept: "st",
  name: "강민준",
  title: "학장 / 조직신학 교수",
  en: "KANG, MIN-JUN · TH.D",
  degree: "Th.D · Heidelberg",
  tone: "pine",
  field: "교회론",
  teaches: ["교회론과 공동체", "성령과 교회"],
  quote: "신학은 교회의 삶을 향해",
  years: 24,
  papers: 11,
  office: "본관 501호",
  hours: "월 10:00",
  isCover: true,
  about: "하이델베르크 대학에서…",
  sortOrder: 0,
});
assert(c.id === "uuid-cover", "cover id 전달");
assert(c.init === "강", "cover init 파생");
assert(c.yearsKo === "24년차", "cover yearsKo 파생");
assert(c.tag === COVER_TAG, "cover tag = COVER_TAG");
assert(c.about === "하이델베르크 대학에서…", "cover about 전달");
assert(c.stats.length === 3, "cover stats 3개");
assert(c.stats[0].k === "24" && c.stats[0].l === "강의 연차", "cover stats[0] = years");
assert(c.stats[1].k === "11" && c.stats[1].l === "저서·논문", "cover stats[1] = papers");
assert(c.stats[2].k === "2" && c.stats[2].l === "담당 강좌", "cover stats[2] = teaches 수");
assert(c.current.length === 2 && c.current === c.current, "cover current = teaches");
assert(c.current[0] === "교회론과 공동체", "cover current 내용");

// about null → "" 폴백
const c2 = toFacultyCoverView({
  id: "x", dept: "ot", name: "테스트", title: "t", en: "e", degree: "d",
  tone: "sage", field: "f", teaches: [], quote: "q",
  years: 0, papers: 0, office: "o", hours: "h",
  isCover: true, about: null, sortOrder: 0,
});
assert(c2.about === "", "cover about null → 빈 문자열 폴백");
assert(c2.stats[2].k === "0", "teaches 빈 배열 → 담당 강좌 0");

console.log("\n✅ 신학원 교수 순수 매퍼 검증 통과");
