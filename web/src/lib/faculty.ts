// 신학원 교수 디렉터리 — 클라이언트 안전 순수 매퍼. DB·server-only 의존 없음.
// DB 평면 행(FacultyRow)을 디자인 뷰모델(FacultyMember/FacultyCover)로 파생한다.
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

// 서비스가 만든 DB 평면 행 (faculty 테이블 컬럼)
export type FacultyRow = {
  id: string;
  dept: Exclude<FacultyDept, "all">;
  name: string;
  title: string;
  en: string;
  degree: string;
  tone: FacultyMember["tone"];
  field: string;
  teaches: string[];
  quote: string;
  years: number;
  papers: number;
  office: string;
  hours: string;
  isCover: boolean;
  about: string | null;
  sortOrder: number;
};

// 평면 행 → 디자인 FacultyMember 뷰모델 (init은 이름 첫 글자 파생)
export function toFacultyMemberView(row: FacultyRow): FacultyMember {
  return {
    id: row.id,
    dept: row.dept,
    name: row.name,
    title: row.title,
    en: row.en,
    degree: row.degree,
    init: row.name.slice(0, 1),
    tone: row.tone,
    field: row.field,
    teaches: row.teaches,
    quote: row.quote,
    years: row.years,
    papers: row.papers,
    office: row.office,
    hours: row.hours,
  };
}

// 평면 행 → 디자인 FacultyCover 뷰모델 (커버 히어로)
export function toFacultyCoverView(row: FacultyRow): FacultyCover {
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
      { k: String(row.teaches.length), l: "담당 강좌" },
    ],
    current: row.teaches,
  };
}
