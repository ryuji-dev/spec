# 메인 사진타일 실이미지 연결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/main` 사진 섹션을 그라데이션 아트 mock에서 실제 업로드 이미지(이미지 첨부가 있는 최신 공개 글)로 대체한다.

**Architecture:** 기존 첨부 인프라(`attachments` 버킷·`readAttachment`·RLS `attachments_select`)를 그대로 재사용한다. `getHomeData`(anon)가 이미지 첨부 있는 공개 글을 골라 첫 이미지 id를 내려주고, 새 범용 라우트 `/api/files/[id]`가 service-role로 이미지를 inline 스트리밍하며, client 썸네일 래퍼가 `<img>`를 렌더하되 로드 실패 시 기존 `PhotoThumb`(그라데이션)으로 폴백한다. DB 스키마·RLS·admin UI 변경 없음.

**Tech Stack:** Next.js 16 App Router(Route Handler·Server Component·`'use client'`), supabase-js(PostgREST embed `!inner`), TypeScript strict.

**검증 방식:** 이 저장소는 테스트 러너가 없다. 각 작업은 `pnpm lint`(+ 필요 시 `pnpm build`)로 타입/린트를 검증하고, 마지막 Task 5에서 로컬 Supabase + Preview MCP로 e2e 확인한다.

---

### Task 1: 범용 다운로드 라우트 `/api/files/[id]`

기존 섹션별 라우트(`/api/training/files/[id]` 등)와 동일하게 동작하되 섹션 무관. `readAttachment`가 이미 섹션 무관(`is_published` 확인 포함)이라 그대로 호출한다.

**Files:**
- Create: `src/app/api/files/[id]/route.ts`

- [ ] **Step 1: 라우트 작성**

`src/app/api/files/[id]/route.ts`:

```ts
import { isUuid } from "@/lib/api";
import { readAttachment } from "@/server/uploads/core";

export const runtime = "nodejs";

// 섹션 무관 첨부 스트리밍 — 메인 사진타일 등 여러 섹션의 이미지를 첨부 id만으로 제공.
// readAttachment가 미게시(is_published=false) 글의 첨부는 null을 반환하므로 비공개 노출 없음.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not Found", { status: 404 });
  const file = await readAttachment(id);
  if (!file) return new Response("Not Found", { status: 404 });

  const fn = encodeURIComponent(file.originalName);
  // 이미지는 inline(미리보기), 그 외는 attachment 다운로드.
  const disposition = file.mime.startsWith("image/") ? "inline" : "attachment";
  return new Response(file.blob, {
    status: 200,
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${fn}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
```

- [ ] **Step 2: 린트·타입 검증**

Run: `pnpm lint`
Expected: 통과(에러 없음). `isUuid`(`@/lib/api`)·`readAttachment`(`@/server/uploads/core`)가 이미 존재하므로 import 해결됨.

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/files/[id]/route.ts
git commit -m "feat: 섹션 무관 첨부 스트리밍 라우트(/api/files/[id]) 추가"
```

---

### Task 2: home.ts 사진 쿼리를 이미지 첨부 기반으로 교체

`HomePhotoItem`에 `imageId`를 추가하고, 사진 쿼리를 "이미지 첨부 있는 최신 공개 글 7건"으로 바꾼다. `type`(그라데이션)은 폴백용으로 유지한다.

**Files:**
- Modify: `src/server/services/home.ts`

- [ ] **Step 1: `HomePhotoItem`에 `imageId` 추가**

`src/server/services/home.ts`의 `HomePhotoItem` 타입(현재 15–21행)을 아래로 교체:

```ts
export type HomePhotoItem = {
  id: string;
  imageId: string; // 첫 이미지 첨부 id → /api/files/{imageId}
  title: string;
  date: string;
  tag: string;
  type: PhotoTileType; // 이미지 로드 실패 시 폴백용 그라데이션 타입
};
```

- [ ] **Step 2: 사진 쿼리 교체**

`getHomeData` 내 `Promise.all`의 **세 번째 쿼리**(현재 photoRes — `.from("posts").select("id, title, category, section, created_at")...limit(7)`)를 아래로 교체:

```ts
    supabase
      .from("posts")
      .select("id, title, category, section, created_at, attachments!inner(id, mime, created_at)")
      .eq("is_published", true)
      .like("attachments.mime", "image/%")
      .order("created_at", { ascending: false })
      .limit(7),
```

- [ ] **Step 3: photos 매핑 교체**

`getHomeData` 내 `const photos: HomePhotoItem[] = (photoRes.data ?? []).map(...)` 블록(현재 117–123행)을 아래로 교체:

```ts
  const photos: HomePhotoItem[] = (photoRes.data ?? [])
    .map((r) => {
      const imgs = (r.attachments ?? []) as { id: string; mime: string; created_at: string }[];
      // 첫 이미지(업로드 순) 사용. !inner 필터로 최소 1건이 보장되지만 strict 대비 가드.
      const first = [...imgs].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
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
```

- [ ] **Step 4: 린트·빌드 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. (빌드까지 도는 이유 — 임베드 select 타입 추론·`as` 캐스팅이 strict에서 깨지지 않는지 확인)

- [ ] **Step 5: 커밋**

```bash
git add src/server/services/home.ts
git commit -m "feat: 메인 사진 쿼리를 이미지 첨부 보유 글 기반으로 교체"
```

---

### Task 3: client 썸네일 래퍼 `PhotoTileThumb`

실이미지 `<img>`를 렌더하고, `onError` 시 기존 `PhotoThumb`(그라데이션)으로 폴백하는 작은 client 컴포넌트.

**Files:**
- Create: `src/app/main/_components/PhotoTileThumb.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/app/main/_components/PhotoTileThumb.tsx`:

```tsx
"use client";
import { useState } from "react";
import type { PhotoTileType } from "@/lib/main-page-data";
import PhotoThumb from "./PhotoThumb";

// 실이미지 썸네일 — 로드 실패 시 브랜드 그라데이션(PhotoThumb)으로 폴백(graceful degradation).
export default function PhotoTileThumb({
  imageId,
  type,
  idPrefix,
}: {
  imageId: string;
  type: PhotoTileType;
  idPrefix: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <PhotoThumb type={type} idPrefix={idPrefix} />;
  return (
    // 사설 API 라우트(service-role 스트리밍) + 디자인 보존 위해 next/image 대신 img 사용.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/files/${imageId}`}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
```

- [ ] **Step 2: 린트·타입 검증**

Run: `pnpm lint`
Expected: 통과. (`@next/next/no-img-element` 경고는 inline disable로 억제됨)

- [ ] **Step 3: 커밋**

```bash
git add src/app/main/_components/PhotoTileThumb.tsx
git commit -m "feat: 사진타일 실이미지 썸네일 래퍼(onError 그라데이션 폴백) 추가"
```

---

### Task 4: 사진 섹션 컴포넌트의 썸네일 호출부 교체 (desktop + mobile)

`<PhotoThumb>` 직접 호출을 `<PhotoTileThumb>`로 교체하고 `imageId`를 전달한다. **레이아웃·className·캡션 마크업은 일절 변경하지 않는다**(디자인 보존). 소비처는 정확히 2개 파일.

**Files:**
- Modify: `src/app/main/_components/desktop/DesktopPhotoSection.tsx`
- Modify: `src/app/main/_components/mobile/PhotoSectionMobile.tsx`

- [ ] **Step 1: 데스크톱 import 교체**

`DesktopPhotoSection.tsx` 2행 `import PhotoThumb from "../PhotoThumb";` 를 아래로 교체:

```tsx
import PhotoTileThumb from "../PhotoTileThumb";
```

- [ ] **Step 2: 데스크톱 3개 호출부 교체**

같은 파일의 `<PhotoThumb ... />` 3곳을 각각 아래로 교체(나머지 마크업은 그대로):

```tsx
          <PhotoTileThumb imageId={featured.imageId} type={featured.type} idPrefix={`d-feat-${featured.id}`} />
```
```tsx
            <PhotoTileThumb imageId={t.imageId} type={t.type} idPrefix={`d-mid-${t.id}`} />
```
```tsx
            <PhotoTileThumb imageId={t.imageId} type={t.type} idPrefix={`d-sml-${t.id}`} />
```

- [ ] **Step 3: 모바일 import 교체**

`PhotoSectionMobile.tsx` 2행 `import PhotoThumb from "../PhotoThumb";` 를 아래로 교체:

```tsx
import PhotoTileThumb from "../PhotoTileThumb";
```

- [ ] **Step 4: 모바일 1개 호출부 교체**

같은 파일의 `<PhotoThumb type={tile.type} idPrefix={`m-${tile.id}-${size}`} />`(27행)를 아래로 교체:

```tsx
        <PhotoTileThumb imageId={tile.imageId} type={tile.type} idPrefix={`m-${tile.id}-${size}`} />
```

- [ ] **Step 5: 린트·빌드 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. 두 섹션 모두 `imageId`를 `HomePhotoItem`에서 받으므로 타입 에러 없음. (`PhotoThumb`은 이제 `PhotoTileThumb`에서만 import됨 — 미사용 경고 없음)

- [ ] **Step 6: 커밋**

```bash
git add src/app/main/_components/desktop/DesktopPhotoSection.tsx src/app/main/_components/mobile/PhotoSectionMobile.tsx
git commit -m "feat: 메인 사진 섹션 썸네일을 실이미지 래퍼로 교체"
```

---

### Task 5: 로컬 e2e 검증 및 정리

로컬 Supabase에서 실제 업로드 → `/main` 노출 → 폴백을 확인하고, 테스트 데이터를 원복한다.

**Files:** 없음(검증·문서만)

- [ ] **Step 1: 로컬 스택·개발 서버 기동**

Run: `npx supabase status`(미기동 시 `colima start && npx supabase start`), Preview MCP `preview_start`로 dev 서버 기동.

- [ ] **Step 2: 정상 경로 확인**

admin으로 로그인 → committee 또는 training 글 작성/수정에서 이미지(png/jpg) 1장 업로드(또는 service-role 스크립트로 시드) → `/main` 이동.
Expected: 사진 섹션에 해당 글이 타일로 노출되고, `<img src="/api/files/...">`가 실이미지를 렌더(Preview MCP `preview_snapshot`의 DOM에 `img` 존재, `preview_network`에서 `/api/files/{id}` 200·`Content-Type: image/...`).

- [ ] **Step 3: 폴백 경로 확인**

`preview_eval`로 사진 타일의 `img.src`를 없는 UUID(`/api/files/00000000-0000-4000-8000-000000000000`)로 바꿔 `error` 이벤트 유발 → 그라데이션(`svg`)으로 교체되는지 확인. (또는 코드 리뷰로 `onError` 경로 확인)
Expected: 깨진-이미지 아이콘 대신 `PhotoThumb` SVG 렌더.

- [ ] **Step 4: 빈 상태 확인(선택)**

이미지 첨부 글이 0건일 때 사진 섹션이 숨겨지는지 확인(기존 `photos.length === 0` 분기).

- [ ] **Step 5: 테스트 데이터 정리**

검증용으로 추가한 글/첨부를 삭제해 로컬 DB를 원복(첨부는 글 삭제 시 cascade·Storage 정리).

- [ ] **Step 6: 최종 검증·문서 커밋**

Run: `pnpm lint && pnpm build`
Expected: 통과.

```bash
git add docs/superpowers/specs/2026-06-16-main-photo-real-images-design.md docs/superpowers/plans/2026-06-16-main-photo-real-images.md
git commit -m "docs: 메인 사진타일 실이미지 설계·실행 plan 추가"
```

---

## Self-Review

- **Spec 커버리지**: 범용 라우트(Task 1) ↔ spec §4.B / 결정(서빙 라우트 A). home 쿼리·imageId(Task 2) ↔ §4.A / Q1·Q2. client 폴백 래퍼(Task 3) ↔ §4.C / Q3. 섹션 교체(Task 4) ↔ §4.D. e2e·정리(Task 5) ↔ §6. 누락 없음.
- **Placeholder 스캔**: 모든 코드 step에 실제 코드 포함, TBD/TODO 없음.
- **타입 일관성**: `HomePhotoItem.imageId: string`(Task 2 정의) ↔ Task 4의 `imageId={...}` 전달, `PhotoTileThumb` props `{ imageId, type, idPrefix }`(Task 3) ↔ Task 4 호출 시그니처 일치. `PhotoTileType` import 경로(`@/lib/main-page-data`) 일관.
- **스키마/RLS/디자인**: 무변경 — 라우트·서비스·컴포넌트 계층만 손댐. 마크업/className 보존.
