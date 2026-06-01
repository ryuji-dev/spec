# 자료공유 — 읽기 경로 구현 Plan (Plan A/2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 비로그인 포함 누구나 자료공유 목록·상세를 보고 파일을 다운로드(다운로드 수 집계)할 수 있다. 기존 목록 디자인 마크업은 100% 보존.

**Architecture:** 접근법 A(뷰모델 서비스 계층, committee와 동일). `posts`(section='resource') + `attachments` 재사용. 순수 매퍼(`lib/resource.ts`)가 DB 평면 행 → 디자인 `ResourceFile` 뷰모델로 변환, `server/services/resource.ts`가 Drizzle 조회 후 매퍼 호출, 목록 페이지가 props 주입. 다운로드는 공개 GET Route Handler가 파일 스트리밍 + 다운로드 수(viewCount) 증가.

**Tech Stack:** Next.js 16, Drizzle, PGlite(검증), TypeScript strict, pnpm. 마이그레이션 불필요(기존 스키마).

**검증:** `pnpm lint`/`build` + `resource:verify`(순수 매퍼) + 기존 verify 회귀 + Preview e2e(목록·상세·다운로드 카운트).

**범위 밖(Plan B):** admin 업로드/수정/삭제·에디터·업로드 정책·POST/DELETE Route Handler. (이 Plan은 seed로 파일을 미리 깔아 읽기·다운로드만 검증.)

---

## File Structure

- `web/src/lib/resource.ts` — 순수 매퍼·카테고리 맵·formatBytes·categoryToType (신규, 클라이언트 안전)
- `web/src/lib/resources-data.ts` — `ResourceFile.id` number→string (수정; mock 상수는 seed 참조용 유지)
- `web/src/server/services/resource.ts` — getResourceListData·getResourcePost·incrementResourceDownload (신규, server-only)
- `web/src/server/uploads/resource.ts` — UPLOAD_DIR + uploadPath (신규; Plan B가 storeAttachment 등 추가)
- `web/src/app/api/resources/files/[id]/route.ts` — 공개 GET 다운로드 + 카운트++ (신규)
- `web/src/app/resources/page.tsx` — 서비스 호출 → props 주입 (수정)
- `web/src/app/resources/_components/desktop/ResourcesDesktop.tsx` — props 수용 (수정)
- `web/src/app/resources/_components/desktop/FilterStrip.tsx` — categories props (수정)
- `web/src/app/resources/_components/desktop/ResourcesSidebar.tsx` — top props (수정)
- `web/src/app/resources/_components/desktop/FileGrid.tsx`·`FileList.tsx` — 카드 상세 라우팅(onOpen) (수정)
- `web/src/app/resources/_components/mobile/ResourcesMobile.tsx` — props 수용 (수정)
- `web/src/app/resources/[id]/page.tsx` — 상세 최소 화면 + 다운로드 (신규)
- `web/scripts/verify-resource.mjs` — 순수 매퍼 검증 (신규)
- `web/scripts/dev-db.mjs` — 자료 seed(글 + placeholder 파일 + 첨부 행) (수정)
- `web/package.json` — `resource:verify` 스크립트 (수정)

---

## Task 1: lib/resource.ts (순수 매퍼) + ResourceFile.id string + verify

**Files:** Create `web/src/lib/resource.ts`, `web/scripts/verify-resource.mjs`; Modify `web/src/lib/resources-data.ts`, `web/package.json`.

- [ ] **Step 1: 순수 매퍼 작성** — `web/src/lib/resource.ts`:

```ts
// 자료공유 — 클라이언트 안전 순수 유틸. DB·server-only 의존 없음.
import type {
  ResourceFile,
  ResourceFileType,
  ResourceFileCategory,
  ResourceCategoryKo,
  ResourceCategoryEn,
} from "./resources-data";

export const RESOURCE_CATEGORY_EN: Record<ResourceFileCategory, ResourceCategoryEn> = {
  설교PPT: "SLIDES",
  악보: "SCORES",
  교안: "CURRICULUM",
  문서: "DOCS",
  영상: "VIDEO",
  디자인: "DESIGN",
};

// 카테고리 → 파일 타입(아이콘). 카테고리와 1:1.
const CATEGORY_TYPE: Record<ResourceFileCategory, ResourceFileType> = {
  설교PPT: "ppt",
  악보: "score",
  교안: "pdf",
  문서: "doc",
  영상: "video",
  디자인: "image",
};

export const RESOURCE_CATEGORIES_KO: ResourceFileCategory[] = [
  "설교PPT",
  "악보",
  "교안",
  "문서",
  "영상",
  "디자인",
];

export function categoryToType(cat: string | null): ResourceFileType {
  return (cat && cat in CATEGORY_TYPE
    ? CATEGORY_TYPE[cat as ResourceFileCategory]
    : "doc");
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// bytes → "12.4 MB" / "186 MB" / "843 KB"
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type ResourceRow = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: Date;
  authorName: string | null;
  authorTitle: string | null;
  totalBytes: number;
};

export function toResourceFileView(row: ResourceRow, now: Date): ResourceFile {
  const name = row.authorName ?? "익명";
  const cat = (row.category && row.category in CATEGORY_TYPE
    ? row.category
    : "문서") as ResourceFileCategory;
  return {
    id: row.id,
    type: categoryToType(cat),
    cat,
    title: row.title,
    sub: row.excerpt ?? "",
    size: formatBytes(row.totalBytes),
    date: formatDate(row.createdAt),
    downloads: row.viewCount,
    by: row.authorTitle ? `${name} ${row.authorTitle}` : name,
    isNew: now.getTime() - row.createdAt.getTime() < NEW_WINDOW_MS,
  };
}
```

- [ ] **Step 2: ResourceFile.id를 string으로** — `web/src/lib/resources-data.ts`:
  - `ResourceFile` 타입 `id: number;` → `id: string;`
  - `LB_FILES`의 각 `id: 1`…`id: 8` → `id: "1"`…`"8"`.
  - `ResourceTopItem`(rank/title/downloads/type)·`LB_TOP`·`LB_COLLECTIONS`·`LB_CATEGORIES`는 그대로(변경 없음).

- [ ] **Step 3: 검증 스크립트** — `web/scripts/verify-resource.mjs`:

```js
// 자료공유 순수 매퍼 검증 — DB 없이.
//   실행: pnpm resource:verify
import {
  toResourceFileView,
  categoryToType,
  formatBytes,
  RESOURCE_CATEGORY_EN,
} from "../src/lib/resource.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

assert(categoryToType("악보") === "score", "악보 → score");
assert(categoryToType("영상") === "video", "영상 → video");
assert(categoryToType(null) === "doc", "미지정 → doc 폴백");
assert(formatBytes(500) === "500 B", "B 포맷");
assert(formatBytes(8700) === "8 KB", "KB 포맷");
assert(formatBytes(13002342) === "12.4 MB", "MB 소수 포맷");
assert(formatBytes(195035136) === "186 MB", "대용량 MB 정수 포맷");
assert(RESOURCE_CATEGORY_EN["설교PPT"] === "SLIDES", "카테고리 EN 맵");

const now = new Date("2026-06-01T00:00:00Z");
const v = toResourceFileView(
  {
    id: "r1",
    category: "설교PPT",
    title: "봄 부흥회 PPT",
    excerpt: "40슬라이드 · 16:9",
    viewCount: 142,
    createdAt: new Date("2026-05-30T00:00:00Z"),
    authorName: "한경수",
    authorTitle: "목사",
    totalBytes: 13002342,
  },
  now,
);
assert(v.id === "r1" && v.type === "ppt" && v.cat === "설교PPT", "id·type·cat 매핑");
assert(v.size === "12.4 MB" && v.downloads === 142, "size·downloads");
assert(v.by === "한경수 목사" && v.date === "2026.05.30", "by·date");
assert(v.isNew === true, "7일 이내 isNew");

const v2 = toResourceFileView(
  { id: "r2", category: null, title: "t", excerpt: null, viewCount: 0, createdAt: new Date("2026-01-01T00:00:00Z"), authorName: null, authorTitle: null, totalBytes: 0 },
  now,
);
assert(v2.cat === "문서" && v2.type === "doc", "null 카테고리 → 문서/doc");
assert(v2.by === "익명" && v2.sub === "" && v2.size === "0 B", "폴백 by/sub/size");
assert(v2.isNew === false, "오래된 글 isNew=false");

console.log("\n✅ 자료공유 순수 매퍼 검증 통과");
```

- [ ] **Step 4: package.json** — `scripts`에 추가: `"resource:verify": "node scripts/verify-resource.mjs",`

- [ ] **Step 5: 검증** — Run: `cd web && pnpm resource:verify` → 모든 `✓` 후 성공. 그리고 `pnpm build`(타입: ResourceFile.id string화로 인한 오류 없는지).

- [ ] **Step 6: 커밋**
```bash
git add web/src/lib/resource.ts web/src/lib/resources-data.ts web/scripts/verify-resource.mjs web/package.json
git commit -m "feat: 자료공유 순수 뷰모델 매퍼·카테고리 맵 추가"
```
(트레일러: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 2: server/services/resource.ts (목록·상세·다운로드)

**Files:** Create `web/src/server/services/resource.ts`.

- [ ] **Step 1: 서비스 작성** — `web/src/server/services/resource.ts`:

```ts
import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { posts, attachments, users } from "@/server/db/schema";
import {
  toResourceFileView,
  categoryToType,
  RESOURCE_CATEGORIES_KO,
  RESOURCE_CATEGORY_EN,
  formatDate,
  type ResourceRow,
} from "@/lib/resource";
import type {
  ResourceFile,
  ResourceCategory,
  ResourceTopItem,
} from "@/lib/resources-data";

const SECTION = "resource" as const;

export type ResourceListData = {
  files: ResourceFile[];
  categories: ResourceCategory[];
  top: ResourceTopItem[];
};

export async function getResourceListData(): Promise<ResourceListData> {
  const now = new Date();
  const db = getDb();

  const rows = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorTitle: users.title,
      totalBytes: sql<number>`coalesce((select sum(${attachments.sizeBytes}) from ${attachments} a where a.post_id = ${posts.id}),0)::bigint`,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .orderBy(desc(posts.createdAt));
  const files = rows.map((r) =>
    toResourceFileView({ ...r, totalBytes: Number(r.totalBytes) } as ResourceRow, now),
  );

  // 카테고리 카운트 (전체 + 6종)
  const counts = await db
    .select({ category: posts.category, n: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .groupBy(posts.category);
  const byCat = new Map(counts.map((c) => [c.category, c.n]));
  const total = counts.reduce((s, c) => s + c.n, 0);
  const categories: ResourceCategory[] = [
    { ko: "전체", en: "ALL", count: total, icon: "all" },
    ...RESOURCE_CATEGORIES_KO.map((ko) => ({
      ko,
      en: RESOURCE_CATEGORY_EN[ko],
      count: byCat.get(ko) ?? 0,
      icon: categoryToType(ko),
    })),
  ];

  // 인기 다운로드 상위 5
  const pop = await db
    .select({ title: posts.title, downloads: posts.viewCount, category: posts.category })
    .from(posts)
    .where(and(eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .orderBy(desc(posts.viewCount))
    .limit(5);
  const top: ResourceTopItem[] = pop.map((p, i) => ({
    rank: i + 1,
    title: p.title,
    downloads: p.downloads,
    type: categoryToType(p.category),
  }));

  return { files, categories, top };
}

export type ResourceDetail = {
  id: string;
  category: string | null;
  title: string;
  sub: string;
  by: string;
  date: string;
  downloads: number;
  files: { id: string; name: string; sizeBytes: number; mime: string }[];
};

export async function getResourcePost(id: string): Promise<ResourceDetail | null> {
  const db = getDb();
  const [r] = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorTitle: users.title,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(and(eq(posts.id, id), eq(posts.section, SECTION), eq(posts.isPublished, true)))
    .limit(1);
  if (!r) return null;
  const atts = await db
    .select({
      id: attachments.id,
      name: attachments.originalName,
      sizeBytes: attachments.sizeBytes,
      mime: attachments.mime,
    })
    .from(attachments)
    .where(eq(attachments.postId, id));
  const name = r.authorName ?? "익명";
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    sub: r.excerpt ?? "",
    by: r.authorTitle ? `${name} ${r.authorTitle}` : name,
    date: formatDate(r.createdAt),
    downloads: r.viewCount,
    files: atts.map((a) => ({ ...a, sizeBytes: Number(a.sizeBytes) })),
  };
}

// 파일 다운로드 시 자료의 다운로드 수(viewCount) 증가
export async function incrementResourceDownload(postId: string): Promise<void> {
  await getDb()
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(and(eq(posts.id, postId), eq(posts.section, SECTION)));
}
```

- [ ] **Step 2: 빌드** — Run: `cd web && pnpm build` → 성공.

- [ ] **Step 3: 커밋**
```bash
git add web/src/server/services/resource.ts
git commit -m "feat: 자료공유 목록·상세·다운로드 서비스 추가"
```

---

## Task 3: 파일 다운로드 Route Handler + upload 경로 헬퍼

**Files:** Create `web/src/server/uploads/resource.ts`, `web/src/app/api/resources/files/[id]/route.ts`.

- [ ] **Step 1: 업로드 경로 헬퍼** — `web/src/server/uploads/resource.ts`:

```ts
import "server-only";
import { join } from "node:path";

// 자료 파일 저장 루트 — 컨테이너 볼륨. (Plan B가 storeAttachment 등 추가)
export const RESOURCE_UPLOAD_DIR = join(process.cwd(), "uploads", "resource");

export function resourceUploadPath(storedName: string): string {
  return join(RESOURCE_UPLOAD_DIR, storedName);
}
```

- [ ] **Step 2: 다운로드 Route Handler** — `web/src/app/api/resources/files/[id]/route.ts`:

```ts
import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { attachments } from "@/server/db/schema";
import { resourceUploadPath } from "@/server/uploads/resource";
import { incrementResourceDownload } from "@/server/services/resource";
import { isUuid } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not Found", { status: 404 });

  const [row] = await getDb()
    .select({
      postId: attachments.postId,
      storedName: attachments.storedName,
      originalName: attachments.originalName,
      mime: attachments.mime,
    })
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  if (!row) return new Response("Not Found", { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(resourceUploadPath(row.storedName));
  } catch {
    return new Response("Not Found", { status: 404 });
  }
  // 다운로드 수 증가 (자료 단위)
  await incrementResourceDownload(row.postId);

  const fn = encodeURIComponent(row.originalName);
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${fn}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
```

비고: 다운로드는 항상 `attachment`(브라우저 다운로드). 카운트 정확성을 위해 `Cache-Control: max-age=0`로 캐시 재검증.

- [ ] **Step 3: 빌드** — `cd web && pnpm build` → 라우트에 `ƒ /api/resources/files/[id]` 표시.

- [ ] **Step 4: 커밋**
```bash
git add web/src/server/uploads/resource.ts "web/src/app/api/resources/files/[id]"
git commit -m "feat: 자료 파일 다운로드 Route Handler + 다운로드 수 증가"
```

---

## Task 4: dev-db 자료 seed (글 + 파일 + 첨부 행)

**Files:** Modify `web/scripts/dev-db.mjs`.

- [ ] **Step 1: seed 블록 추가** — admin 시드 다음, 교육위원회 seed 다음, `const server = ...` 앞에 삽입:

```js
// 자료공유 seed (없을 때만) — 카테고리별 글 + placeholder 파일 + 첨부 행
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const resourceDir = join(here, "../uploads/resource");
const rExists = await db.query(`select 1 from posts where section='resource' limit 1`);
if (rExists.rows.length === 0) {
  await mkdir(resourceDir, { recursive: true });
  const seed = [
    ["설교PPT", "봄 부흥회 둘째 날 — 다시, 광야로 (PPT)", "40슬라이드 · 16:9 · 본문 막 1:12-13", "sample.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", 13002342, 142],
    ["교안", "주일학교 봄학기 초등부 공과 (1-13과)", "인쇄용 · A4 · 학생용 + 교사용", "sample.pdf", "application/pdf", 9122611, 384],
    ["악보", "“주의 인자하심이” — 4부 합창 + 피아노", "원곡 G장조 · MR 2분 38초", "score.pdf", "application/pdf", 25272320, 612],
    ["문서", "교사 양육 매뉴얼 v3 — 신임 교사 6주 과정", "한글 + PDF 2종 · 평가지 포함", "manual.pdf", "application/pdf", 3355443, 218],
    ["영상", "제27회 성경고사 본선 — 진행 가이드 영상", "4분 22초 · 1080p · 자막", "guide.mp4", "video/mp4", 148897792, 96],
    ["디자인", "여름 수련회 포스터 · SNS 카드", "인쇄용 + 인스타 1080² 일괄", "poster.zip", "application/zip", 195035136, 174],
  ];
  for (const [cat, title, sub, oname, mime, sizeBytes, dl] of seed) {
    const p = await db.query(
      `insert into posts (section, category, title, excerpt, body, author_id, view_count)
       values ('resource', $1, $2, $3, '', $4, $5) returning id`,
      [cat, title, sub, adminId, dl],
    );
    const storedName = `${randomUUID()}.${oname.split(".").pop()}`;
    await writeFile(join(resourceDir, storedName), `placeholder for ${oname}`);
    await db.query(
      `insert into attachments (post_id, original_name, stored_name, mime, size_bytes)
       values ($1,$2,$3,$4,$5)`,
      [p.rows[0].id, oname, storedName, mime, sizeBytes],
    );
  }
  console.log(`[dev-db] 자료공유 글 ${seed.length}건 + 파일 seed`);
} else {
  console.log("[dev-db] 자료공유 글 이미 존재");
}
```

비고: `size_bytes`는 표시용 실측값, 디스크 파일은 작은 placeholder(다운로드 동작 확인용). `view_count`로 다운로드 수 시드. (import는 파일 상단으로 끌어올려도 무방하나, 기존 스크립트 스타일대로 인라인 동적 위치에 두면 ESM에서 hoist되므로 동작함. 빌드 대상 아님.)

- [ ] **Step 2: DB 재기동 확인** — Run: `cd web && rm -rf .pglite uploads/resource && pnpm dev:db` → 로그에 `[dev-db] 자료공유 글 6건 + 파일 seed`. 확인 후 종료(포트 5432 비우기).

- [ ] **Step 3: 커밋**
```bash
git add web/scripts/dev-db.mjs
git commit -m "chore: 로컬 dev-db에 자료공유 글·파일 seed 추가"
```

---

## Task 5: 목록 페이지·컴포넌트 props 배선 (마크업 보존)

**Files:** Modify `web/src/app/resources/page.tsx`, `ResourcesDesktop.tsx`, `FilterStrip.tsx`, `ResourcesSidebar.tsx`, `FileGrid.tsx`, `FileList.tsx`, `mobile/ResourcesMobile.tsx`.

> 원칙: 마크업·Tailwind·style 변경 금지. mock import→props, 카드 상세 라우팅(onClick)만 추가.

- [ ] **Step 1: 서버 페이지 props 주입** — `web/src/app/resources/page.tsx`:

```tsx
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getResourceListData } from "@/server/services/resource";
import DesktopNav from "@/app/_components/DesktopNav";
import ResourcesDesktop from "./_components/desktop/ResourcesDesktop";
import ResourcesMobile from "./_components/mobile/ResourcesMobile";

export default async function ResourcesPage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const data = await getResourceListData();
  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <ResourcesDesktop files={data.files} categories={data.categories} top={data.top} />
      </>
    );
  }
  return (
    <ResourcesMobile
      deviceType={device}
      files={data.files}
      categories={data.categories}
      top={data.top}
    />
  );
}
```

- [ ] **Step 2: ResourcesDesktop props 수용** — `ResourcesDesktop.tsx`:
  - import에서 `LB_CATEGORIES, LB_FILES` 제거(타입 `ResourcesSort/ResourcesView`는 유지), `useRouter` + 타입 import 추가:
    ```tsx
    import { useRouter } from "next/navigation";
    import {
      type ResourcesSort,
      type ResourcesView,
    } from "@/lib/resources-data";
    import type { ResourceFile, ResourceCategory, ResourceTopItem } from "@/lib/resources-data";
    ```
  - 시그니처/상단:
    ```tsx
    type Props = { files: ResourceFile[]; categories: ResourceCategory[]; top: ResourceTopItem[] };

    export default function ResourcesDesktop({ files, categories, top }: Props) {
      const router = useRouter();
      const [activeCat, setActiveCat] = useState(0);
      const [view, setView] = useState<ResourcesView>("grid");
      const [sort, setSort] = useState<ResourcesSort>("recent");

      const filtered =
        activeCat === 0 ? files : files.filter((f) => f.cat === categories[activeCat].ko);
    ```
    (참고: `palette`는 모듈 상단 상수 그대로.)
  - `<FilterStrip ... />`에 `categories={categories}` 추가, `<ResourcesSidebar palette={palette} />` → `<ResourcesSidebar palette={palette} top={top} />`.
  - `<FileGrid files={filtered} palette={palette} />` / `<FileList .../>`에 `onOpen={(id) => router.push(\`/resources/${id}\`)}` 추가.
  - 본문 `filtered.length` 통계는 그대로.

- [ ] **Step 3: FilterStrip categories props** — `FilterStrip.tsx`:
  - import에서 `LB_CATEGORIES` 제거(`RESOURCES_SORTS`·타입 유지), `ResourceCategory` 타입 import.
  - `Props`에 `categories: ResourceCategory[]` 추가, 본문 `LB_CATEGORIES.map` → `categories.map`. 나머지 마크업 그대로.

- [ ] **Step 4: ResourcesSidebar top props** — `ResourcesSidebar.tsx`:
  - import에서 `LB_TOP` 제거(`ResourceFileType` 유지), `ResourceTopItem` 타입 import.
  - `Props`에 `top: ResourceTopItem[]` 추가, 본문 `LB_TOP` → `top`(map + `LB_TOP.length` → `top.length`). "자료 업로드" 버튼·FILE TYPES 범례·UPLOAD GUIDELINE은 그대로(정적).

- [ ] **Step 5: FileGrid/FileList 카드 라우팅** — `FileGrid.tsx`, `FileList.tsx`를 열어 구조 확인. 각 파일 카드(루트 요소)에 `onOpen?: (id: string) => void` prop을 받아 `onClick={() => onOpen?.(file.id)}` 추가. **스타일/마크업 변경 없음.** `Props`에 `onOpen?: (id: string) => void` 추가하고 ResourcesDesktop에서 전달. (카드 내부 `DownloadBtn` 등 기존 요소는 그대로 두되, 카드 클릭 시 상세로 이동.)
  - 실행자 메모: 카드가 `<article>`/`<div>` 등 무엇이든 최상위에 onClick. `DownloadBtn`이 자체 onClick을 갖고 이벤트 버블링이 문제되면 DownloadBtn에 `e.stopPropagation()`은 추가하지 말고(마크업 변경 최소화), 카드 onClick만 둔다.

- [ ] **Step 6: ResourcesMobile props 수용** — `mobile/ResourcesMobile.tsx`를 열어 desktop과 동일 원칙으로: mock 상수 import → props(`files`, `categories`, `top`)로 교체, 카드 클릭 시 `useRouter().push(\`/resources/${id}\`)`. 마크업 그대로. (기존 `deviceType` prop 유지.)

- [ ] **Step 7: 잔존 점검 + 빌드/린트** — Run:
```bash
cd web && grep -rn "LB_FILES\|LB_CATEGORIES\|LB_TOP" src/app/resources
```
Expected: `CollectionsSection.tsx`(LB_COLLECTIONS는 정적이라 별개)·기타 정적 외 결과 없음 — 즉 `LB_FILES/LB_CATEGORIES/LB_TOP` 직접 참조 0. 그 후 `pnpm lint && pnpm build` 둘 다 성공.

- [ ] **Step 8: 커밋**
```bash
git add web/src/app/resources
git commit -m "feat: 자료공유 목록 DB 연동 (props 주입, 마크업 보존)"
```

---

## Task 6: 상세 페이지 (읽기 + 다운로드)

**Files:** Create `web/src/app/resources/[id]/page.tsx`.

- [ ] **Step 1: 상세 페이지** — `web/src/app/resources/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getResourcePost } from "@/server/services/resource";
import { getCurrentUser } from "@/server/auth/current-user";
import { formatBytes } from "@/lib/resource";

// 최소 기능 상세 화면. 디자인 폴리시는 추후 Claude Design 핸드오프로 교체.
export default async function ResourcePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await getResourcePost(id);
  if (!resource) notFound();
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/resources" style={{ fontSize: 13, color: "#666" }}>
        ← 자료공유로
      </Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {resource.category} · {resource.by} · {resource.date} · 다운로드 {resource.downloads}
      </p>
      <h1 style={{ fontSize: 26, lineHeight: 1.3 }}>{resource.title}</h1>
      {isAdmin && (
        <Link href={`/admin/resources/${id}/edit`} style={{ fontSize: 13, color: "#06c" }}>
          수정
        </Link>
      )}
      {resource.sub && (
        <p style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
          {resource.sub}
        </p>
      )}

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15 }}>파일 ({resource.files.length})</h2>
        {resource.files.length === 0 ? (
          <p style={{ fontSize: 13, color: "#888" }}>등록된 파일이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {resource.files.map((f) => (
              <li key={f.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <a href={`/api/resources/files/${f.id}`}>{f.name}</a>
                <span style={{ fontSize: 12, color: "#888" }}>({formatBytes(f.sizeBytes)})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
```

비고: 다운로드 링크는 `/api/resources/files/[id]`(attachment disposition) — 클릭 시 다운로드되며 서버가 다운로드 수 증가. `/admin/resources/[id]/edit`는 Plan B에서 생성(현재는 404 가능, admin 전용 링크라 무방).

- [ ] **Step 2: 빌드** — `cd web && pnpm build` → `ƒ /resources/[id]` 표시.

- [ ] **Step 3: 커밋**
```bash
git add "web/src/app/resources/[id]"
git commit -m "feat: 자료 상세 페이지(읽기) + 파일 다운로드"
```

---

## Task 7: 통합 검증 (Preview e2e)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 회귀** — `cd web && pnpm lint && pnpm build && pnpm db:verify && pnpm committee:verify && pnpm uploads:verify && pnpm resource:verify` 전부 통과.

- [ ] **Step 2: 로컬 DB + Preview** — `rm -rf web/.pglite web/uploads/resource && pnpm dev:db`(백그라운드), Preview `web-dev` 기동.

- [ ] **Step 3: 공개 목록** — `/resources` 접속. seed 6건이 카테고리·size(예: 12.4 MB, 186 MB)·by(관리자 교육위원회)·다운로드 수와 함께 표시. 카테고리 필터·그리드/리스트 토글 동작. 레이아웃 기존과 동일.

- [ ] **Step 4: 상세 + 다운로드** — 카드 클릭 → `/resources/[id]`. 제목·설명·파일 목록. 파일 링크 클릭 → 다운로드(placeholder 내용). 목록/상세 재방문 시 다운로드 수 1 증가 확인.

- [ ] **Step 5: 모바일** — Preview mobile preset → `/resources` 재방문, seed 표시·카드 클릭 상세 이동(주: UA 기반 SSR이라 Preview 데스크톱 UA면 모바일 경로 미확인 가능 — 그 경우 정적 검증으로 갈음하고 보고).

- [ ] **Step 6: 정리** — dev:db·Preview 종료, 포트 비우기.

---

## Self-Review 메모

- **스펙 커버리지:** 읽기 공개·목록 DB·상세·다운로드 카운트·카테고리/인기 사이드바·파일 type 카테고리 파생·대용량 size 표시 = 태스크 매핑. 업로드/에디터는 Plan B 명시.
- **타입 일관성:** `ResourceFile.id: string`(T1) ↔ `ResourceRow`/`toResourceFileView`(T1) ↔ 서비스 반환(T2) ↔ 컴포넌트 props(T5). `ResourceDetail`·`incrementResourceDownload`·`resourceUploadPath`·`isUuid`(기존 lib/api) 시그니처 일치.
- **마크업 보존:** T5는 import→props·onClick만. 잔존 grep 스텝 포함. CollectionsSection(LB_COLLECTIONS)·사이드바 정적 영역 유지.
- **플레이스홀더:** 없음(모바일·FileGrid/FileList 카드 배선은 구조 확인 후 동일 원칙 — 실행자 메모 명시).
