// 신학원 교수 디렉터리 — 클라이언트 안전 순수 매퍼. DB·server-only 의존 없음.
// DB 평면 행(FacultyRow)을 디자인 뷰모델(FacultyMember/FacultyCover)로 파생한다.
import type { Database } from "./database.types";
import type { FacultyDept, FacultyMember, FacultyCover } from "./faculty-data";

// 부서 코드 → 한국어·영문 라벨 (FilterStrip·목록 카운트용)
export const FACULTY_DEPT_META: Record<
  Exclude<FacultyDept, "all">,
  { ko: string; en: string }
> = {
  ot: { ko: "구약학", en: "OLD TESTAMENT" },
  nt: { ko: "신약학", en: "NEW TESTAMENT" },
  st: { ko: "조직신학", en: "SYSTEMATIC" },
  pt: { ko: "실천신학", en: "PRACTICAL" },
  ch: { ko: "교회사", en: "CHURCH HISTORY" },
  mn: { ko: "선교/디아스포라", en: "MISSIONS" },
};

// 커버 스토리 정적 태그
export const COVER_TAG = "커버 스토리 · 2026 봄";

// DB Row 타입 — supabase-js 생성 타입 기반 (snake_case)
export type FacultyRow = Database["public"]["Tables"]["faculty"]["Row"];

// 평면 행 → 디자인 FacultyMember 뷰모델 (init은 이름 첫 글자 파생)
export function toFacultyMemberView(row: FacultyRow): FacultyMember {
  // teaches는 jsonb → supabase-js가 Json 타입으로 반환하므로 string[]로 캐스트
  const teaches = (row.teaches as string[]) ?? [];
  return {
    id: row.id,
    dept: row.dept as Exclude<FacultyDept, "all">,
    name: row.name,
    title: row.title,
    en: row.en,
    degree: row.degree,
    init: row.name.slice(0, 1),
    tone: row.tone as FacultyMember["tone"],
    field: row.field,
    teaches,
    quote: row.quote,
    years: row.years,
    papers: row.papers,
    office: row.office,
    hours: row.hours,
  };
}

// 평면 행 → 디자인 FacultyCover 뷰모델 (커버 히어로)
export function toFacultyCoverView(row: FacultyRow): FacultyCover {
  // teaches는 jsonb → string[]로 캐스트
  const teaches = (row.teaches as string[]) ?? [];
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    en: row.en,
    init: row.name.slice(0, 1),
    yearsKo: `${row.years}년차`,
    tag: COVER_TAG,
    quote: row.quote,
    about: row.about ?? "",
    stats: [
      { k: String(row.years), l: "강의 연차" },
      { k: String(row.papers), l: "저서·논문" },
      { k: String(teaches.length), l: "담당 강좌" },
    ],
    current: teaches,
  };
}
