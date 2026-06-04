"use server";
// 신학원 교수 추가/수정/삭제. admin 전용, zod 검증, Drizzle.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { faculty } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/current-user";

const facultySchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  title: z.string().trim().min(1, "직함을 입력해주세요."),
  en: z.string().trim().min(1, "영문 표기를 입력해주세요."),
  degree: z.string().trim().min(1, "학위를 입력해주세요."),
  dept: z.enum(["ot", "nt", "st", "pt", "ch", "mn"]),
  tone: z.enum(["forest", "olive", "pine", "sage"]),
  field: z.string().trim().min(1, "전공 분야를 입력해주세요."),
  // 줄바꿈·쉼표 구분 입력 → 비어있지 않은 강좌명 배열
  teaches: z
    .string()
    .transform((s) =>
      s
        .split(/[\n,]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  quote: z.string().trim().min(1, "한 줄 인용을 입력해주세요."),
  years: z.coerce.number().int().min(0),
  papers: z.coerce.number().int().min(0),
  office: z.string().trim().min(1, "연구실을 입력해주세요."),
  hours: z.string().trim().min(1, "면담 시간을 입력해주세요."),
  isCover: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  about: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});

export interface FacultyFormState {
  error?: string;
}

function parse(formData: FormData) {
  return facultySchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    en: formData.get("en"),
    degree: formData.get("degree"),
    dept: formData.get("dept"),
    tone: formData.get("tone"),
    field: formData.get("field"),
    teaches: formData.get("teaches"),
    quote: formData.get("quote"),
    years: formData.get("years"),
    papers: formData.get("papers"),
    office: formData.get("office"),
    hours: formData.get("hours"),
    isCover: formData.get("isCover") === "on" || formData.get("isCover") === "true",
    sortOrder: formData.get("sortOrder"),
    about: formData.get("about"),
  });
}

export async function createFaculty(
  _prev: FacultyFormState,
  formData: FormData,
): Promise<FacultyFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  await getDb().insert(faculty).values(r.data);
  redirect("/admin/faculty");
}

export async function updateFaculty(
  id: string,
  _prev: FacultyFormState,
  formData: FormData,
): Promise<FacultyFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  await getDb().update(faculty).set(r.data).where(eq(faculty.id, id));
  redirect("/admin/faculty");
}

export async function deleteFaculty(id: string): Promise<void> {
  await requireAdmin();
  await getDb().delete(faculty).where(eq(faculty.id, id));
  redirect("/admin/faculty");
}
