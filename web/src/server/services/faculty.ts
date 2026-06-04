import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { faculty, type Faculty } from "@/server/db/schema";
import {
  toFacultyMemberView,
  toFacultyCoverView,
  FACULTY_DEPT_META,
  type FacultyRow,
} from "@/lib/faculty";
import type {
  FacultyMember,
  FacultyCover,
  FacultyDeptItem,
  FacultyDept,
} from "@/lib/faculty-data";

export type FacultyDirectoryData = {
  cover: FacultyCover | null;
  members: FacultyMember[];
  depts: FacultyDeptItem[];
};

// 디렉터리(공개) 데이터 — 커버 1명 + 일반 교수 목록 + 부서별 카운트.
export async function getFacultyDirectoryData(): Promise<FacultyDirectoryData> {
  const db = getDb();

  // 일반 교수(커버 제외) — 정렬 순서 → 생성 순
  const memberRows = await db
    .select()
    .from(faculty)
    .where(eq(faculty.isCover, false))
    .orderBy(asc(faculty.sortOrder), asc(faculty.createdAt));
  const members = memberRows.map((r) => toFacultyMemberView(r as FacultyRow));

  // 커버 교수 — 첫 행만(없으면 null)
  const [coverRow] = await db
    .select()
    .from(faculty)
    .where(eq(faculty.isCover, true))
    .limit(1);
  const cover = coverRow ? toFacultyCoverView(coverRow as FacultyRow) : null;

  // 부서별 카운트(커버 제외 기준)
  const counts = await db
    .select({ dept: faculty.dept, n: sql<number>`count(*)::int` })
    .from(faculty)
    .where(eq(faculty.isCover, false))
    .groupBy(faculty.dept);
  const byDept = new Map<string, number>(counts.map((c) => [c.dept, c.n]));

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

  return { cover, members, depts };
}

// admin 목록 — 전체 교수(커버 포함), 정렬 순서순.
export async function listFacultyForAdmin(): Promise<Faculty[]> {
  return getDb()
    .select()
    .from(faculty)
    .orderBy(asc(faculty.sortOrder), asc(faculty.createdAt));
}

// admin 수정 폼용 — 단일 교수 전체 컬럼.
export async function getFacultyMemberForEdit(
  id: string,
): Promise<Faculty | null> {
  const [r] = await getDb()
    .select()
    .from(faculty)
    .where(eq(faculty.id, id))
    .limit(1);
  return r ?? null;
}
