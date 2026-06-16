// 메인 페이지 실데이터 — posts에서 공지·다가오는 일정·최신 활동을 조회·가공. RLS(공개 읽기) 적용.
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import type { PhotoTileType } from "@/lib/main-page-data";

export type HomeScheduleItem = {
  id: string;
  date: string;
  day: string; // 모바일 짧은 표기(일요일은 '주일')
  dayLong: string; // 데스크톱 표기(예: '월요일', 일요일은 '주일')
  title: string;
  loc: string;
  tag: string;
};
export type HomePhotoItem = {
  id: string;
  imageId: string; // 첫 이미지 첨부 id → /api/files/{imageId}
  title: string;
  date: string;
  tag: string;
  type: PhotoTileType; // 이미지 로드 실패 시 폴백용 그라데이션 타입
};
export type HomeData = {
  announcement: string | null;
  schedule: HomeScheduleItem[];
  photos: HomePhotoItem[];
};

const SECTION_LABEL: Record<string, string> = {
  notice: "공지",
  board: "게시판",
  committee: "교육위원회",
  training: "강습회",
  webzine: "웹진",
  resource: "자료",
};

// 섹션 → 사진 그라데이션 타입 매핑(실이미지 대신 브랜드 그라데이션 유지).
const SECTION_PHOTO_TYPE: Record<string, PhotoTileType> = {
  training: "camp",
  committee: "meeting",
  webzine: "book",
  board: "music",
  resource: "book",
  notice: "mountain",
};

function mmdd(iso: string): string {
  // en-CA는 파트별 추출용(로케일 무관) — KST 기준 MM.DD 생성.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const mo = parts.find((p) => p.type === "month")?.value ?? "";
  const da = parts.find((p) => p.type === "day")?.value ?? "";
  return `${mo}.${da}`;
}

// 일요일은 교회 용어 '주일'로 표기. short=모바일용, long=데스크톱용('월요일'…).
function dayLabels(iso: string): { short: string; long: string } {
  const s = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(new Date(iso)); // "일"~"토"
  if (s === "일") return { short: "주일", long: "주일" };
  return { short: s, long: `${s}요일` };
}

export async function getHomeData(): Promise<HomeData> {
  const supabase = await createSupabaseServer();
  const nowIso = new Date().toISOString();

  // 공개 홈페이지 — 쿼리 실패 시 500 대신 빈 섹션을 보여준다(graceful degradation).
  const [noticeRes, schedRes, photoRes] = await Promise.all([
    supabase
      .from("posts")
      .select("title")
      .eq("section", "notice")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("posts")
      .select("id, title, category, section, event_date, meta")
      .eq("is_published", true)
      .not("event_date", "is", null)
      .gte("event_date", nowIso)
      .order("event_date", { ascending: true })
      .limit(4),
    supabase
      .from("posts")
      .select("id, title, category, section, created_at, attachments!inner(id, mime, created_at)")
      .eq("is_published", true)
      .like("attachments.mime", "image/%")
      .order("created_at", { ascending: false })
      .limit(7),
  ]);

  const announcement = noticeRes.data?.[0]?.title ?? null;

  const schedule: HomeScheduleItem[] = (schedRes.data ?? []).map((r) => {
    const meta = (r.meta ?? null) as unknown as { location?: string } | null;
    // .not("event_date","is",null) 필터로 null이 제거되므로 단언 안전.
    const eventDate = r.event_date as string;
    const { short, long } = dayLabels(eventDate);
    return {
      id: r.id,
      date: mmdd(eventDate),
      day: short,
      dayLong: long,
      title: r.title,
      loc: meta?.location ?? "",
      tag: r.category ?? SECTION_LABEL[r.section] ?? "",
    };
  });

  const photos: HomePhotoItem[] = (photoRes.data ?? [])
    .map((r) => {
      const imgs = ((r.attachments ?? []) as { id: string; mime: string; created_at: string }[])
        .filter((img) => img.mime.startsWith("image/"));
      // 첫 이미지(업로드 순) 사용. !inner 필터로 최소 1건이 보장되지만 strict 대비 가드.
      const first = [...imgs].sort(
        (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
      )[0];
      if (!first) return null;
      return {
        id: r.id,
        imageId: first.id,
        title: r.title,
        date: mmdd(r.created_at),
        tag: r.category ?? SECTION_LABEL[r.section] ?? "",
        type: SECTION_PHOTO_TYPE[r.section] ?? "mountain",
      };
    })
    .filter((p): p is HomePhotoItem => p !== null);

  return { announcement, schedule, photos };
}
