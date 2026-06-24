import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import {
  toFacultyMemberView,
  toFacultyCoverView,
  toTimetableItem,
  toQuoteList,
  FACULTY_DEPT_META,
  type FacultyRow,
  type TimetableRow,
} from "@/lib/faculty";
import type {
  FacultyMember,
  FacultyCover,
  FacultyDeptItem,
  FacultyDept,
  FacultyQuote,
  FacultyTimetableItem,
} from "@/lib/faculty-data";
import type { Database } from "@/lib/database.types";

export type FacultyDirectoryData = {
  cover: FacultyCover | null;
  members: FacultyMember[];
  depts: FacultyDeptItem[];
  quotes: FacultyQuote[];
};

// DB Row (snake_case) → admin 페이지가 기대하는 camelCase 구조
// Drizzle Faculty 타입을 대체하는 인라인 타입
export type Faculty = {
  id: string;
  dept: Database["public"]["Enums"]["faculty_dept"];
  name: string;
  title: string;
  en: string;
  degree: string;
  tone: Database["public"]["Enums"]["faculty_tone"];
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
  createdAt: Date;
};

// DB Row(snake_case) → camelCase Faculty로 변환
function rowToFaculty(r: FacultyRow): Faculty {
  return {
    id: r.id,
    dept: r.dept,
    name: r.name,
    title: r.title,
    en: r.en,
    degree: r.degree,
    tone: r.tone,
    field: r.field,
    teaches: (r.teaches as string[]) ?? [],
    quote: r.quote,
    years: r.years,
    papers: r.papers,
    office: r.office,
    hours: r.hours,
    isCover: r.is_cover,
    about: r.about,
    sortOrder: r.sort_order,
    createdAt: new Date(r.created_at),
  };
}

// 디렉터리(공개) 데이터 — 커버 1명 + 일반 교수 목록 + 부서별 카운트.
export async function getFacultyDirectoryData(): Promise<FacultyDirectoryData> {
  const supabase = await createSupabaseServer();

  // 일반 교수(커버 제외) — sort_order → created_at 순
  const { data: memberData, error: memberError } = await supabase
    .from("faculty")
    .select("*")
    .eq("is_cover", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (memberError) throw memberError;
  const memberRows = (memberData ?? []) as FacultyRow[];
  const members = memberRows.map((r) => toFacultyMemberView(r));

  // 커버 교수 — 첫 행만(없으면 null)
  const { data: coverData, error: coverError } = await supabase
    .from("faculty")
    .select("*")
    .eq("is_cover", true)
    .order("sort_order", { ascending: true })
    .limit(1);
  if (coverError) throw coverError;
  const coverRow = coverData?.[0] as FacultyRow | undefined;
  const cover = coverRow ? toFacultyCoverView(coverRow) : null;

  // 부서별 카운트 — 커버 제외 memberRows 재활용(DB 추가 쿼리 없음)
  const byDept = new Map<string, number>();
  for (const r of memberRows) {
    byDept.set(r.dept, (byDept.get(r.dept) ?? 0) + 1);
  }

  // FACULTY_DEPT_META 순서대로 부서 항목 구성 + 맨 앞 전체(all)
  const deptOrder = Object.keys(FACULTY_DEPT_META) as Array<
    Exclude<FacultyDept, "all">
  >;
  const total = members.length;
  const depts: FacultyDeptItem[] = [
    { id: "all", ko: "전체", en: "ALL", count: total },
    ...deptOrder.map((id) => ({
      id,
      ko: FACULTY_DEPT_META[id].ko,
      en: FACULTY_DEPT_META[id].en,
      count: byDept.get(id) ?? 0,
    })),
  ];

  const quotes = toQuoteList(memberRows);

  return { cover, members, depts, quotes };
}

// admin 목록 — 전체 교수(커버 포함), 정렬 순서순.
export async function listFacultyForAdmin(): Promise<Faculty[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("faculty")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as FacultyRow[]).map(rowToFaculty);
}

// admin 수정 폼용 — 단일 교수 전체 컬럼.
export async function getFacultyMemberForEdit(
  id: string,
): Promise<Faculty | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("faculty")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToFaculty(data as FacultyRow);
}

// 공개 시간표 — sort_order→day→time 순.
export async function getFacultyTimetable(): Promise<FacultyTimetableItem[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("faculty_timetable")
    .select("day, time, course, prof, room, host")
    .order("sort_order", { ascending: true })
    .order("day", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as TimetableRow[]).map(toTimetableItem);
}

// admin 목록 — 전체, sort_order순.
export type TimetableAdminRow = {
  id: string;
  day: string;
  time: string;
  course: string;
  prof: string;
  room: string;
  host: boolean;
  sortOrder: number;
};

export async function listTimetableForAdmin(): Promise<TimetableAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("faculty_timetable")
    .select("id, day, time, course, prof, room, host, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    day: r.day,
    time: r.time,
    course: r.course,
    prof: r.prof,
    room: r.room,
    host: r.host,
    sortOrder: r.sort_order,
  }));
}

export async function getTimetableRowForEdit(
  id: string,
): Promise<TimetableAdminRow | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("faculty_timetable")
    .select("id, day, time, course, prof, room, host, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  return {
    id: r.id,
    day: r.day,
    time: r.time,
    course: r.course,
    prof: r.prof,
    room: r.room,
    host: r.host,
    sortOrder: r.sort_order,
  };
}
