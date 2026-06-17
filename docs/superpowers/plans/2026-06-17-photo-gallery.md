# 전체 사진첩(/gallery) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미지 첨부가 있는 공개 글의 대표 이미지를 최신순 그리드로 보여주는 공개 사진첩 페이지(`/gallery`)를 만들고, 흩어진 사진 진입점을 연결한다.

**Architecture:** `/notice`와 동일한 lean 신규 페이지 패턴 — `getDeviceType`로 데스크톱/모바일 분기, 읽기는 신규 서비스 `getGalleryData()`가 supabase-js로 수행(RLS 공개 읽기). 타일은 기존 `PhotoTileThumb`(실이미지+그라데이션 폴백)을 재사용하고 `<Link>`로 글 상세에 연결. 스키마·RLS·Route Handler 변경 없음(`/api/files/[id]` 재사용).

**Tech Stack:** Next.js 16 App Router(async Server Component), TypeScript strict, supabase-js, CSS Modules, Forest 팔레트 CSS 변수.

> **검증 방식:** 이 저장소는 단위 테스트 러너가 없다. 각 태스크는 `pnpm lint && pnpm build`(타입·린트) + 최종 태스크의 브라우저 e2e로 검증한다. 커밋 메시지는 Conventional Commits prefix + 한국어, 끝에 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**생성:**
- `src/server/services/gallery.ts` — `getGalleryData()` + `GalleryTile` 타입 + 섹션→경로/라벨/그라데이션 매핑
- `src/app/gallery/page.tsx` — device-split 진입점
- `src/app/gallery/_components/desktop/GalleryDesktop.tsx` + `GalleryDesktop.module.css`
- `src/app/gallery/_components/mobile/GalleryMobile.tsx` + `GalleryMobile.module.css`

**수정:**
- `src/app/main/_components/desktop/DesktopPhotoSection.tsx` — "전체 사진첩 →" 버튼 → `<Link href="/gallery">`
- `src/lib/main-page-data.ts` — 푸터 "사진첩" 항목에 `href:"/gallery"`
- `src/app/main/_components/mobile/SectionHeader.tsx` — `actionHref?` 옵션 추가(Link화)
- `src/app/main/_components/mobile/MobilePage.tsx` — 사진 헤더에 `actionHref="/gallery"` 전달

---

## Task 1: 사진첩 데이터 서비스

**Files:**
- Create: `src/server/services/gallery.ts`

- [ ] **Step 1: 서비스 작성**

`src/server/services/gallery.ts`:
```ts
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatDate } from "@/lib/format";
import type { PhotoTileType } from "@/lib/main-page-data";

export type GalleryTile = {
  postId: string;
  imageId: string; // 첫 이미지 첨부 id → /api/files/{imageId}
  title: string;
  date: string; // formatDate(created_at)
  tag: string; // category ?? 섹션 라벨
  type: PhotoTileType; // 이미지 로드 실패 시 그라데이션 폴백
  href: string; // 섹션→경로 매핑 + /{postId}
};

const SECTION_LABEL: Record<string, string> = {
  notice: "공지",
  board: "게시판",
  committee: "교육위원회",
  training: "강습회",
  webzine: "웹진",
  resource: "자료",
};

// 섹션 → 사진 그라데이션 타입(home.ts와 동일 규칙).
const SECTION_PHOTO_TYPE: Record<string, PhotoTileType> = {
  training: "camp",
  committee: "meeting",
  webzine: "book",
  board: "music",
  resource: "book",
  notice: "mountain",
};

// 섹션 → 공개 상세 경로. 'resource'는 라우트가 복수형(/resources).
const SECTION_ROUTE: Record<string, string> = {
  committee: "/committee",
  training: "/training",
  webzine: "/webzine",
  resource: "/resources",
  board: "/board",
  notice: "/notice",
};

export async function getGalleryData(): Promise<GalleryTile[]> {
  const supabase = await createSupabaseServer();
  // 이미지 첨부가 있는 공개 글 전체, 최신순(limit 없음).
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, section, created_at, attachments!inner(id, mime, created_at)")
    .eq("is_published", true)
    .like("attachments.mime", "image/%")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .map((r) => {
      const imgs = ((r.attachments ?? []) as { id: string; mime: string; created_at: string }[])
        .filter((img) => img.mime.startsWith("image/"));
      // 글당 첫 이미지(업로드 순). !inner로 최소 1건 보장되나 strict 대비 가드.
      const first = [...imgs].sort(
        (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
      )[0];
      if (!first) return null;
      const route = SECTION_ROUTE[r.section];
      if (!route) return null; // 상세 경로가 없는 섹션은 제외(링크 대상 없음)
      return {
        postId: r.id,
        imageId: first.id,
        title: r.title,
        date: formatDate(new Date(r.created_at)),
        tag: r.category ?? SECTION_LABEL[r.section] ?? "",
        type: SECTION_PHOTO_TYPE[r.section] ?? "mountain",
        href: `${route}/${r.id}`,
      };
    })
    .filter((t): t is GalleryTile => t !== null);
}
```

- [ ] **Step 2: 타입·린트 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과(에러 없음). (서비스는 Task 2에서 페이지가 import하기 전까지 미사용이나 빌드 시 타입 체크됨.)

- [ ] **Step 3: 커밋**

```bash
git add src/server/services/gallery.ts
git commit -m "$(cat <<'MSG'
feat: 사진첩 데이터 서비스(getGalleryData) 추가

이미지 첨부가 있는 공개 글의 대표 이미지를 최신순으로 모은다. 글당
첫 이미지를 쓰고, 섹션→상세경로 매핑으로 타일 링크를 만든다. home.ts
사진 쿼리와 동일 규칙. 스키마·RLS 무변경.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 2: /gallery 페이지 + 데스크톱 화면

**Files:**
- Create: `src/app/gallery/page.tsx`
- Create: `src/app/gallery/_components/desktop/GalleryDesktop.tsx`
- Create: `src/app/gallery/_components/desktop/GalleryDesktop.module.css`

- [ ] **Step 1: 페이지 진입점 작성**

`src/app/gallery/page.tsx`:
```tsx
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getGalleryData } from "@/server/services/gallery";
import DesktopNav from "@/app/_components/DesktopNav";
import GalleryDesktop from "./_components/desktop/GalleryDesktop";
import GalleryMobile from "./_components/mobile/GalleryMobile";

/** 공개 전체 사진첩 — 이미지 첨부가 있는 글의 대표 이미지를 최신순 그리드로. */
export default async function GalleryPage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const tiles = await getGalleryData();

  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <GalleryDesktop tiles={tiles} />
      </>
    );
  }
  return <GalleryMobile tiles={tiles} />;
}
```

> 주의: `GalleryMobile`은 Task 3에서 생성한다. Task 2만 단독 빌드하면 import 에러가 나므로, Task 2·3은 연속 실행하고 빌드 검증은 Task 3 끝에서 함께 한다. (Task 2 커밋 시점엔 `GalleryMobile`이 아직 없을 수 있으니 Task 2 빌드 검증은 생략하고 Task 3에서 통합 검증.)

- [ ] **Step 2: 데스크톱 화면 작성**

`src/app/gallery/_components/desktop/GalleryDesktop.tsx`:
```tsx
import Link from "next/link";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import PhotoTileThumb from "@/app/main/_components/PhotoTileThumb";
import type { GalleryTile } from "@/server/services/gallery";
import styles from "./GalleryDesktop.module.css";

const C = {
  bg: "var(--palette-bg)",
  muted: "var(--palette-muted)",
};

export default function GalleryDesktop({ tiles }: { tiles: GalleryTile[] }) {
  return (
    <>
      <PageHeroDesktop kicker="PHOTOS" title="사진첩" lead="교육위원회의 활동을 사진으로 모았습니다." />
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 96px", background: C.bg }}>
        {tiles.length === 0 ? (
          <p style={{ color: C.muted, padding: "48px 0", textAlign: "center" }}>등록된 사진이 없습니다.</p>
        ) : (
          <div className={styles.grid}>
            {tiles.map((t) => (
              <Link key={t.postId} href={t.href} className={styles.card}>
                <div className={styles.thumb}>
                  <PhotoTileThumb imageId={t.imageId} type={t.type} idPrefix={`g-d-${t.postId}`} />
                </div>
                <div className={styles.caption}>
                  <div className={styles.tag}>{t.tag}</div>
                  <div className={styles.title}>{t.title}</div>
                  <div className={styles.date}>{t.date}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 3: 데스크톱 CSS 작성**

`src/app/gallery/_components/desktop/GalleryDesktop.module.css`:
```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

@media (max-width: 880px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.card {
  display: block;
  text-decoration: none;
  color: inherit;
}

.thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 4px;
  background: var(--palette-surface);
}

.caption {
  padding: 12px 2px 0;
}

.tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--palette-primary);
}

.title {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--palette-ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.date {
  margin-top: 6px;
  font-size: 12px;
  color: var(--palette-muted);
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/gallery/page.tsx src/app/gallery/_components/desktop/
git commit -m "$(cat <<'MSG'
feat: 공개 사진첩 데스크톱 페이지(/gallery) 추가

device-split 진입점 + 데스크톱 그리드. PageHero·PhotoTileThumb 재사용,
타일 클릭 시 해당 글 상세로 이동. 빈 상태 메시지 포함.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 3: 모바일 화면

**Files:**
- Create: `src/app/gallery/_components/mobile/GalleryMobile.tsx`
- Create: `src/app/gallery/_components/mobile/GalleryMobile.module.css`

- [ ] **Step 1: 모바일 화면 작성**

`src/app/gallery/_components/mobile/GalleryMobile.tsx`:
```tsx
import Link from "next/link";
import { PageHeroMobile } from "@/app/_components/PageHero";
import PhotoTileThumb from "@/app/main/_components/PhotoTileThumb";
import BottomTabBar from "@/app/main/_components/mobile/BottomTabBar";
import type { GalleryTile } from "@/server/services/gallery";
import styles from "./GalleryMobile.module.css";

const C = {
  bg: "var(--palette-bg)",
  muted: "var(--palette-muted)",
};

export default function GalleryMobile({ tiles }: { tiles: GalleryTile[] }) {
  return (
    <>
      <PageHeroMobile kicker="PHOTOS" title="사진첩" lead="교육위원회의 활동 사진." />
      <main style={{ padding: "24px 20px 80px", background: C.bg, minHeight: "60vh" }}>
        {tiles.length === 0 ? (
          <p style={{ color: C.muted, padding: "40px 0", textAlign: "center" }}>등록된 사진이 없습니다.</p>
        ) : (
          <div className={styles.grid}>
            {tiles.map((t) => (
              <Link key={t.postId} href={t.href} className={styles.card}>
                <div className={styles.thumb}>
                  <PhotoTileThumb imageId={t.imageId} type={t.type} idPrefix={`g-m-${t.postId}`} />
                </div>
                <div className={styles.title}>{t.title}</div>
                <div className={styles.date}>{t.date}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomTabBar />
    </>
  );
}
```

- [ ] **Step 2: 모바일 CSS 작성**

`src/app/gallery/_components/mobile/GalleryMobile.module.css`:
```css
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.card {
  display: block;
  text-decoration: none;
  color: inherit;
}

.thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 4px;
  background: var(--palette-surface);
}

.title {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--palette-ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.date {
  margin-top: 4px;
  font-size: 11px;
  color: var(--palette-muted);
}
```

- [ ] **Step 3: 타입·린트·빌드 검증(Task 2·3 통합)**

Run: `pnpm lint && pnpm build`
Expected: 통과. 빌드 라우트 목록에 `/gallery`(ƒ Dynamic)가 보여야 함.

- [ ] **Step 4: 커밋**

```bash
git add src/app/gallery/_components/mobile/
git commit -m "$(cat <<'MSG'
feat: 공개 사진첩 모바일 화면 추가

모바일 2열 그리드 + 하단 BottomTabBar. PageHero·PhotoTileThumb 재사용.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 4: 진입 경로 연결

**Files:**
- Modify: `src/app/main/_components/desktop/DesktopPhotoSection.tsx`
- Modify: `src/lib/main-page-data.ts`
- Modify: `src/app/main/_components/mobile/SectionHeader.tsx`
- Modify: `src/app/main/_components/mobile/MobilePage.tsx`

- [ ] **Step 1: 데스크톱 "전체 사진첩 →" 버튼 → Link**

`src/app/main/_components/desktop/DesktopPhotoSection.tsx` 상단 import에 추가:
```tsx
import Link from "next/link";
```
그리고 다음 줄을
```tsx
        <button type="button" className={styles.allBtn}>전체 사진첩 →</button>
```
다음으로 교체(디자인 클래스 유지, `<a>` 밑줄만 제거):
```tsx
        <Link href="/gallery" className={styles.allBtn} style={{ textDecoration: "none" }}>전체 사진첩 →</Link>
```

- [ ] **Step 2: 데스크톱 푸터 "사진첩" 링크화**

`src/lib/main-page-data.ts`의 `FOOTER_COLUMNS` "소통" 컬럼에서
```ts
    items: [{ label: "공지사항", href: "/notice" }, { label: "사진첩" }, { label: "문의하기" }, { label: "제안 보내기" }],
```
를 다음으로 교체:
```ts
    items: [{ label: "공지사항", href: "/notice" }, { label: "사진첩", href: "/gallery" }, { label: "문의하기" }, { label: "제안 보내기" }],
```
(`DesktopFooter`가 `item.href`를 이미 `<Link>`로 렌더하므로 추가 변경 불필요.)

- [ ] **Step 3: SectionHeader에 actionHref 옵션 추가**

`src/app/main/_components/mobile/SectionHeader.tsx` 전체를 다음으로 교체:
```tsx
import Link from "next/link";
import { ReactNode } from "react";
import styles from "./SectionHeader.module.css";

type Props = {
  kicker: string;
  title: ReactNode;
  action?: string;
  actionHref?: string;
};

export default function SectionHeader({ kicker, title, action, actionHref }: Props) {
  const arrow = (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
  return (
    <div className={styles.header}>
      <div>
        <div className={styles.kicker}>{kicker}</div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      {action &&
        (actionHref ? (
          <Link href={actionHref} className={styles.action} style={{ textDecoration: "none" }}>
            {action}
            {arrow}
          </Link>
        ) : (
          <button className={styles.action} type="button">
            {action}
            {arrow}
          </button>
        ))}
    </div>
  );
}
```

- [ ] **Step 4: MobilePage 사진 헤더에 actionHref 전달**

`src/app/main/_components/mobile/MobilePage.tsx`에서
```tsx
        <SectionHeader kicker="RECENT · PHOTOS" title="최근 활동 모음" action="사진첩" />
```
를 다음으로 교체:
```tsx
        <SectionHeader kicker="RECENT · PHOTOS" title="최근 활동 모음" action="사진첩" actionHref="/gallery" />
```

- [ ] **Step 5: 타입·린트·빌드 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과.

- [ ] **Step 6: 커밋**

```bash
git add src/app/main/_components/desktop/DesktopPhotoSection.tsx src/lib/main-page-data.ts src/app/main/_components/mobile/SectionHeader.tsx src/app/main/_components/mobile/MobilePage.tsx
git commit -m "$(cat <<'MSG'
feat: 사진첩 진입 경로(메인 버튼·푸터·모바일 액션 → /gallery) 연결

데스크톱 "전체 사진첩 →" 버튼·푸터 "사진첩"·모바일 사진 헤더 액션을
/gallery로 연결한다. SectionHeader에 actionHref 옵션을 추가(없으면
기존 button 유지, 하위호환). 디자인 클래스 보존.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 5: 로컬 e2e 검증 + 정리

**Files:** (코드 변경 없음 — 검증·정리만)

- [ ] **Step 1: 시드 데이터 확인**

로컬 DB에 이미지 첨부가 있는 공개 글이 있어야 타일이 보인다. 없으면 admin 에디터(committee/training 등)로 이미지 1~2건 업로드하거나, 기존 시드 활용. (검증 후 임시 데이터는 정리.)

- [ ] **Step 2: 데스크톱 e2e**

`pnpm dev`(또는 preview) 기동, 뷰포트 1280에서:
- `/gallery` 접속 → 그리드 렌더, 캡션(태그·제목·날짜) 확인.
- 타일 클릭 → 올바른 섹션 상세(`/committee/{id}` 등)로 이동 확인.
- `/main` 사진 섹션의 "전체 사진첩 →" 클릭 → `/gallery` 이동.
- `/main` 푸터 "사진첩" 클릭 → `/gallery` 이동.

- [ ] **Step 3: 모바일 e2e**

모바일 UA(또는 뷰포트 375)로:
- `/gallery` → 2열 그리드 + 하단 탭바.
- `/main` 사진 헤더 "사진첩" 액션 클릭 → `/gallery` 이동.

- [ ] **Step 4: 폴백·빈 상태 확인**

- 이미지 로드 실패 시 그라데이션 폴백 표시(헤드리스 환경은 이미지 디코딩 한계가 있으므로 라우트가 유효한 바이트를 응답하는지로 갈음 가능).
- 사진이 0건일 때 "등록된 사진이 없습니다." 노출.

- [ ] **Step 5: 정리**

검증용 임시 업로드/스크립트 제거, 로컬 DB 원복.

---

## Self-Review (작성자 점검 완료)

- **Spec 커버리지:** spec §3(서비스)=Task1, §4(페이지·컴포넌트)=Task2·3, §5(진입점)=Task4, §7(테스트)=Task5. 누락 없음.
- **Placeholder:** 모든 코드 블록 실제 코드. TBD 없음.
- **타입 일관성:** `GalleryTile`(postId·imageId·title·date·tag·type·href)을 Task1에서 정의하고 Task2·3에서 동일 필드 사용. `PhotoTileThumb` props(`imageId`·`type`·`idPrefix`)·`PageHero` props(`kicker`·`title`·`lead`)·`getDeviceType` 시그니처 모두 기존 코드와 일치.
- **범위 밖:** BottomTabBar photo 탭·모바일 푸터·검색 버튼·페이지네이션·라이트박스 — 손대지 않음(spec §6).
