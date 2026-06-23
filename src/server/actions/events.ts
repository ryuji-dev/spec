"use server";
// events 생성/수정/삭제. admin 전용(events RLS + requireAdmin 재확인), zod 검증.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/current-user";
import { SpeakerSchema, ScheduleDaySchema, COVER_KINDS } from "@/lib/training";
import { kstDateStartToIso, kstDateEndToIso } from "@/lib/datetime";
import type { Json } from "@/lib/database.types";

const numNullable = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length ? Number(v) : null))
  .refine(
    (v) => v == null || (Number.isInteger(v) && v >= 0),
    "숫자는 0 이상의 정수여야 합니다.",
  );

const optText = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null);

const eventSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  subtitle: optText,
  theme: optText,
  category: optText,
  badge: optText,
  startsAt: z.string().trim().min(1, "시작일을 입력해주세요."),
  endsAt: z.string().trim().min(1, "종료일을 입력해주세요."),
  place: optText,
  note: optText,
  cover: z.enum(COVER_KINDS as [string, ...string[]]),
  capacity: numNullable,
  registered: numNullable,
  participants: numNullable,
  fee: optText,
  deadline: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  isPublished: z.coerce.boolean(),
  speakers: z.string().transform((v, ctx) => {
    try {
      return z.array(SpeakerSchema).parse(JSON.parse(v || "[]"));
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "강사 정보 형식이 올바르지 않습니다.",
      });
      return z.NEVER;
    }
  }),
  schedule: z.string().transform((v, ctx) => {
    try {
      return z.array(ScheduleDaySchema).parse(JSON.parse(v || "[]"));
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "일정표 형식이 올바르지 않습니다.",
      });
      return z.NEVER;
    }
  }),
});

export interface EventFormState {
  error?: string;
}

function parse(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    theme: formData.get("theme"),
    category: formData.get("category"),
    badge: formData.get("badge"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    place: formData.get("place"),
    note: formData.get("note"),
    cover: formData.get("cover"),
    capacity: formData.get("capacity"),
    registered: formData.get("registered"),
    participants: formData.get("participants"),
    fee: formData.get("fee"),
    deadline: formData.get("deadline"),
    isPublished:
      formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
    speakers: formData.get("speakers") ?? "[]",
    schedule: formData.get("schedule") ?? "[]",
  });
}

function toRow(d: z.infer<typeof eventSchema>) {
  return {
    title: d.title,
    subtitle: d.subtitle,
    theme: d.theme,
    category: d.category,
    badge: d.badge,
    starts_at: kstDateStartToIso(d.startsAt),
    ends_at: kstDateEndToIso(d.endsAt),
    place: d.place,
    note: d.note,
    cover: d.cover,
    capacity: d.capacity,
    registered: d.registered,
    participants: d.participants,
    fee: d.fee,
    deadline: d.deadline,
    is_published: d.isPublished,
    speakers: d.speakers as unknown as Json,
    schedule: d.schedule as unknown as Json,
  };
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success)
    return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("events")
    .insert(toRow(r.data))
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  redirect(`/admin/events/${data.id}/edit`);
}

export async function updateEvent(
  id: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success)
    return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("events").update(toRow(r.data)).eq("id", id);
  if (error) return { error: "수정에 실패했습니다." };
  redirect("/admin/events");
}

export async function deleteEvent(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("events").delete().eq("id", id);
  redirect("/admin/events");
}
