# 자료공유 — 쓰기 + 업로드 구현 Plan (Plan B/2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** admin이 자료를 등록·수정·삭제하고 대용량 파일(영상·디자인 등 ≤300MB)을 첨부할 수 있다. 읽기·다운로드는 공개(Plan A). 이 Plan으로 자료 라이브러리 슬라이스가 완성된다.

**Architecture:** committee Plan 2 패턴을 자료용으로 적응. 생성→편집 흐름(텍스트 먼저 저장 후 편집에서 per-file 업로드). 업로드는 Route Handler + `lib/api.ts`. 실 MIME은 file-type 매직바이트. 자료 전용 대용량 정책.

**Tech Stack:** Next.js 16, Drizzle, file-type, zod, TS strict, pnpm. 마이그레이션 불필요.

**확정 정책:** 파일당 ≤ 300MB, 자료당 합계 ≤ 500MB·20개. 허용: 문서(pdf·hwp·hwpx·docx·pptx·xlsx)·이미지(png·jpg·jpeg·gif·webp)·영상(mp4·mov·webm)·음원(mp3·wav)·디자인/압축(ai·psd·zip).

**검증:** `pnpm lint`/`build` + `resource:verify`(업로드 정책 포함) + 기존 verify 회귀 + Preview/dev e2e(admin 자료 등록→대용량 업로드→공개 다운로드→삭제).

---

## File Structure

- `web/src/lib/resource-upload.ts` — 자료 업로드 정책 + 순수 검증(preCheck·resolveResourceMime) (신규, 클라 안전)
- `web/src/server/uploads/resource.ts` — storeResourceAttachment·deleteResourceAttachment·deleteResourcePostFiles·UploadError 추가 (수정; Plan A의 경로 헬퍼 유지)
- `web/src/app/api/resources/[postId]/uploads/route.ts` — POST 업로드(admin) (신규)
- `web/src/app/api/resources/attachments/[id]/route.ts` — DELETE 첨부(admin) (신규)
- `web/src/server/services/resource.ts` — getResourcePostForEdit 추가 (수정)
- `web/src/server/actions/resource.ts` — createResource·updateResource·deleteResource (신규)
- `web/src/app/(admin)/admin/resources/ResourceEditorForm.tsx` — 작성/수정 폼(client) (신규)
- `web/src/app/(admin)/admin/resources/ResourceAttachmentManager.tsx` — 첨부 업로드/삭제(client) (신규)
- `web/src/app/(admin)/admin/resources/new/page.tsx` (신규)
- `web/src/app/(admin)/admin/resources/[id]/edit/page.tsx` (신규)
- `web/src/app/resources/_components/desktop/ResourcesDesktop.tsx`·`ResourcesSidebar.tsx`·`mobile/ResourcesMobile.tsx` — "자료 업로드" 버튼 라우팅 (수정)
- `web/scripts/verify-resource.mjs` — 업로드 정책 검증 추가 (수정)

---

## Task 1: lib/resource-upload.ts (정책·순수 검증) + verify 확장

**Files:** Create `web/src/lib/resource-upload.ts`; Modify `web/scripts/verify-resource.mjs`.

- [ ] **Step 1: 업로드 정책 작성** — `web/src/lib/resource-upload.ts`:

```ts
// 자료공유 첨부 정책 + 순수 검증. 클라이언트(사전 차단)·서버(최종 검증) 공용.
export const RES_MAX_FILE_BYTES = 300 * 1024 * 1024; // 300MB
export const RES_MAX_FILES = 20;
export const RES_MAX_TOTAL_BYTES = 500 * 1024 * 1024; // 500MB

export type ResUploadKind =
  | "image" | "pdf" | "office-zip" | "hwp-cfb"
  | "video" | "audio" | "archive" | "psd" | "ai";

export const RES_ALLOWED_EXT: Record<string, ResUploadKind> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  pdf: "pdf",
  docx: "office-zip", pptx: "office-zip", xlsx: "office-zip", hwpx: "office-zip",
  hwp: "hwp-cfb",
  mp4: "video", mov: "video", webm: "video",
  mp3: "audio", wav: "audio",
  zip: "archive",
  psd: "psd",
  ai: "ai",
};

export function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i < 0 ? "" : filename.slice(i + 1).toLowerCase();
}

export function preCheck(filename: string, sizeBytes: number): string | null {
  const ext = extOf(filename);
  if (!(ext in RES_ALLOWED_EXT)) return "허용되지 않은 형식입니다.";
  if (sizeBytes > RES_MAX_FILE_BYTES) return "파일이 300MB를 초과합니다.";
  if (sizeBytes <= 0) return "빈 파일입니다.";
  return null;
}

// 서버 매직바이트 검증 결정. detected = file-type 결과(ext/mime) 또는 null. 통과 시 저장 mime, 실패 시 null.
export function resolveMime(
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  const kind = RES_ALLOWED_EXT[ext];
  if (!kind) return null;
  const dext = detected?.ext;
  const dmime = detected?.mime;
  switch (kind) {
    case "image": {
      if (!dmime || !dmime.startsWith("image/")) return null;
      const want = ext === "jpg" ? "jpeg" : ext;
      const got = dext === "jpg" ? "jpeg" : dext;
      return got === want ? dmime : null;
    }
    case "pdf":
      return dmime === "application/pdf" ? dmime : null;
    case "office-zip": {
      const okExts = new Set([ext, "zip"]);
      if (dext && okExts.has(dext)) {
        const map: Record<string, string> = {
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          hwpx: "application/hwp+zip",
        };
        return map[ext] ?? "application/zip";
      }
      return null;
    }
    case "hwp-cfb":
      return dext === "cfb" ? "application/x-hwp" : null;
    case "video":
      // mp4→video/mp4, mov→video/quicktime, webm→video/webm
      return dext === ext && !!dmime && dmime.startsWith("video/") ? dmime : null;
    case "audio":
      // mp3→audio/mpeg, wav→audio/(x-)wav
      return dext === ext && !!dmime && dmime.startsWith("audio/") ? dmime : null;
    case "archive":
      return dext === "zip" ? "application/zip" : null;
    case "psd":
      return dext === "psd" ? "image/vnd.adobe.photoshop" : null;
    case "ai":
      // 최신 .ai는 PDF 컨테이너, 구버전은 PostScript
      return dmime === "application/pdf" || dmime === "application/postscript"
        ? "application/illustrator"
        : null;
  }
}
```

비고: 영상 mov는 file-type가 `{ext:'mov', mime:'video/quicktime'}`로 감지하므로 `dext===ext`로 통과. wav는 `audio/wav` 또는 `audio/x-wav` 모두 `audio/`로 시작해 통과.

- [ ] **Step 2: verify-resource.mjs에 업로드 정책 검증 추가** — `web/scripts/verify-resource.mjs`의 import에 추가:
```js
import {
  preCheck as resPreCheck,
  resolveMime as resResolveMime,
  RES_MAX_FILE_BYTES,
} from "../src/lib/resource-upload.ts";
```
그리고 `console.log("\n✅ ...")` 앞에 삽입:
```js
// 업로드 정책
assert(resPreCheck("a.exe", 10) !== null, "[업로드] 허용 외 확장자 거부");
assert(resPreCheck("a.mp4", RES_MAX_FILE_BYTES + 1) !== null, "[업로드] 300MB 초과 거부");
assert(resPreCheck("a.mp4", 1000) === null, "[업로드] 영상 통과");
assert(resPreCheck("a.psd", 1000) === null, "[업로드] psd 통과");
assert(resResolveMime("mp4", { ext: "mp4", mime: "video/mp4" }) === "video/mp4", "[업로드] mp4 매직");
assert(resResolveMime("mov", { ext: "mov", mime: "video/quicktime" }) === "video/quicktime", "[업로드] mov 매직");
assert(resResolveMime("mp3", { ext: "mp3", mime: "audio/mpeg" }) === "audio/mpeg", "[업로드] mp3 매직");
assert(resResolveMime("wav", { ext: "wav", mime: "audio/x-wav" }) === "audio/x-wav", "[업로드] wav 매직");
assert(resResolveMime("zip", { ext: "zip", mime: "application/zip" }) === "application/zip", "[업로드] zip 매직");
assert(resResolveMime("psd", { ext: "psd", mime: "image/vnd.adobe.photoshop" }) === "image/vnd.adobe.photoshop", "[업로드] psd 매직");
assert(resResolveMime("ai", { ext: "pdf", mime: "application/pdf" }) === "application/illustrator", "[업로드] ai(pdf컨테이너) 매직");
assert(resResolveMime("mp4", { ext: "png", mime: "image/png" }) === null, "[업로드] mp4인데 이미지면 거부");
assert(resResolveMime("png", { ext: "mp4", mime: "video/mp4" }) === null, "[업로드] png인데 영상이면 거부");
```

- [ ] **Step 3: 검증** — `cd web && pnpm resource:verify` → 기존 + 업로드 단언 전부 `✓`. `pnpm build` 성공.

- [ ] **Step 4: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/lib/resource-upload.ts web/scripts/verify-resource.mjs
git commit -m "feat: 자료 업로드 정책·순수 검증(대용량·영상/음원/디자인)"
```
(트레일러: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 2: 서버 업로드 저장/삭제 (server/uploads/resource.ts 확장)

**Files:** Modify `web/src/server/uploads/resource.ts`.

- [ ] **Step 1: 저장/삭제 함수 추가** — 기존 파일(현재 `import "server-only"` + `RESOURCE_UPLOAD_DIR` + `resourceUploadPath`만 있음)에 아래를 추가하고 import를 보강:

```ts
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { attachments, posts } from "@/server/db/schema";
import {
  extOf,
  preCheck,
  resolveMime,
  RES_MAX_FILES,
  RES_MAX_TOTAL_BYTES,
} from "@/lib/resource-upload";

// 자료 파일 저장 루트 — 컨테이너 볼륨.
export const RESOURCE_UPLOAD_DIR = join(process.cwd(), "uploads", "resource");

export function resourceUploadPath(storedName: string): string {
  return join(RESOURCE_UPLOAD_DIR, storedName);
}

export type StoredAttachment = { id: string; name: string; sizeBytes: number; mime: string };

export class UploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function ensureCapacity(postId: string, incomingBytes: number) {
  const [agg] = await getDb()
    .select({
      n: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${attachments.sizeBytes}),0)::bigint`,
    })
    .from(attachments)
    .where(eq(attachments.postId, postId));
  const count = Number(agg?.n ?? 0);
  const total = Number(agg?.total ?? 0);
  if (count + 1 > RES_MAX_FILES)
    throw new UploadError("TOO_MANY", `첨부는 자료당 ${RES_MAX_FILES}개까지입니다.`);
  if (total + incomingBytes > RES_MAX_TOTAL_BYTES)
    throw new UploadError("TOO_LARGE_TOTAL", "자료 첨부 합계 용량(500MB)을 초과합니다.");
}

export async function storeResourceAttachment(postId: string, file: File): Promise<StoredAttachment> {
  const ext = extOf(file.name);
  const pre = preCheck(file.name, file.size);
  if (pre) throw new UploadError("INVALID_FILE", pre);

  // 대상이 실제 존재하는 resource 글인지 확인
  const [target] = await getDb()
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.section, "resource")))
    .limit(1);
  if (!target) throw new UploadError("POST_NOT_FOUND", "자료를 찾을 수 없습니다.");

  await ensureCapacity(postId, file.size);

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = (await fileTypeFromBuffer(buf)) ?? null;
  const mime = resolveMime(ext, detected);
  if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

  await mkdir(RESOURCE_UPLOAD_DIR, { recursive: true });
  const storedName = `${randomUUID()}.${ext}`;
  await writeFile(join(RESOURCE_UPLOAD_DIR, storedName), buf);

  const [row] = await getDb()
    .insert(attachments)
    .values({ postId, originalName: file.name, storedName, mime, sizeBytes: file.size })
    .returning({ id: attachments.id });

  return { id: row.id, name: file.name, sizeBytes: file.size, mime };
}

export async function deleteResourceAttachment(id: string): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  if (!row) return;
  await db.delete(attachments).where(eq(attachments.id, id));
  await unlink(resourceUploadPath(row.storedName)).catch(() => {});
}

export async function deleteResourcePostFiles(postId: string): Promise<void> {
  const rows = await getDb()
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(eq(attachments.postId, postId));
  await Promise.all(rows.map((r) => unlink(resourceUploadPath(r.storedName)).catch(() => {})));
}
```
(기존 `RESOURCE_UPLOAD_DIR`/`resourceUploadPath`는 위 블록에 포함되어 있으니 중복 선언이 되지 않도록 파일을 위 내용으로 정리. Plan A에서 만든 두 export는 그대로 유지됨.)

- [ ] **Step 2: 빌드** — `cd web && pnpm build` 성공(file-type ESM, 타입).

- [ ] **Step 3: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/server/uploads/resource.ts
git commit -m "feat: 자료 첨부 디스크 저장·삭제·매직바이트 검증(server)"
```

---

## Task 3: Route Handler (업로드·첨부삭제)

**Files:** Create `web/src/app/api/resources/[postId]/uploads/route.ts`, `web/src/app/api/resources/attachments/[id]/route.ts`.

- [ ] **Step 1: 업로드(admin POST)** — `web/src/app/api/resources/[postId]/uploads/route.ts`:
```ts
import { getCurrentUser } from "@/server/auth/current-user";
import { storeResourceAttachment, UploadError } from "@/server/uploads/resource";
import { isUuid } from "@/lib/api";

export const runtime = "nodejs";

function err(code: string, message: string, status: number) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return err("FORBIDDEN", "권한이 없습니다.", 403);

  const { postId } = await params;
  if (!isUuid(postId)) return err("INVALID_ID", "잘못된 자료 ID입니다.", 400);

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return err("NO_FILE", "파일이 없습니다.", 400);

  const stored = [];
  for (const file of files) {
    try {
      stored.push(await storeResourceAttachment(postId, file));
    } catch (e) {
      if (e instanceof UploadError) return err(e.code, e.message, 400);
      throw e;
    }
  }
  return Response.json({ ok: true, data: stored });
}
```
(`stored` 타입 추론 문제 시 `import type { StoredAttachment }` 후 `const stored: StoredAttachment[] = []`.)

- [ ] **Step 2: 첨부 삭제(admin DELETE)** — `web/src/app/api/resources/attachments/[id]/route.ts`:
```ts
import { getCurrentUser } from "@/server/auth/current-user";
import { deleteResourceAttachment } from "@/server/uploads/resource";
import { isUuid } from "@/lib/api";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } }, { status: 403 });
  const { id } = await params;
  if (!isUuid(id))
    return Response.json({ ok: false, error: { code: "INVALID_ID", message: "잘못된 ID입니다." } }, { status: 400 });
  await deleteResourceAttachment(id);
  return Response.json({ ok: true, data: { id } });
}
```

- [ ] **Step 3: 빌드** — `cd web && pnpm build` → 라우트에 `ƒ /api/resources/[postId]/uploads`, `ƒ /api/resources/attachments/[id]` 표시.

- [ ] **Step 4: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add "web/src/app/api/resources/[postId]" "web/src/app/api/resources/attachments"
git commit -m "feat: 자료 업로드·첨부 삭제 Route Handler 추가"
```

---

## Task 4: Server Action + 편집용 조회

**Files:** Modify `web/src/server/services/resource.ts`; Create `web/src/server/actions/resource.ts`.

- [ ] **Step 1: 편집용 조회 추가** — `web/src/server/services/resource.ts` 하단에 추가:
```ts
export type ResourceEditData = {
  id: string;
  category: string | null;
  title: string;
  sub: string;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
};

export async function getResourcePostForEdit(id: string): Promise<ResourceEditData | null> {
  const db = getDb();
  const [r] = await db
    .select({ id: posts.id, category: posts.category, title: posts.title, excerpt: posts.excerpt })
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.section, SECTION)))
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
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    sub: r.excerpt ?? "",
    attachments: atts.map((a) => ({ ...a, sizeBytes: Number(a.sizeBytes) })),
  };
}
```

- [ ] **Step 2: Server Action** — `web/src/server/actions/resource.ts`:
```ts
"use server";
// 자료 작성/수정/삭제. admin 전용, zod 검증, Drizzle.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { posts } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/current-user";
import { deleteResourcePostFiles } from "@/server/uploads/resource";
import { RESOURCE_CATEGORIES_KO } from "@/lib/resource";

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(RESOURCE_CATEGORIES_KO as [string, ...string[]]),
  sub: z.string().trim().optional().transform((v) => v || null),
});

export interface ResourceFormState {
  error?: string;
}

function parse(formData: FormData) {
  return schema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    sub: formData.get("sub"),
  });
}

export async function createResource(_prev: ResourceFormState, formData: FormData): Promise<ResourceFormState> {
  const user = await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const [row] = await getDb()
    .insert(posts)
    .values({
      section: "resource",
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.sub,
      authorId: user.id,
    })
    .returning({ id: posts.id });
  redirect(`/admin/resources/${row.id}/edit`);
}

export async function updateResource(id: string, _prev: ResourceFormState, formData: FormData): Promise<ResourceFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  await getDb()
    .update(posts)
    .set({ category: r.data.category, title: r.data.title, excerpt: r.data.sub, updatedAt: new Date() })
    .where(eq(posts.id, id));
  redirect(`/resources/${id}`);
}

export async function deleteResource(id: string): Promise<void> {
  await requireAdmin();
  await deleteResourcePostFiles(id);
  await getDb().delete(posts).where(eq(posts.id, id));
  redirect("/resources");
}
```

- [ ] **Step 3: 빌드** — `cd web && pnpm build` 성공.

- [ ] **Step 4: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/server/services/resource.ts web/src/server/actions/resource.ts
git commit -m "feat: 자료 작성/수정/삭제 Server Action + 편집 조회"
```

---

## Task 5: 에디터 폼·첨부 매니저·new/edit 페이지

**Files:** Create `ResourceEditorForm.tsx`, `ResourceAttachmentManager.tsx`, `new/page.tsx`, `[id]/edit/page.tsx` (모두 `web/src/app/(admin)/admin/resources/` 하위).

- [ ] **Step 1: 편집 폼(client)** — `web/src/app/(admin)/admin/resources/ResourceEditorForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { RESOURCE_CATEGORIES_KO } from "@/lib/resource";
import type { ResourceFormState } from "@/server/actions/resource";

type Initial = { title?: string; category?: string; sub?: string };
const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function ResourceEditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ResourceFormState, formData: FormData) => Promise<ResourceFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="자료 제목" style={inputStyle} />
      <select name="category" defaultValue={initial?.category ?? RESOURCE_CATEGORIES_KO[0]} style={inputStyle}>
        {RESOURCE_CATEGORIES_KO.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <textarea name="sub" defaultValue={initial?.sub ?? ""} placeholder="설명 (예: 40슬라이드 · 16:9 · 본문)" rows={4} style={inputStyle} />
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 첨부 매니저(client)** — `web/src/app/(admin)/admin/resources/ResourceAttachmentManager.tsx`:
```tsx
"use client";
import { useState } from "react";
import { apiPostForm, apiDelete, ApiError } from "@/lib/api";
import { preCheck } from "@/lib/resource-upload";

type Att = { id: string; name: string; sizeBytes: number; mime: string };

export default function ResourceAttachmentManager({ postId, initial }: { postId: string; initial: Att[] }) {
  const [items, setItems] = useState<Att[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    const failed: string[] = [];
    for (const f of files) {
      const pre = preCheck(f.name, f.size);
      if (pre) { failed.push(`${f.name}: ${pre}`); continue; }
      try {
        const form = new FormData();
        form.append("files", f);
        const added = await apiPostForm<Att[]>(`/api/resources/${postId}/uploads`, form);
        setItems((prev) => [...prev, ...added]);
      } catch (err) {
        failed.push(`${f.name}: ${err instanceof ApiError ? err.message : "업로드 실패"}`);
      }
    }
    setBusy(false);
    setError(failed.length > 0 ? failed.join("\n") : null);
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      await apiDelete(`/api/resources/attachments/${id}`);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제 실패");
    }
  }

  return (
    <div style={{ marginTop: 24, maxWidth: 640 }}>
      <h2 style={{ fontSize: 16 }}>첨부 파일 ({items.length})</h2>
      <input type="file" multiple onChange={onPick} disabled={busy} />
      {busy && <span style={{ marginLeft: 8, fontSize: 13 }}>업로드 중…</span>}
      {error && <p role="alert" style={{ color: "#c00", whiteSpace: "pre-wrap" }}>{error}</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={`/api/resources/files/${a.id}`}>{a.name}</a>
            <span style={{ fontSize: 12, color: "#888" }}>({Math.round(a.sizeBytes / 1024)} KB)</span>
            <button type="button" onClick={() => onDelete(a.id)} style={{ fontSize: 12 }}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: 새 자료 페이지** — `web/src/app/(admin)/admin/resources/new/page.tsx`:
```tsx
import { requireAdmin } from "@/server/auth/current-user";
import { createResource } from "@/server/actions/resource";
import ResourceEditorForm from "../ResourceEditorForm";

export default async function NewResourcePage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 자료 등록</h1>
      <p style={{ color: "#666", fontSize: 13 }}>저장 후 편집 화면에서 파일을 첨부할 수 있습니다.</p>
      <ResourceEditorForm action={createResource} submitLabel="저장하고 첨부하기" />
    </main>
  );
}
```

- [ ] **Step 4: 수정 페이지** — `web/src/app/(admin)/admin/resources/[id]/edit/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getResourcePostForEdit } from "@/server/services/resource";
import { updateResource, deleteResource } from "@/server/actions/resource";
import ResourceEditorForm from "../../ResourceEditorForm";
import ResourceAttachmentManager from "../../ResourceAttachmentManager";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const resource = await getResourcePostForEdit(id);
  if (!resource) notFound();

  const update = updateResource.bind(null, id);
  const remove = deleteResource.bind(null, id);

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <Link href={`/resources/${id}`} style={{ fontSize: 13, color: "#666" }}>← 자료 보기</Link>
      <h1 style={{ fontSize: 22 }}>자료 수정</h1>
      <ResourceEditorForm
        action={update}
        initial={{ title: resource.title, category: resource.category ?? undefined, sub: resource.sub }}
        submitLabel="수정 저장"
      />
      <ResourceAttachmentManager postId={id} initial={resource.attachments} />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>자료 삭제</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: 빌드·린트** — `cd web && pnpm lint && pnpm build` → 둘 다 성공. 라우트에 `ƒ /admin/resources/new`, `ƒ /admin/resources/[id]/edit`.

- [ ] **Step 6: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add "web/src/app/(admin)/admin/resources"
git commit -m "feat: 자료 작성/수정 에디터 + 첨부 매니저"
```

---

## Task 6: "자료 업로드" 버튼 라우팅

**Files:** Modify `ResourcesDesktop.tsx`, `ResourcesSidebar.tsx`, `mobile/ResourcesMobile.tsx`.

> 마크업 보존: 버튼에 onClick 라우팅만 추가.

- [ ] **Step 1: Sidebar 버튼에 onUpload prop** — `ResourcesSidebar.tsx`의 "자료 업로드" `<button>`에 `onClick`을 붙이기 위해, `Props`에 `onUpload?: () => void` 추가하고 그 버튼에 `onClick={onUpload}` 추가(스타일 무변경).

- [ ] **Step 2: ResourcesDesktop이 onUpload 전달** — `ResourcesDesktop.tsx`에서 `<ResourcesSidebar palette={palette} top={top} />` → `<ResourcesSidebar palette={palette} top={top} onUpload={() => router.push("/admin/resources/new")} />` (router 이미 사용 중).

- [ ] **Step 3: 모바일** — `mobile/ResourcesMobile.tsx`에 "자료 업로드"(또는 업로드) 버튼이 있으면 `onClick={() => router.push("/admin/resources/new")}` 추가(useRouter 이미 사용). 없으면 생략하고 보고.

- [ ] **Step 4: 빌드·린트** — `cd web && pnpm lint && pnpm build` 성공.

- [ ] **Step 5: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/app/resources
git commit -m "feat: 자료공유 새 자료 작성 버튼 라우팅"
```

---

## Task 7: 통합 검증 (e2e + 회귀)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 회귀** — `cd web && pnpm lint && pnpm build && pnpm db:verify && pnpm committee:verify && pnpm uploads:verify && pnpm resource:verify` 전부 통과.

- [ ] **Step 2: 로컬 DB + 서버** — `rm -rf web/.pglite web/uploads/resource && pnpm dev:db`(백그라운드), 그리고 **안정성 위해 `pnpm dev`를 Bash 백그라운드로** 띄워 e2e(Preview는 온디맨드 컴파일+PGlite 단일연결 경합으로 간헐 500 가능 — Plan A에서 확인됨). curl 기반 검증 권장.

- [ ] **Step 3: admin 작성 흐름 (curl)**:
  1. admin 로그인(멀티파트 server action) → 세션 쿠키.
  2. `/admin/resources/new` 200(admin).
  3. createResource 폼 제출 → `/admin/resources/[id]/edit` 리다이렉트. id 확보.
  4. 편집 화면에서 업로드: `POST /api/resources/[postId]/uploads`에 멀티파트 파일(예: 유효 PNG canvas/blob, mp3 시그니처) → 200 + 첨부 id. 잘못된 확장자(.exe)·MIME 불일치(.png에 텍스트) → 400(INVALID_FILE/MIME_MISMATCH). 영상 등 대용량은 시그니처만 맞으면 통과.
  (브라우저로 한다면 Preview에서 `fetch`로 직접 POST — Plan 2 committee e2e와 동일 방식. 로그인은 세션 쿠키 필요.)

- [ ] **Step 4: 공개 확인** — `/resources` 목록에 새 자료 표시 → 상세 → 첨부 다운로드(`/api/resources/files/[id]`, attachment) → 다운로드 수 증가.

- [ ] **Step 5: 삭제** — 편집에서 첨부 삭제(디스크 정리) → 자료 삭제 → `/resources`에서 사라짐, 디스크 파일 정리 확인(`ls web/uploads/resource`).

- [ ] **Step 6: 권한 가드** — 로그아웃 상태 `/admin/resources/new` → `/login` 리다이렉트. 비admin `POST /api/resources/[id]/uploads` → 403.

- [ ] **Step 7: 정리** — dev:db·서버 종료, 포트 비우기.

---

## Self-Review 메모

- **스펙 커버리지:** admin 작성/수정/삭제·생성→편집 흐름·대용량 다중 업로드·확장자/매직바이트(영상·음원·디자인 포함)/용량/개수/합계·파일명 재생성·디스크 정리·권한(서버 재확인+JSON 403·UUID 가드)·새글 버튼 라우팅 = 태스크 매핑.
- **타입 일관성:** `StoredAttachment`/`Att`(id,name,sizeBytes,mime), `ResourceFormState`, `createResource`/`updateResource(bind)`/`deleteResource(bind)`, `getResourcePostForEdit`↔에디터 initial, `apiPostForm`/`apiDelete`↔Route Handler, `resolveMime`(resource-upload)↔storeResourceAttachment 일치.
- **보안:** 업로드 admin 재확인 + UUID 가드 + 대상 글 존재·section 확인, 매직바이트, 파일명 uuid 재생성, Drizzle 파라미터 바인딩. 업로드 디렉터리 `web/uploads/resource/`(gitignore).
- **마크업 보존:** 목록은 "자료 업로드" 버튼 onClick만. 에디터는 신규 최소 화면.
- **플레이스홀더:** 없음(모바일 버튼 유무는 구조 확인 후 — 실행자 메모).
- **DRY 비고:** committee/resource 업로드·첨부 매니저·에디터 폼 중복은 후속 공통 추출 검토(rule-of-three, 본 슬라이스 완료 후).
