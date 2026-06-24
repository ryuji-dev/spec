"use server";
// faculty_timetable 생성/수정/삭제. admin 전용(RLS + requireAdmin), zod 검증.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";

const schema = z.object({
  day: z.string().trim().min(1, "요일을 입력해주세요."),
  time: z.string().trim().min(1, "시간을 입력해주세요."),
  course: z.string().trim().min(1, "강좌명을 입력해주세요."),
  prof: z.string().trim().min(1, "교수명을 입력해주세요."),
  room: z.string().trim().min(1, "강의실을 입력해주세요."),
  host: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

export interface TimetableFormState {
  error?: string;
}

function parse(formData: FormData) {
  return schema.safeParse({
    day: formData.get("day"),
    time: formData.get("time"),
    course: formData.get("course"),
    prof: formData.get("prof"),
    room: formData.get("room"),
    host: formData.get("host") === "on" || formData.get("host") === "true",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

function toRow(d: z.infer<typeof schema>) {
  return {
    day: d.day,
    time: d.time,
    course: d.course,
    prof: d.prof,
    room: d.room,
    host: d.host,
    sort_order: d.sortOrder,
  };
}

export async function createTimetable(
  _prev: TimetableFormState,
  formData: FormData,
): Promise<TimetableFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success)
    return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("faculty_timetable").insert(toRow(r.data));
  if (error) return { error: "저장에 실패했습니다." };
  redirect("/admin/timetable");
}

export async function updateTimetable(
  id: string,
  _prev: TimetableFormState,
  formData: FormData,
): Promise<TimetableFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success)
    return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("faculty_timetable")
    .update(toRow(r.data))
    .eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect("/admin/timetable");
}

export async function deleteTimetable(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("faculty_timetable").delete().eq("id", id);
  redirect("/admin/timetable");
}
