import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatDate, formatAuthor } from "@/lib/format";
import { isoToKstDate } from "@/lib/datetime";
import {
  toTrainingPostView,
  toUpcomingView,
  toNextView,
  toPastView,
  buildArchive,
  formatEventDates,
  parseSpeakers,
  parseSchedule,
  TRAINING_CATEGORIES_KO,
  CATEGORY_EN,
  type TrainingRow,
  type EventRow,
} from "@/lib/training";
import type {
  TrainingPost,
  TrainingCategory,
  UpcomingTraining,
  NextTraining,
  PastTraining,
  TrainingSpeaker,
  ScheduleDay,
  ArchiveYear,
} from "@/lib/training-data";

const SECTION = "training" as const;

// PostgREST 임베드는 to-one도 환경에 따라 배열로 올 수 있어 단일 객체로 정규화.
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type TrainingListData = {
  pinned: TrainingPost | null;
  posts: TrainingPost[];
  categories: TrainingCategory[];
};

export async function getTrainingListData(): Promise<TrainingListData> {
  const now = new Date();
  const supabase = await createSupabaseServer();

  // 목록 쿼리: 작성자 임베드 + 댓글 카운트 + 첨부 카운트
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, category, title, excerpt, view_count, created_at, is_pinned, author:profiles(name, title), comments(count), attachments(count)",
    )
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  let pinned: TrainingPost | null = null;
  const list: TrainingPost[] = [];
  for (const r of rows) {
    const author = one(r.author);
    const row: TrainingRow = {
      id: r.id,
      category: r.category,
      title: r.title,
      excerpt: r.excerpt,
      viewCount: r.view_count,
      createdAt: new Date(r.created_at),
      authorName: author?.name ?? null,
      authorTitle: author?.title ?? null,
      commentCount: r.comments[0]?.count ?? 0,
      attachCount: r.attachments[0]?.count ?? 0,
    };
    const view = toTrainingPostView(row, now);
    if (r.is_pinned && !pinned) pinned = view;
    else list.push(view);
  }

  // 카테고리 카운트 집계 — 목록 쿼리 결과 재사용
  const byCat = new Map<string, number>();
  for (const r of rows) {
    if (r.category) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  }
  const total = rows.length;
  const categories: TrainingCategory[] = [
    { ko: "전체", en: "ALL", count: total },
    ...TRAINING_CATEGORIES_KO.map((ko) => ({
      ko,
      en: CATEGORY_EN[ko],
      count: byCat.get(ko) ?? 0,
    })),
  ];

  return { pinned, posts: list, categories };
}

export type TrainingDetail = {
  id: string;
  category: string | null;
  title: string;
  body: string | null;
  author: string;
  date: string;
  views: number;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
  comments: { id: string; authorId: string | null; author: string; date: string; body: string }[];
};

export async function getTrainingPost(id: string): Promise<TrainingDetail | null> {
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select("id, category, title, body, view_count, created_at, author:profiles(name, title)")
    .eq("id", id)
    .eq("section", SECTION)
    .eq("is_published", true)
    .maybeSingle();
  if (!r) return null;

  // 첨부 파일 조회
  const { data: atts } = await supabase
    .from("attachments")
    .select("id, original_name, size_bytes, mime")
    .eq("post_id", id);

  // 댓글 + 작성자 조회
  const { data: cms } = await supabase
    .from("comments")
    .select("id, author_id, body, created_at, author:profiles(name, title)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const author = one(r.author);
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    body: r.body,
    author: formatAuthor(author?.name ?? null, author?.title ?? null),
    date: formatDate(new Date(r.created_at)),
    views: r.view_count,
    attachments: (atts ?? []).map((a) => ({
      id: a.id,
      name: a.original_name,
      sizeBytes: Number(a.size_bytes),
      mime: a.mime,
    })),
    comments: (cms ?? []).map((c) => {
      const ca = one(c.author);
      return {
        id: c.id,
        authorId: c.author_id,
        author: formatAuthor(ca?.name ?? null, ca?.title ?? null),
        date: formatDate(new Date(c.created_at)),
        body: c.body,
      };
    }),
  };
}

export async function incrementTrainingView(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: id });
}

export type TrainingEditData = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  body: string | null;
  isPinned: boolean;
  eventDate: string | null;
  location: string | null;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
};

export async function getTrainingPostForEdit(id: string): Promise<TrainingEditData | null> {
  const supabase = await createSupabaseServer();

  const { data: r } = await supabase
    .from("posts")
    .select("id, category, title, excerpt, body, is_pinned, event_date, meta")
    .eq("id", id)
    .eq("section", SECTION)
    .maybeSingle();
  if (!r) return null;

  const { data: atts } = await supabase
    .from("attachments")
    .select("id, original_name, size_bytes, mime")
    .eq("post_id", id);

  return {
    id: r.id,
    category: r.category,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    isPinned: r.is_pinned,
    eventDate: r.event_date ? isoToKstDate(r.event_date) : null,
    location:
      r.meta && typeof r.meta === "object" && !Array.isArray(r.meta)
        ? ((r.meta as Record<string, unknown>).location as string | undefined) ?? null
        : null,
    attachments: (atts ?? []).map((a) => ({
      id: a.id,
      name: a.original_name,
      sizeBytes: Number(a.size_bytes),
      mime: a.mime,
    })),
  };
}

export type TrainingEventsData = {
  featured: UpcomingTraining | null;
  next: NextTraining[];
  past: PastTraining[];
  archive: ArchiveYear[];
  speakers: TrainingSpeaker[];
  schedule: ScheduleDay[];
};

export async function getTrainingEventsData(): Promise<TrainingEventsData> {
  const now = new Date();
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, subtitle, theme, category, badge, starts_at, ends_at, place, note, cover, capacity, registered, fee, deadline, speakers, schedule, participants",
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];

  // 평면 행 + featured용 schedule 원본 보관
  const events = rows.map((r) => {
    const row: EventRow = {
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      theme: r.theme,
      category: r.category,
      badge: r.badge,
      startsAt: new Date(r.starts_at),
      endsAt: new Date(r.ends_at),
      place: r.place,
      note: r.note,
      cover: r.cover,
      capacity: r.capacity,
      registered: r.registered,
      fee: r.fee,
      deadline: r.deadline ? isoToKstDate(r.deadline) : null,
      speakers: parseSpeakers(r.speakers),
      participants: r.participants,
    };
    return { row, schedule: parseSchedule(r.schedule) };
  });

  // 예정(종료가 아직 안 지남) vs 지난
  const upcoming = events.filter((e) => e.row.endsAt.getTime() >= now.getTime());
  const pastAll = events
    .filter((e) => e.row.endsAt.getTime() < now.getTime())
    .sort((a, b) => b.row.startsAt.getTime() - a.row.startsAt.getTime());

  // featured = 예정 중 가장 임박(starts_at 오름차순 정렬이므로 첫 항목)
  const featuredEntry = upcoming[0] ?? null;
  const featured = featuredEntry ? toUpcomingView(featuredEntry.row, now) : null;
  const speakers = featuredEntry ? featuredEntry.row.speakers : [];
  const schedule = featuredEntry ? featuredEntry.schedule : [];

  const next = upcoming.slice(1).map((e) => toNextView(e.row));
  const past = pastAll.slice(0, 4).map((e, i) => toPastView(e.row, i));
  const archive = buildArchive(pastAll.map((e) => e.row));

  return { featured, next, past, archive, speakers, schedule };
}

// ── admin: 미공개 포함 전체 목록 ──
export type AdminEventRow = {
  id: string;
  title: string;
  dates: string; // "YYYY.MM.DD — MM.DD"
  status: "예정" | "지난";
  place: string;
  isPublished: boolean;
};

export async function listEventsForAdmin(): Promise<AdminEventRow[]> {
  const now = Date.now();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, place, is_published")
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const start = new Date(r.starts_at);
    const end = new Date(r.ends_at);
    return {
      id: r.id,
      title: r.title,
      dates: formatEventDates(start, end),
      status: end.getTime() >= now ? "예정" : "지난",
      place: r.place ?? "",
      isPublished: r.is_published,
    };
  });
}

// ── admin: 편집 폼 prefill ──
export type EventEditData = {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  category: string;
  badge: string;
  startsAt: string; // "YYYY-MM-DD"
  endsAt: string;
  place: string;
  note: string;
  cover: string;
  capacity: string; // input value(빈 문자열 허용)
  registered: string;
  participants: string;
  fee: string;
  deadline: string; // "YYYY-MM-DD" or ""
  isPublished: boolean;
  speakers: { name: string; role: string; affiliation: string; talks: number }[];
  schedule: ScheduleDay[];
};

export async function getEventForEdit(id: string): Promise<EventEditData | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("events")
    .select(
      "id, title, subtitle, theme, category, badge, starts_at, ends_at, place, note, cover, capacity, registered, participants, fee, deadline, is_published, speakers, schedule",
    )
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  const numStr = (n: number | null) => (n == null ? "" : String(n));
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? "",
    theme: r.theme ?? "",
    category: r.category ?? "",
    badge: r.badge ?? "",
    startsAt: isoToKstDate(r.starts_at),
    endsAt: isoToKstDate(r.ends_at),
    place: r.place ?? "",
    note: r.note ?? "",
    cover: r.cover,
    capacity: numStr(r.capacity),
    registered: numStr(r.registered),
    participants: numStr(r.participants),
    fee: r.fee ?? "",
    deadline: r.deadline ?? "",
    isPublished: r.is_published,
    speakers: parseSpeakers(r.speakers).map((s) => ({
      name: s.name,
      role: s.role,
      affiliation: s.affiliation,
      talks: s.talks,
    })),
    schedule: parseSchedule(r.schedule),
  };
}
