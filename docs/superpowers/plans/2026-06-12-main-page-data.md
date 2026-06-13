# 메인 페이지 실데이터 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **커밋 정책:** 커밋은 사용자 승인 후. 운영 DB 변경 없음(읽기 전용 연동).

**Goal:** `/main`의 공지·일정·사진타일 3개 섹션을 mock 상수 대신 `posts` 테이블 실데이터로 렌더한다. 디자인 마크업·CSS는 불변.

**Architecture:** 새 `server/services/home.ts`의 `getHomeData()`가 posts에서 공지·일정·최신글을 조회해 가공한다. `/main`(async Server Component)이 이를 받아 `DesktopPage`/`MobilePage`에 props로 주입하고, 동적 섹션 컴포넌트는 상수 import를 props 수신으로 교체한다. 정적 섹션·랜딩은 불변.

**Tech Stack:** Next.js 16 App Router, TS strict, supabase-js + RLS(posts 공개 읽기). 테스트 러너 없음 → lint/build + 로컬 렌더 검증.

## 빌드 안전 순서
consts를 먼저 지우면 빌드가 깨지므로: **Task 1(서비스 추가) → Task 2(데스크톱 props화, consts 유지) → Task 3(모바일 props화) → Task 4(consts 제거)** 순서로, 각 Task 종료 시 빌드 green.

## 파일 구조

```
src/server/services/home.ts                              # Create: getHomeData + 타입·헬퍼
src/app/main/page.tsx                                    # Modify: async + getHomeData → props
src/app/main/_components/desktop/DesktopPage.tsx         # Modify: home props → 하위 전달
src/app/main/_components/desktop/DesktopSchedule.tsx     # Modify: items props
src/app/main/_components/desktop/DesktopPhotoSection.tsx # Modify: photos props
src/app/main/_components/mobile/MobilePage.tsx           # Modify: home props → 하위 전달
src/app/main/_components/mobile/AnnouncementStrip.tsx    # Modify: text props
src/app/main/_components/mobile/ScheduleList.tsx         # Modify: items props
src/app/main/_components/mobile/PhotoSectionMobile.tsx   # Modify: photos props
src/lib/main-page-data.ts                                # Modify: 동적 3상수·구타입 제거(정적·PhotoTileType 유지)
```

---

### Task 1: `home.ts` 서비스

**Files:**
- Create: `src/server/services/home.ts`

- [ ] **Step 1: 서비스 작성**

`src/server/services/home.ts`:
```typescript
// 메인 페이지 실데이터 — posts에서 공지·다가오는 일정·최신 활동을 조회·가공. RLS(공개 읽기) 적용.
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import type { PhotoTileType } from "@/lib/main-page-data";

export type HomeScheduleItem = {
  date: string;
  day: string;
  title: string;
  loc: string;
  tag: string;
};
export type HomePhotoItem = {
  id: string;
  title: string;
  date: string;
  tag: string;
  type: PhotoTileType;
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
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const mo = parts.find((p) => p.type === "month")?.value ?? "";
  const da = parts.find((p) => p.type === "day")?.value ?? "";
  return `${mo}.${da}`;
}

function weekdayKo(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(new Date(iso));
}

export async function getHomeData(): Promise<HomeData> {
  const supabase = await createSupabaseServer();
  const nowIso = new Date().toISOString();

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
      .select("title, category, section, event_date, meta")
      .eq("is_published", true)
      .not("event_date", "is", null)
      .gte("event_date", nowIso)
      .order("event_date", { ascending: true })
      .limit(4),
    supabase
      .from("posts")
      .select("id, title, category, section, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(7),
  ]);

  const announcement = noticeRes.data?.[0]?.title ?? null;

  const schedule: HomeScheduleItem[] = (schedRes.data ?? []).map((r) => {
    const meta = (r.meta ?? null) as { location?: string } | null;
    const eventDate = r.event_date as string;
    return {
      date: mmdd(eventDate),
      day: weekdayKo(eventDate),
      title: r.title,
      loc: meta?.location ?? "",
      tag: r.category ?? SECTION_LABEL[r.section] ?? "",
    };
  });

  const photos: HomePhotoItem[] = (photoRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    date: mmdd(r.created_at as string),
    tag: r.category ?? SECTION_LABEL[r.section] ?? "",
    type: SECTION_PHOTO_TYPE[r.section] ?? "mountain",
  }));

  return { announcement, schedule, photos };
}
```

> 주의: `posts.meta`는 `Json` 타입이라 `as { location?: string } | null` 캐스팅 시 TS가 막으면 `as unknown as { location?: string } | null`로 조정. `r.section`은 enum 문자열.

- [ ] **Step 2: 검증** — Run: `pnpm lint && pnpm build` → 통과(미사용이라 빌드만 통과 확인).

- [ ] **Step 3: 커밋 (사용자 승인 후)**
```bash
git add src/server/services/home.ts
git commit -m "feat: 메인 페이지 실데이터 서비스(getHomeData) 추가"
```

---

### Task 2: 데스크톱 props화 (page + DesktopPage + 2 섹션)

**Files:**
- Modify: `src/app/main/page.tsx`
- Modify: `src/app/main/_components/desktop/DesktopPage.tsx`
- Modify: `src/app/main/_components/desktop/DesktopSchedule.tsx`
- Modify: `src/app/main/_components/desktop/DesktopPhotoSection.tsx`

- [ ] **Step 1: page.tsx — async + getHomeData**

`src/app/main/page.tsx` 전체를:
```tsx
import styles from "./main.module.css";
import { getHomeData } from "@/server/services/home";
import DesktopPage from "./_components/desktop/DesktopPage";
import MobilePage from "./_components/mobile/MobilePage";

/**
 * 서경노회 교육위원회 메인페이지. 공지·일정·사진타일은 posts 실데이터(getHomeData),
 * 히어로·메뉴·푸터 등은 정적. 헌법 [7]: 마크업·디자인 불변, 데이터 출처만 연동.
 */
export default async function MainPage() {
  const home = await getHomeData();
  return (
    <div className={styles.root}>
      <div className={styles.desktopOnly}>
        <DesktopPage home={home} />
      </div>
      <div className={styles.mobileOnly}>
        <MobilePage home={home} />
      </div>
    </div>
  );
}
```
> `MobilePage`는 Task 3에서 props를 받도록 수정한다. 이 Task 종료 시점에 `MobilePage`가 아직 `home`을 받지 않으면 TS가 "초과 props" 오류를 낼 수 있으므로, **Task 2에서는 `<MobilePage />`(props 없이)로 두고**, Task 3에서 `home={home}`를 추가한다. 즉 이 Step에서는 `<MobilePage />`로 작성:
```tsx
      <div className={styles.mobileOnly}>
        <MobilePage />
      </div>
```

- [ ] **Step 2: DesktopPage — home props 전달**

`src/app/main/_components/desktop/DesktopPage.tsx`:
```tsx
import type { HomeData } from "@/server/services/home";
import DesktopNav from "@/app/_components/DesktopNav";
import DesktopHero from "./DesktopHero";
import DesktopMenuGrid from "./DesktopMenuGrid";
import DesktopSchedule from "./DesktopSchedule";
import DesktopPhotoSection from "./DesktopPhotoSection";
import DesktopFooter from "./DesktopFooter";
import styles from "./DesktopPage.module.css";

// 데스크톱 페이지. 디자인 원본 desktop.jsx 섹션 순서 그대로. 일정·사진은 실데이터(props).
export default function DesktopPage({ home }: { home: HomeData }) {
  return (
    <div className={styles.shell}>
      <div className={styles.heroWrap}>
        <DesktopNav />
        <DesktopHero />
      </div>
      <DesktopMenuGrid />
      <DesktopSchedule items={home.schedule} />
      <DesktopPhotoSection photos={home.photos} />
      <DesktopFooter />
    </div>
  );
}
```

- [ ] **Step 3: DesktopSchedule — items props + 빈 상태**

`src/app/main/_components/desktop/DesktopSchedule.tsx`:
```tsx
import type { HomeScheduleItem } from "@/server/services/home";
import styles from "./DesktopSchedule.module.css";

export default function DesktopSchedule({ items }: { items: HomeScheduleItem[] }) {
  return (
    <div className={styles.section}>
      <div className={styles.grid}>
        <div>
          <div className={styles.kicker}>UPCOMING · DATES</div>
          <h2 className={styles.title}>
            다가오는
            <br />
            일정
          </h2>
          <div className={styles.summary}>
            교사 수련회, 연합 행사, 정기 모임 등<br />주요 일정을 한 눈에 확인하세요.
          </div>
        </div>
        <div>
          {items.length === 0 ? (
            <div className={styles.row}>
              <div className={styles.body}>
                <div className={styles.itemTitle}>예정된 일정이 없습니다.</div>
              </div>
            </div>
          ) : (
            items.map((s, i) => (
              <div key={i} className={styles.row}>
                <div className={styles.dateBox}>
                  <div className={styles.date}>{s.date}</div>
                  <div className={styles.day}>2026 · {s.day}요일</div>
                </div>
                <div className={styles.body}>
                  <div className={styles.itemTitle}>{s.title}</div>
                  <div className={styles.loc}>{s.loc}</div>
                </div>
                <div className={styles.tag}>{s.tag}</div>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <path d="M5 3l5 5-5 5" stroke="var(--palette-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: DesktopPhotoSection — photos props + 가변 개수 방어**

`src/app/main/_components/desktop/DesktopPhotoSection.tsx`:
```tsx
import type { HomePhotoItem } from "@/server/services/home";
import PhotoThumb from "../PhotoThumb";
import styles from "./DesktopPhotoSection.module.css";

export default function DesktopPhotoSection({ photos }: { photos: HomePhotoItem[] }) {
  if (photos.length === 0) return null;

  const [featured, ...rest] = photos;
  const middle = rest.slice(0, 2);
  const bottom = rest.slice(2, 6);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>RECENT · PHOTOS</div>
          <h2 className={styles.title}>최근 활동 모음</h2>
        </div>
        <button type="button" className={styles.allBtn}>전체 사진첩 →</button>
      </div>

      <div className={styles.featuredRow}>
        <div className={styles.featuredCard}>
          <PhotoThumb type={featured.type} idPrefix={`d-feat-${featured.id}`} />
          <div className={styles.featuredCaption}>
            <div className={styles.featuredKicker}>FEATURED · {featured.tag}</div>
            <div className={styles.featuredTitle}>{featured.title}</div>
            <div className={styles.featuredDate}>2026.{featured.date}</div>
          </div>
        </div>
        {middle.map((t) => (
          <div key={t.id} className={styles.midCard}>
            <PhotoThumb type={t.type} idPrefix={`d-mid-${t.id}`} />
            <div className={styles.midCaption}>
              <div className={styles.midKicker}>{t.tag}</div>
              <div className={styles.midTitle}>{t.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.bottomGrid}>
        {bottom.map((t) => (
          <div key={t.id} className={styles.smallCard}>
            <PhotoThumb type={t.type} idPrefix={`d-sml-${t.id}`} />
            <div className={styles.smallCaption}>
              <div className={styles.smallTitle}>{t.title}</div>
              <div className={styles.smallDate}>2026.{t.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 검증** — Run: `pnpm lint && pnpm build` → 통과(모바일은 아직 consts 사용 — 정상).

- [ ] **Step 6: 커밋 (사용자 승인 후)**
```bash
git add src/app/main/page.tsx "src/app/main/_components/desktop/"
git commit -m "feat: 메인 데스크톱 일정·사진 섹션 실데이터 연동"
```

---

### Task 3: 모바일 props화 (MobilePage + 3 섹션)

**Files:**
- Modify: `src/app/main/page.tsx` (MobilePage에 home 전달)
- Modify: `src/app/main/_components/mobile/MobilePage.tsx`
- Modify: `src/app/main/_components/mobile/AnnouncementStrip.tsx`
- Modify: `src/app/main/_components/mobile/ScheduleList.tsx`
- Modify: `src/app/main/_components/mobile/PhotoSectionMobile.tsx`

- [ ] **Step 1: page.tsx — MobilePage에 home 주입**

`src/app/main/page.tsx`의 `<MobilePage />`를 `<MobilePage home={home} />`로 변경.

- [ ] **Step 2: MobilePage — home props 전달**

`src/app/main/_components/mobile/MobilePage.tsx`에서 시그니처와 동적 섹션 호출만 변경:
```tsx
import type { HomeData } from "@/server/services/home";
import HeroMobile from "./HeroMobile";
import MobileStickyHeader from "@/app/_components/MobileStickyHeader";
import AnnouncementStrip from "./AnnouncementStrip";
import SectionHeader from "./SectionHeader";
import MenuCardGrid from "./MenuCardGrid";
import ScheduleList from "./ScheduleList";
import PhotoSectionMobile from "./PhotoSectionMobile";
import FooterMobile from "./FooterMobile";
import BottomTabBar from "./BottomTabBar";
import styles from "./MobilePage.module.css";

// 모바일 페이지. 디자인 원본 app.jsx 섹션 순서 그대로. 공지·일정·사진은 실데이터(props).
export default function MobilePage({ home }: { home: HomeData }) {
  return (
    <div className={styles.shell}>
      <MobileStickyHeader />
      <HeroMobile />
      <AnnouncementStrip text={home.announcement} />

      <SectionHeader
        kicker="CORE · MENU"
        title={
          <>
            가르침의 도구를
            <br />
            <em>가까이에.</em>
          </>
        }
      />
      <MenuCardGrid />

      <SectionHeader kicker="UPCOMING" title="다가오는 일정" action="전체보기" />
      <ScheduleList items={home.schedule} />

      <SectionHeader kicker="RECENT · PHOTOS" title="최근 활동 모음" action="사진첩" />
      <PhotoSectionMobile photos={home.photos} />

      <FooterMobile />
      <BottomTabBar />
    </div>
  );
}
```

- [ ] **Step 3: AnnouncementStrip — text props + 빈 상태**

`src/app/main/_components/mobile/AnnouncementStrip.tsx`:
```tsx
import styles from "./AnnouncementStrip.module.css";

export default function AnnouncementStrip({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className={styles.strip}>
      <div className={styles.tag}>NOTICE</div>
      <div className={styles.text}>{text}</div>
      <svg width="14" height="14" viewBox="0 0 14 14" className={styles.arrow}>
        <path d="M3 3l8 4-8 4 2-4-2-4z" fill="#fff" />
      </svg>
    </div>
  );
}
```

- [ ] **Step 4: ScheduleList — items props + 빈 상태**

`src/app/main/_components/mobile/ScheduleList.tsx`:
```tsx
import type { HomeScheduleItem } from "@/server/services/home";
import styles from "./ScheduleList.module.css";

export default function ScheduleList({ items }: { items: HomeScheduleItem[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.list}>
        <div className={styles.row} data-last="true">
          <div className={styles.body}>
            <div className={styles.title}>예정된 일정이 없습니다.</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.list}>
      {items.map((s, i) => (
        <div key={i} className={styles.row} data-last={i === items.length - 1 ? "true" : "false"}>
          <div className={styles.dateBox}>
            <div className={styles.date}>{s.date}</div>
            <div className={styles.day}>{s.day}</div>
          </div>
          <div className={styles.body}>
            <div className={styles.title}>{s.title}</div>
            <div className={styles.loc}>{s.loc}</div>
          </div>
          <div className={styles.tag}>{s.tag}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: PhotoSectionMobile — photos props + 빈 상태**

`src/app/main/_components/mobile/PhotoSectionMobile.tsx`:
```tsx
import type { HomePhotoItem } from "@/server/services/home";
import PhotoThumb from "../PhotoThumb";
import styles from "./PhotoSectionMobile.module.css";

// 모바일 사진 섹션 — feature 1 + small 4.
export default function PhotoSectionMobile({ photos }: { photos: HomePhotoItem[] }) {
  if (photos.length === 0) return null;
  const featured = photos[0];
  const smalls = photos.slice(1, 5);

  return (
    <div className={styles.wrap}>
      <PhotoCard tile={featured} size="large" />
      <div className={styles.smallGrid}>
        {smalls.map((t) => (
          <PhotoCard key={t.id} tile={t} size="small" />
        ))}
      </div>
    </div>
  );
}

function PhotoCard({ tile, size }: { tile: HomePhotoItem; size: "large" | "small" }) {
  return (
    <div className={styles.card}>
      <div className={styles.thumb} data-size={size}>
        <PhotoThumb type={tile.type} idPrefix={`m-${tile.id}-${size}`} />
        <div className={styles.tag}>{tile.tag}</div>
      </div>
      <div className={styles.body}>
        <div className={styles.title} data-size={size}>{tile.title}</div>
        <div className={styles.date}>2026.{tile.date}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 검증** — Run: `pnpm lint && pnpm build` → 통과(이제 consts는 정적 5개만 사용됨).

- [ ] **Step 7: 커밋 (사용자 승인 후)**
```bash
git add src/app/main/page.tsx "src/app/main/_components/mobile/"
git commit -m "feat: 메인 모바일 공지·일정·사진 섹션 실데이터 연동"
```

---

### Task 4: main-page-data.ts 정리

**Files:**
- Modify: `src/lib/main-page-data.ts`

- [ ] **Step 1: 동적 상수·구 타입 제거**

`src/lib/main-page-data.ts`에서 다음을 **삭제**:
- `export const ANNOUNCEMENT_TEXT = ...` (한 줄)
- `export type ScheduleItem = {...}` 와 `export const SCHEDULE_ITEMS: ScheduleItem[] = [...]`
- `export type PhotoTile = {...}` 와 `export const PHOTO_TILES: PhotoTile[] = [...]`

**유지**: `PhotoTileType`(home.ts·PhotoThumb이 사용), `HeroSlide`/`HERO_SLIDES`, `MenuItem`/`MENU_ITEMS`, `NavItem`/`NAV_ITEMS`, `FooterColumn`/`FOOTER_COLUMNS`, `BottomTab`/`BOTTOM_TABS`.

- [ ] **Step 2: 잔존 참조 확인** — Run:
```bash
grep -rn "ANNOUNCEMENT_TEXT\|SCHEDULE_ITEMS\|PHOTO_TILES\|\bScheduleItem\b\|\bPhotoTile\b" src/ | grep -v "HomeScheduleItem\|HomePhotoItem\|PhotoTileType"
```
Expected: 결과 없음(0건). 있으면 해당 파일 정리.

- [ ] **Step 3: 검증** — Run: `pnpm lint && pnpm build` → 통과.

- [ ] **Step 4: 커밋 (사용자 승인 후)**
```bash
git add src/lib/main-page-data.ts
git commit -m "refactor: 메인 동적 mock 상수 제거(실데이터 연동 완료)"
```

---

### Task 5: 로컬 e2e + 렌더 검증 (컨트롤러 실행)

- [ ] **Step 1:** 임시 시드(service-role 스크립트, 실행 후 정리)로 posts 삽입:
  - `section='notice'` 공지 1건(`is_pinned=true`)
  - `event_date` 미래 2~3건(일부 `meta={location:"..."}`)
  - 일반 글 여러 건(여러 section)
- [ ] **Step 2:** `pnpm dev` + Claude Preview로 `/main`:
  - 데스크톱: 일정·사진 섹션이 실데이터 반영
  - 모바일(resize): 공지 strip·일정·사진 반영
- [ ] **Step 3:** 빈 상태 확인 — 시드 정리 후 공지 strip 미표시, 일정 "예정된 일정이 없습니다", 사진 섹션 미표시.
- [ ] **Step 4:** 디자인 동일성(스크린샷)·`pnpm lint && pnpm build` 최종 확인. 결과 보고.

---

## Self-Review (작성자 점검)

- **Spec 커버리지**: getHomeData(공지·일정·사진)=T1, props화=T2·T3, consts 정리=T4, 빈 상태=각 컴포넌트, 검증=T5. 정적 섹션·랜딩 불변. 사진=메타+그라데이션(실이미지 제외) — spec과 일치.
- **타입 일관성**: `HomeData{announcement,schedule,photos}`, `HomeScheduleItem`, `HomePhotoItem`(T1 정의 → T2·T3 import type), `PhotoTileType` 유지(PhotoThumb·home.ts). page→DesktopPage/MobilePage `home` props 일관.
- **빌드 안전**: consts 제거(T4)는 모든 importer 교체(T2·T3) 이후 → 각 Task 빌드 green. T2에서 MobilePage는 props 없이 두고 T3에서 추가(초과 props TS오류 방지).
- **마크업 불변**: className·구조 동일, 데이터 출처·빈 상태 분기만 추가(헌법 [7]).
- **가변 개수 방어**: 사진 고정 인덱스 → 구조분해+slice로 1~7건 모두 안전, 0건 시 섹션 null.
