// 교역자수련회 게시판 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import { z } from "zod";
import { formatDate, formatAuthor } from "./format.ts";
import type {
  TrainingPost,
  TrainingCategoryKo,
  TrainingCategoryEn,
  UpcomingTraining,
  NextTraining,
  PastTraining,
  TrainingSpeaker,
  ScheduleDay,
  ArchiveYear,
  CoverKind,
} from "./training-data";

// 외부에서 @/lib/training 경로로 import하던 호환 유지
export { formatDate, formatAuthor } from "./format.ts";

// 한국어 카테고리 → 영문 라벨 (디자인 뷰모델 catEn 용)
export const CATEGORY_EN: Record<TrainingCategoryKo, TrainingCategoryEn> = {
  예정: "UPCOMING",
  신청: "OPEN",
  후기: "REVIEW",
  강의자료: "MATERIALS",
  "Q&A": "QNA",
};

export const TRAINING_CATEGORIES_KO: TrainingCategoryKo[] = [
  "예정",
  "신청",
  "후기",
  "강의자료",
  "Q&A",
];

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// 서비스가 만든 평면 행 → 디자인 TrainingPost 뷰모델
export type TrainingRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  authorName: string | null;
  authorTitle: string | null;
  commentCount: number;
  attachCount: number;
};

export function toTrainingPostView(row: TrainingRow, now: Date): TrainingPost {
  const cat = (
    row.category && row.category in CATEGORY_EN ? row.category : "Q&A"
  ) as TrainingCategoryKo;
  const name = row.authorName ?? "익명";
  return {
    id: row.id,
    cat,
    catEn: CATEGORY_EN[cat],
    title: row.title,
    excerpt: row.excerpt ?? "",
    author: formatAuthor(row.authorName, row.authorTitle),
    authorInit: name.slice(0, 1),
    date: formatDate(row.createdAt),
    views: row.viewCount,
    comments: row.commentCount,
    attach: row.attachCount > 0 ? row.attachCount : undefined,
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}

// ── 이벤트 표시값 파생 ──
export const COVER_KINDS: CoverKind[] = [
  "mountain-dawn", "autumn", "youth", "desert", "pine", "lake", "field",
];
function resolveCover(v: string | null): CoverKind {
  return v && (COVER_KINDS as string[]).includes(v) ? (v as CoverKind) : "mountain-dawn";
}

// "2026.05.18 — 05.20" (끝일은 MM.DD)
export function formatEventDates(start: Date, end: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const s = `${start.getFullYear()}.${p(start.getMonth() + 1)}.${p(start.getDate())}`;
  const e = `${p(end.getMonth() + 1)}.${p(end.getDate())}`;
  return `${s} — ${e}`;
}

// 시작일까지 남은 일수(음수면 0)
export function daysUntil(start: Date, now: Date): number {
  const ms = start.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

// "2025 가을" (월 < 7 → 봄, 그 외 가을)
export function seasonLabel(start: Date): string {
  return `${start.getFullYear()} ${start.getMonth() + 1 < 7 ? "봄" : "가을"}`;
}

// ── speakers / schedule jsonb 검증 ──
export const SpeakerSchema = z.object({
  name: z.string(),
  role: z.string(),
  affiliation: z.string(),
  talks: z.number(),
});
const ScheduleItemSchema = z.object({
  time: z.string(),
  what: z.string(),
  place: z.string(),
  tag: z.string(),
  highlight: z.boolean().optional(),
});
export const ScheduleDaySchema = z.object({
  day: z.string(),
  date: z.string(),
  items: z.array(ScheduleItemSchema),
});

export function parseSpeakers(v: unknown): TrainingSpeaker[] {
  const arr = z.array(SpeakerSchema).safeParse(v);
  if (!arr.success) return [];
  return arr.data.map((s) => ({
    name: s.name,
    role: s.role,
    init: s.name.slice(0, 1),
    talks: s.talks,
    affiliation: s.affiliation,
  }));
}

export function parseSchedule(v: unknown): ScheduleDay[] {
  const arr = z.array(ScheduleDaySchema).safeParse(v);
  return arr.success ? arr.data : [];
}

// ── 서비스가 만든 평면 이벤트 행 ──
export type EventRow = {
  id: string;
  title: string;
  subtitle: string | null;
  theme: string | null;
  category: string | null;
  badge: string | null;
  startsAt: Date;
  endsAt: Date;
  place: string | null;
  note: string | null;
  cover: string | null;
  capacity: number | null;
  registered: number | null;
  fee: string | null;
  deadline: string | null; // "YYYY.MM.DD" 포맷 완료 문자열
  speakers: TrainingSpeaker[];
  participants: number | null;
};

// 평면 행 → 예정 히어로 뷰
export function toUpcomingView(row: EventRow, now: Date): UpcomingTraining {
  return {
    id: row.id,
    badge: row.badge ?? "",
    cat: row.category ?? "",
    title: row.title,
    subtitle: row.subtitle ?? "",
    theme: row.theme ?? "",
    dates: formatEventDates(row.startsAt, row.endsAt),
    daysLeft: daysUntil(row.startsAt, now),
    place: row.place ?? "",
    speakers: row.speakers.map((s) => s.name),
    registered: row.registered ?? 0,
    capacity: row.capacity ?? 0,
    deadline: row.deadline ?? "",
    fee: row.fee ?? "",
    cover: resolveCover(row.cover),
  };
}

// 평면 행 → 후속 예정 뷰
export function toNextView(row: EventRow): NextTraining {
  return {
    id: row.id,
    badge: row.badge ?? "",
    cat: row.category ?? "",
    title: row.title,
    dates: formatEventDates(row.startsAt, row.endsAt),
    place: row.place ?? "",
    note: row.note ?? "",
    cover: resolveCover(row.cover),
  };
}

// 평면 행 → 지난 수련회 뷰. kind는 목록 인덱스로 배정(디자인 4분할).
const PAST_KINDS = ["big", "tall", "wide", "small"] as const;
export function toPastView(row: EventRow, index: number): PastTraining {
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    id: index + 1,
    season: seasonLabel(row.startsAt),
    title: row.title,
    date: `${row.startsAt.getFullYear()}.${p(row.startsAt.getMonth() + 1)}.${p(row.startsAt.getDate())}`,
    participants: row.participants ?? 0,
    cover: resolveCover(row.cover),
    kind: PAST_KINDS[index % PAST_KINDS.length],
  };
}

// 지난 이벤트들 → 연도별 아카이브("계절 · 제목")
export function buildArchive(rows: EventRow[]): ArchiveYear[] {
  const byYear = new Map<string, string[]>();
  for (const r of rows) {
    const y = String(r.startsAt.getFullYear());
    const label = `${r.startsAt.getMonth() + 1 < 7 ? "봄" : "가을"} · ${r.title}`;
    byYear.set(y, [...(byYear.get(y) ?? []), label]);
  }
  return [...byYear.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([y, items]) => ({ y, items }));
}
