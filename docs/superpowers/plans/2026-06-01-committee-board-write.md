# 교육위원회 게시판 — 쓰기 + 파일 업로드 구현 Plan (Plan 2/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** admin이 교육위원회 글을 작성·수정·삭제하고, 글에 이미지·문서를 다수 첨부할 수 있다. 읽기는 공개(Plan 1), 쓰기는 admin 전용.

**Architecture:** 작성 흐름은 **생성 → 편집에서 첨부**. 새 글은 텍스트만 먼저 저장(`createPost` Server Action) → 편집 페이지로 이동 → 첨부는 클라이언트가 **per-file로 Route Handler에 업로드**(`lib/api.ts` 래퍼). 업로드를 Route Handler로 두는 이유: Server Action 본문 크기 한도(1MB)와 수십 장×수십MB 단일 POST 문제를 피하기 위함(CLAUDE.md 데이터 경로 3순위 정당화). 실 MIME은 **file-type** 패키지로 매직바이트 검증.

**Tech Stack:** Next.js 16(App Router, Route Handler nodejs 런타임), Drizzle, file-type, zod, TypeScript strict, pnpm.

**검증 방식:** 순수 검증 로직은 `scripts/verify-uploads.mjs`(node)로 단위 검증, 스키마는 기존 db:verify, 그리고 `pnpm lint`/`pnpm build` + Preview 브라우저 e2e(admin 로그인→작성→업로드→공개 상세 확인→삭제).

**확정 한도(승인):** 파일당 ≤ 20MB, 게시물당 ≤ 50개, 합계 ≤ 300MB. 허용: 이미지 `png·jpg·jpeg·gif·webp`, 문서 `pdf·hwp·hwpx·docx·pptx·xlsx`.

**범위 밖(Plan 3):** 댓글 작성/삭제 UI·액션. (Plan 1에서 댓글 읽기 표시는 이미 있음.)

---

## File Structure

- `web/package.json` — `file-type` 의존성 + `uploads:verify` 스크립트
- `web/src/lib/api.ts` — 클라이언트 fetch 단일 래퍼 + `ApiError` + 응답 스키마 파싱 (신규)
- `web/src/lib/committee-upload.ts` — 업로드 정책 상수 + **순수** 검증 함수(클라이언트·서버 공용) (신규)
- `web/src/server/uploads/committee.ts` — server-only: 디스크 저장·삭제·DB 첨부 행 (신규)
- `web/src/app/api/committee/[postId]/uploads/route.ts` — POST 업로드(admin) (신규)
- `web/src/app/api/committee/attachments/[id]/route.ts` — DELETE 첨부(admin) (신규)
- `web/src/app/api/committee/files/[id]/route.ts` — GET 파일 스트리밍(공개) (신규)
- `web/src/server/actions/committee.ts` — createPost·updatePost·deletePost (admin) (신규)
- `web/src/app/(admin)/admin/committee/EditorForm.tsx` — 작성/수정 폼(client) (신규)
- `web/src/app/(admin)/admin/committee/AttachmentManager.tsx` — 첨부 업로드/삭제(client) (신규)
- `web/src/app/(admin)/admin/committee/new/page.tsx` — 새 글(server) (신규)
- `web/src/app/(admin)/admin/committee/[id]/edit/page.tsx` — 수정+첨부(server) (신규)
- `web/src/server/services/committee.ts` — `getCommitteePostForEdit`(admin 편집용, isPublished 무관) 추가 (수정)
- `web/src/app/committee/[id]/page.tsx` — 첨부 다운로드/썸네일 + admin 수정/삭제 컨트롤 (수정)
- `web/src/app/committee/_components/desktop/CommitteeDesktop.tsx` · `mobile/CommitteeMobile.tsx` — "새 글 작성" 버튼 → `/admin/committee/new` 라우팅 (수정)
- `web/scripts/verify-uploads.mjs` — 순수 검증 테스트 (신규)

---

## Task 1: file-type 설치 + 업로드 정책(순수) + 검증 스크립트

**Files:** Modify `web/package.json`; Create `web/src/lib/committee-upload.ts`, `web/scripts/verify-uploads.mjs`.

- [ ] **Step 1: file-type 설치**

Run: `cd web && pnpm add file-type`
Expected: `file-type`가 dependencies에 추가(최신 v21+, ESM). `pnpm-lock.yaml` 갱신.

- [ ] **Step 2: 업로드 정책·순수 검증 작성**

`web/src/lib/committee-upload.ts` 신규 (클라이언트·서버 공용 — server-only/DB import 금지):

```ts
// 교육위원회 첨부 정책 + 순수 검증. 클라이언트(사전 차단)·서버(최종 검증) 공용.
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_FILES_PER_POST = 50;
export const MAX_TOTAL_BYTES = 300 * 1024 * 1024; // 300MB

// 확장자 → 카테고리. office/hwpx는 zip 컨테이너, hwp는 CFB(OLE).
export type UploadKind = "image" | "pdf" | "office-zip" | "hwp-cfb";

export const ALLOWED_EXT: Record<string, UploadKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  pdf: "pdf",
  docx: "office-zip",
  pptx: "office-zip",
  xlsx: "office-zip",
  hwpx: "office-zip",
  hwp: "hwp-cfb",
};

export function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i < 0 ? "" : filename.slice(i + 1).toLowerCase();
}

// 클라이언트 사전 검증(확장자·용량). 통과해도 서버가 매직바이트로 재검증.
export function preCheck(filename: string, sizeBytes: number): string | null {
  const ext = extOf(filename);
  if (!(ext in ALLOWED_EXT)) return "허용되지 않은 형식입니다.";
  if (sizeBytes > MAX_FILE_BYTES) return "파일이 20MB를 초과합니다.";
  if (sizeBytes <= 0) return "빈 파일입니다.";
  return null;
}

// 서버 매직바이트 검증 결정. detected = file-type 결과(ext/mime) 또는 null.
// 반환: 통과 시 저장할 mime, 실패 시 null.
export function resolveMime(
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  const kind = ALLOWED_EXT[ext];
  if (!kind) return null;
  const dext = detected?.ext;
  const dmime = detected?.mime;
  switch (kind) {
    case "image": {
      // 이미지: 매직바이트가 반드시 이미지여야 하고 확장자와 일치
      if (!dmime || !dmime.startsWith("image/")) return null;
      const want = ext === "jpg" ? "jpeg" : ext;
      const got = dext === "jpg" ? "jpeg" : dext;
      return got === want ? dmime : null;
    }
    case "pdf":
      return dmime === "application/pdf" ? dmime : null;
    case "office-zip": {
      // docx/pptx/xlsx/hwpx = zip 컨테이너. file-type가 구체 타입 또는 'zip' 반환.
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
      // 한글 .hwp = CFB(OLE). file-type ext 'cfb'.
      return dext === "cfb" ? "application/x-hwp" : null;
  }
}
```

- [ ] **Step 3: package.json 스크립트 추가**

`web/package.json`의 `scripts`에 추가:
```json
    "uploads:verify": "node scripts/verify-uploads.mjs",
```

- [ ] **Step 4: 순수 검증 스크립트 작성**

`web/scripts/verify-uploads.mjs` 신규:

```js
// 업로드 순수 검증 — DB·디스크 없이.
//   실행: pnpm uploads:verify
import {
  preCheck,
  resolveMime,
  extOf,
  MAX_FILE_BYTES,
} from "../src/lib/committee-upload.ts";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`검증 실패: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

// extOf
assert(extOf("a.PNG") === "png", "확장자 소문자화");
assert(extOf("noext") === "", "확장자 없음");

// preCheck
assert(preCheck("a.exe", 10) !== null, "허용 외 확장자 거부");
assert(preCheck("a.png", MAX_FILE_BYTES + 1) !== null, "용량 초과 거부");
assert(preCheck("a.png", 0) !== null, "빈 파일 거부");
assert(preCheck("a.png", 1000) === null, "정상 이미지 통과");

// resolveMime — 이미지
assert(resolveMime("png", { ext: "png", mime: "image/png" }) === "image/png", "png 매직 일치");
assert(resolveMime("jpg", { ext: "jpg", mime: "image/jpeg" }) === "image/jpeg", "jpg→jpeg 정규화");
assert(resolveMime("png", { ext: "pdf", mime: "application/pdf" }) === null, "확장자 png인데 pdf면 거부");
assert(resolveMime("png", null) === null, "이미지 매직 미검출 거부");

// resolveMime — pdf
assert(resolveMime("pdf", { ext: "pdf", mime: "application/pdf" }) === "application/pdf", "pdf 통과");
assert(resolveMime("pdf", { ext: "png", mime: "image/png" }) === null, "pdf인데 이미지면 거부");

// resolveMime — office-zip
assert(
  resolveMime("docx", { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })?.includes("word"),
  "docx 구체 타입 통과",
);
assert(resolveMime("xlsx", { ext: "zip", mime: "application/zip" })?.includes("spreadsheet"), "xlsx zip 컨테이너 통과");
assert(resolveMime("hwpx", { ext: "zip", mime: "application/zip" }) === "application/hwp+zip", "hwpx zip 통과");
assert(resolveMime("docx", { ext: "cfb", mime: "application/x-cfb" }) === null, "docx인데 cfb면 거부");

// resolveMime — hwp
assert(resolveMime("hwp", { ext: "cfb", mime: "application/x-cfb" }) === "application/x-hwp", "hwp cfb 통과");
assert(resolveMime("hwp", { ext: "zip", mime: "application/zip" }) === null, "hwp인데 zip이면 거부");

console.log("\n✅ 업로드 순수 검증 통과");
```

- [ ] **Step 5: 검증 실행** — Run: `cd web && pnpm uploads:verify`
Expected: 모든 `✓` 후 `✅ 업로드 순수 검증 통과`.

- [ ] **Step 6: 커밋**
```bash
git add web/package.json web/pnpm-lock.yaml web/src/lib/committee-upload.ts web/scripts/verify-uploads.mjs
git commit -m "feat: 첨부 업로드 정책·순수 검증 + file-type 의존성"
```
(커밋 트레일러: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 2: lib/api.ts (클라이언트 fetch 단일 래퍼)

**Files:** Create `web/src/lib/api.ts`.

- [ ] **Step 1: 래퍼 작성** — `web/src/lib/api.ts` 신규 (CLAUDE.md 응답 스키마 준수):

```ts
// 클라이언트 fetch 단일 래퍼. Route Handler 응답 {ok,data}/{ok,error} 스키마를 파싱.
// 직접 fetch 금지 — 클라이언트에서 Route Handler 호출은 반드시 이 래퍼를 거친다.
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

async function parse<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("INVALID_RESPONSE", "서버 응답을 해석할 수 없습니다.");
  }
  if (!json.ok) throw new ApiError(json.error.code, json.error.message);
  return json.data;
}

export async function apiGet<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { method: "GET" }));
}

export async function apiPostForm<T>(url: string, form: FormData): Promise<T> {
  return parse<T>(await fetch(url, { method: "POST", body: form }));
}

export async function apiDelete<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { method: "DELETE" }));
}
```

- [ ] **Step 2: 빌드** — Run: `cd web && pnpm build`. 성공(아직 미사용, 타입 검사만).

- [ ] **Step 3: 커밋**
```bash
git add web/src/lib/api.ts
git commit -m "feat: 클라이언트 fetch 단일 래퍼(lib/api.ts) 추가"
```

---

## Task 3: 서버 업로드 저장/삭제 (server-only)

**Files:** Create `web/src/server/uploads/committee.ts`.

- [ ] **Step 1: 저장/삭제 헬퍼 작성** — `web/src/server/uploads/committee.ts` 신규:

```ts
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { attachments } from "@/server/db/schema";
import {
  extOf,
  preCheck,
  resolveMime,
  MAX_FILES_PER_POST,
  MAX_TOTAL_BYTES,
} from "@/lib/committee-upload";

// 업로드 루트 — 컨테이너 볼륨 마운트 지점. 실행 권한 없음.
const UPLOAD_DIR = join(process.cwd(), "uploads", "committee");

export type StoredAttachment = {
  id: string;
  name: string;
  sizeBytes: number;
  mime: string;
};

export class UploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// 게시물당 개수·합계 용량 확인
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
  if (count + 1 > MAX_FILES_PER_POST)
    throw new UploadError("TOO_MANY", `첨부는 게시물당 ${MAX_FILES_PER_POST}개까지입니다.`);
  if (total + incomingBytes > MAX_TOTAL_BYTES)
    throw new UploadError("TOO_LARGE_TOTAL", "게시물 첨부 합계 용량(300MB)을 초과합니다.");
}

// 단일 파일 검증·저장·DB 기록
export async function storeAttachment(postId: string, file: File): Promise<StoredAttachment> {
  const ext = extOf(file.name);
  const pre = preCheck(file.name, file.size);
  if (pre) throw new UploadError("INVALID_FILE", pre);
  await ensureCapacity(postId, file.size);

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = (await fileTypeFromBuffer(buf)) ?? null;
  const mime = resolveMime(ext, detected);
  if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const storedName = `${randomUUID()}.${ext}`;
  await writeFile(join(UPLOAD_DIR, storedName), buf);

  const [row] = await getDb()
    .insert(attachments)
    .values({
      postId,
      originalName: file.name,
      storedName,
      mime,
      sizeBytes: file.size,
    })
    .returning({ id: attachments.id });

  return { id: row.id, name: file.name, sizeBytes: file.size, mime };
}

export function uploadPath(storedName: string): string {
  return join(UPLOAD_DIR, storedName);
}

// 첨부 행 + 디스크 파일 삭제 (개별)
export async function deleteAttachment(id: string): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  if (!row) return;
  await db.delete(attachments).where(eq(attachments.id, id));
  await unlink(uploadPath(row.storedName)).catch(() => {});
}

// 글 삭제 전 디스크 파일 정리 (DB 행은 cascade로 삭제됨)
export async function deletePostFiles(postId: string): Promise<void> {
  const rows = await getDb()
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(eq(attachments.postId, postId));
  await Promise.all(rows.map((r) => unlink(uploadPath(r.storedName)).catch(() => {})));
}
```

- [ ] **Step 2: 빌드** — Run: `cd web && pnpm build`. 성공해야 함. (file-type ESM import 정상 확인.)

- [ ] **Step 3: 커밋**
```bash
git add web/src/server/uploads/committee.ts
git commit -m "feat: 첨부 디스크 저장·삭제·매직바이트 검증(server)"
```

---

## Task 4: 파일 서빙 + 업로드 + 첨부삭제 Route Handler

**Files:** Create `web/src/app/api/committee/files/[id]/route.ts`, `web/src/app/api/committee/[postId]/uploads/route.ts`, `web/src/app/api/committee/attachments/[id]/route.ts`.

> Route Handler 공통: 성공 `{ok:true,data}`, 실패 `{ok:false,error:{code,message}}`, `Content-Type: application/json; charset=utf-8`. 쓰기/삭제 핸들러는 **admin 재확인**(미admin이면 redirect가 아니라 JSON 403). `runtime = "nodejs"`.

- [ ] **Step 1: 파일 서빙(공개 GET)** — `web/src/app/api/committee/files/[id]/route.ts`:

```ts
import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { attachments } from "@/server/db/schema";
import { uploadPath } from "@/server/uploads/committee";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await getDb()
    .select({
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
    data = await readFile(uploadPath(row.storedName));
  } catch {
    return new Response("Not Found", { status: 404 });
  }
  // 원본 파일명은 RFC5987로 인코딩(한글 대응)
  const fn = encodeURIComponent(row.originalName);
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${fn}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
```

- [ ] **Step 2: 업로드(admin POST)** — `web/src/app/api/committee/[postId]/uploads/route.ts`:

```ts
import { getCurrentUser } from "@/server/auth/current-user";
import { storeAttachment, UploadError } from "@/server/uploads/committee";

export const runtime = "nodejs";

function err(code: string, message: string, status: number) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return err("FORBIDDEN", "권한이 없습니다.", 403);

  const { postId } = await params;
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return err("NO_FILE", "파일이 없습니다.", 400);

  const stored = [];
  for (const file of files) {
    try {
      stored.push(await storeAttachment(postId, file));
    } catch (e) {
      if (e instanceof UploadError) return err(e.code, e.message, 400);
      throw e;
    }
  }
  return Response.json({ ok: true, data: stored });
}
```

- [ ] **Step 3: 첨부 삭제(admin DELETE)** — `web/src/app/api/committee/attachments/[id]/route.ts`:

```ts
import { getCurrentUser } from "@/server/auth/current-user";
import { deleteAttachment } from "@/server/uploads/committee";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } }, { status: 403 });
  const { id } = await params;
  await deleteAttachment(id);
  return Response.json({ ok: true, data: { id } });
}
```

- [ ] **Step 4: 빌드** — Run: `cd web && pnpm build`. 라우트 목록에 `ƒ /api/committee/files/[id]`, `ƒ /api/committee/[postId]/uploads`, `ƒ /api/committee/attachments/[id]` 표시.

- [ ] **Step 5: 커밋**
```bash
git add web/src/app/api/committee
git commit -m "feat: 첨부 업로드·삭제·파일서빙 Route Handler 추가"
```

---

## Task 5: 글 작성/수정/삭제 Server Action + 편집용 조회

**Files:** Create `web/src/server/actions/committee.ts`; Modify `web/src/server/services/committee.ts`.

- [ ] **Step 1: 편집용 조회 추가** — `web/src/server/services/committee.ts` 하단에 추가(공개 조회와 달리 isPublished 무관, admin 편집 폼용):

```ts
export type CommitteeEditData = {
  id: string;
  category: string | null;
  title: string;
  excerpt: string | null;
  body: string | null;
  isPinned: boolean;
  attachments: { id: string; name: string; sizeBytes: number; mime: string }[];
};

export async function getCommitteePostForEdit(id: string): Promise<CommitteeEditData | null> {
  const db = getDb();
  const [r] = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      excerpt: posts.excerpt,
      body: posts.body,
      isPinned: posts.isPinned,
    })
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
  return { ...r, attachments: atts.map((a) => ({ ...a, sizeBytes: Number(a.sizeBytes) })) };
}
```

- [ ] **Step 2: Server Action 작성** — `web/src/server/actions/committee.ts` 신규:

```ts
"use server";
// 교육위원회 글 작성/수정/삭제. admin 전용, zod 검증, Drizzle.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { posts } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/current-user";
import { deletePostFiles } from "@/server/uploads/committee";
import { COMMITTEE_CATEGORIES_KO } from "@/lib/committee";

const postSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  category: z.enum(COMMITTEE_CATEGORIES_KO as [string, ...string[]]),
  excerpt: z.string().trim().optional().transform((v) => v || null),
  body: z.string().optional().transform((v) => v || null),
  isPinned: z.coerce.boolean(),
});

export interface PostFormState {
  error?: string;
}

function parse(formData: FormData) {
  return postSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    isPinned: formData.get("isPinned") === "on" || formData.get("isPinned") === "true",
  });
}

export async function createPost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const user = await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const [row] = await getDb()
    .insert(posts)
    .values({
      section: "committee",
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      isPinned: r.data.isPinned,
      authorId: user.id,
    })
    .returning({ id: posts.id });
  redirect(`/admin/committee/${row.id}/edit`);
}

export async function updatePost(id: string, _prev: PostFormState, formData: FormData): Promise<PostFormState> {
  await requireAdmin();
  const r = parse(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  await getDb()
    .update(posts)
    .set({
      category: r.data.category,
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      isPinned: r.data.isPinned,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));
  redirect(`/committee/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  await deletePostFiles(id); // 디스크 파일 먼저 정리 (DB 행은 cascade)
  await getDb().delete(posts).where(eq(posts.id, id));
  redirect("/committee");
}
```

비고: `updatePost`/`deletePost`는 `id`를 받는 시그니처이므로 폼에서는 `.bind(null, id)`로 바인딩한다(편집 페이지에서 처리).

- [ ] **Step 3: 빌드** — Run: `cd web && pnpm build`. 성공.

- [ ] **Step 4: 커밋**
```bash
git add web/src/server/actions/committee.ts web/src/server/services/committee.ts
git commit -m "feat: 교육위원회 글 작성/수정/삭제 Server Action + 편집 조회"
```

---

## Task 6: 편집 폼 + 첨부 매니저(client) + 에디터 페이지(server)

**Files:** Create `EditorForm.tsx`, `AttachmentManager.tsx`, `new/page.tsx`, `[id]/edit/page.tsx` (모두 `web/src/app/(admin)/admin/committee/` 하위).

- [ ] **Step 1: 편집 폼(client)** — `web/src/app/(admin)/admin/committee/EditorForm.tsx`:

```tsx
"use client";
import { useActionState } from "react";
import { COMMITTEE_CATEGORIES_KO } from "@/lib/committee";
import type { PostFormState } from "@/server/actions/committee";

type Initial = {
  title?: string;
  category?: string;
  excerpt?: string;
  body?: string;
  isPinned?: boolean;
};

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function EditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: PostFormState, formData: FormData) => Promise<PostFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="제목" style={inputStyle} />
      <select name="category" defaultValue={initial?.category ?? COMMITTEE_CATEGORIES_KO[0]} style={inputStyle}>
        {COMMITTEE_CATEGORIES_KO.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input name="excerpt" defaultValue={initial?.excerpt ?? ""} placeholder="요약 (선택)" style={inputStyle} />
      <textarea name="body" defaultValue={initial?.body ?? ""} placeholder="본문" rows={12} style={inputStyle} />
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPinned" defaultChecked={initial?.isPinned ?? false} /> 상단 고정
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 첨부 매니저(client)** — `web/src/app/(admin)/admin/committee/AttachmentManager.tsx`:

```tsx
"use client";
import { useState } from "react";
import { apiPostForm, apiDelete, ApiError } from "@/lib/api";
import { preCheck } from "@/lib/committee-upload";

type Att = { id: string; name: string; sizeBytes: number; mime: string };

export default function AttachmentManager({ postId, initial }: { postId: string; initial: Att[] }) {
  const [items, setItems] = useState<Att[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      // 한 파일씩 업로드 (수십 장 대응 — 거대한 단일 POST 회피)
      for (const f of files) {
        const pre = preCheck(f.name, f.size);
        if (pre) { setError(`${f.name}: ${pre}`); continue; }
        const form = new FormData();
        form.append("files", f);
        const added = await apiPostForm<Att[]>(`/api/committee/${postId}/uploads`, form);
        setItems((prev) => [...prev, ...added]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      await apiDelete(`/api/committee/attachments/${id}`);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제 실패");
    }
  }

  return (
    <div style={{ marginTop: 24, maxWidth: 640 }}>
      <h2 style={{ fontSize: 16 }}>첨부 ({items.length})</h2>
      <input type="file" multiple onChange={onPick} disabled={busy} />
      {busy && <span style={{ marginLeft: 8, fontSize: 13 }}>업로드 중…</span>}
      {error && <p role="alert" style={{ color: "#c00" }}>{error}</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={`/api/committee/files/${a.id}`} target="_blank" rel="noreferrer">{a.name}</a>
            <span style={{ fontSize: 12, color: "#888" }}>({Math.round(a.sizeBytes / 1024)} KB)</span>
            <button type="button" onClick={() => onDelete(a.id)} style={{ fontSize: 12 }}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: 새 글 페이지(server)** — `web/src/app/(admin)/admin/committee/new/page.tsx`:

```tsx
import { requireAdmin } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/committee";
import EditorForm from "../EditorForm";

export default async function NewCommitteePostPage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 글 작성</h1>
      <p style={{ color: "#666", fontSize: 13 }}>저장 후 편집 화면에서 파일을 첨부할 수 있습니다.</p>
      <EditorForm action={createPost} submitLabel="저장하고 첨부하기" />
    </main>
  );
}
```

- [ ] **Step 4: 수정 페이지(server)** — `web/src/app/(admin)/admin/committee/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getCommitteePostForEdit } from "@/server/services/committee";
import { updatePost, deletePost } from "@/server/actions/committee";
import EditorForm from "../../EditorForm";
import AttachmentManager from "../../AttachmentManager";

export default async function EditCommitteePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = await getCommitteePostForEdit(id);
  if (!post) notFound();

  const update = updatePost.bind(null, id);
  const remove = deletePost.bind(null, id);

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <Link href={`/committee/${id}`} style={{ fontSize: 13, color: "#666" }}>← 글 보기</Link>
      <h1 style={{ fontSize: 22 }}>글 수정</h1>
      <EditorForm
        action={update}
        initial={{
          title: post.title,
          category: post.category ?? undefined,
          excerpt: post.excerpt ?? undefined,
          body: post.body ?? undefined,
          isPinned: post.isPinned,
        }}
        submitLabel="수정 저장"
      />
      <AttachmentManager postId={id} initial={post.attachments} />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          글 삭제
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: 빌드·린트** — Run: `cd web && pnpm lint && pnpm build`. 둘 다 성공. 라우트에 `ƒ /admin/committee/new`, `ƒ /admin/committee/[id]/edit` 표시.

- [ ] **Step 6: 커밋**
```bash
git add "web/src/app/(admin)/admin/committee"
git commit -m "feat: 교육위원회 글 작성/수정 에디터 + 첨부 매니저"
```

---

## Task 7: 목록 "새 글 작성" 라우팅 + 상세 페이지 첨부/admin 컨트롤

**Files:** Modify `committee/[id]/page.tsx`, `CommitteeDesktop.tsx`, `CommitteeMobile.tsx`.

> 디자인 보존: 목록 컴포넌트는 "새 글 작성" 버튼에 **onClick 라우팅만** 추가(스타일 무변경).

- [ ] **Step 1: "새 글 작성" 버튼 라우팅** — `CommitteeDesktop.tsx`의 `새 글 작성` `<button>`에 `onClick={() => router.push("/admin/committee/new")}` 추가(이미 `useRouter` 사용 중). `CommitteeMobile.tsx`에도 동일한 "새 글 작성" 버튼이 있으면 동일 처리(없으면 생략). 스타일·마크업 변경 금지.

- [ ] **Step 2: 상세 페이지 첨부 다운로드/썸네일 + admin 컨트롤** — `web/src/app/committee/[id]/page.tsx` 수정:
  1. 상단에 admin 여부 확인 추가:
     ```tsx
     import { getCurrentUser } from "@/server/auth/current-user";
     ...
     const user = await getCurrentUser();
     const isAdmin = user?.role === "admin";
     ```
  2. 제목 아래(메타 근처)에 admin이면 수정 링크 노출:
     ```tsx
     {isAdmin && (
       <Link href={`/admin/committee/${id}/edit`} style={{ fontSize: 13, color: "#06c" }}>
         수정
       </Link>
     )}
     ```
  3. 첨부 섹션을 다운로드 링크 + 이미지 썸네일로 교체(기존 `<li>{a.name} (KB)</li>` 대신):
     ```tsx
     {post.attachments.length > 0 && (
       <section style={{ marginTop: 32 }}>
         <h2 style={{ fontSize: 15 }}>첨부 ({post.attachments.length})</h2>
         <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
           {post.attachments.map((a) => (
             <li key={a.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
               {a.mime.startsWith("image/") && (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={`/api/committee/files/${a.id}`} alt={a.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }} />
               )}
               <a href={`/api/committee/files/${a.id}`} target="_blank" rel="noreferrer">{a.name}</a>
               <span style={{ fontSize: 12, color: "#888" }}>({Math.round(a.sizeBytes / 1024)} KB)</span>
             </li>
           ))}
         </ul>
       </section>
     )}
     ```
     (참고: 상세 페이지는 디자인 원본에 없는 **최소 기능 신규 화면**이므로 이 정도 변경은 허용. `<img>`는 외부 최적화가 불필요한 첨부 미리보기라 `next/image` 대신 `<img>` + eslint-disable 주석 사용.)

- [ ] **Step 3: 빌드·린트** — Run: `cd web && pnpm lint && pnpm build`. 둘 다 성공.

- [ ] **Step 4: 커밋**
```bash
git add web/src/app/committee
git commit -m "feat: 상세 첨부 다운로드·썸네일 + admin 수정 링크 + 목록 새글 라우팅"
```

---

## Task 8: 통합 검증 (Preview 브라우저 e2e + 회귀)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 회귀 검증** — Run:
```bash
cd web && pnpm lint && pnpm build && pnpm db:verify && pnpm committee:verify && pnpm uploads:verify
```
Expected: 전부 통과.

- [ ] **Step 2: 로컬 DB + Preview 기동** — `rm -rf web/.pglite && pnpm dev:db`(백그라운드), Preview `web-dev` 기동.

- [ ] **Step 3: admin 작성 흐름** — 브라우저:
  1. `/login` 에서 `admin@seogyeong.kr` / `admin1234` 로그인 → `/admin`.
  2. `/admin/committee/new` 접속 → 제목·카테고리·본문 입력 → 저장 → `/admin/committee/[id]/edit`로 이동 확인.
  3. 편집 화면에서 이미지 파일 1~2개 업로드 → 목록에 나타남. 잘못된 확장자(.exe 등)·용량 초과 시 에러 메시지 확인.

- [ ] **Step 4: 공개 확인 + 다운로드** — 비로그인(또는 새 컨텍스트)으로 `/committee` → 새 글이 목록에 보임 → 상세 진입 → 첨부 이미지 썸네일·다운로드 링크 동작(`/api/committee/files/[id]`).

- [ ] **Step 5: 첨부 삭제 + 글 삭제** — 편집 화면에서 첨부 삭제(목록에서 사라짐) → 글 삭제 → `/committee`로 이동, 목록에서 사라짐. (삭제된 글의 첨부 파일이 디스크에서 사라졌는지: `ls web/uploads/committee/` 로 확인 — 글 삭제 후 해당 파일 없음.)

- [ ] **Step 6: 권한 가드** — 로그아웃 상태로 `/admin/committee/new` 접속 → `/login`으로 리다이렉트(proxy). 비admin 토큰으로 `POST /api/committee/[postId]/uploads` 시 403 JSON(수동 curl 선택).

- [ ] **Step 7: 정리** — dev:db·Preview 종료, 포트 5432/3000 비우기. `.pglite`·`uploads/`는 gitignore.

---

## Self-Review 메모

- **스펙 커버리지:** admin 쓰기(작성/수정/삭제)·생성→편집 흐름·다중 파일 업로드(per-file)·확장자·매직바이트(file-type)·용량·개수·합계 한도·파일명 재생성·공개 다운로드·디스크 정리·권한(서버 재확인+JSON 403) 모두 태스크에 매핑.
- **타입/시그니처 일관성:** `StoredAttachment`/`Att`(id,name,sizeBytes,mime) 일치, `PostFormState`, `createPost`/`updatePost(id 바인딩)`/`deletePost(id 바인딩)`, `getCommitteePostForEdit` 반환 ↔ 에디터 initial, `apiPostForm`/`apiDelete` ↔ Route Handler 응답 스키마 일치.
- **보안:** 업로드 admin 재확인, 매직바이트 검증, 파일명 uuid 재생성, Drizzle 파라미터 바인딩, 파일 서빙 시 inline+UTF-8 파일명, raw SQL 없음. 업로드 디렉터리 `web/uploads/`(gitignore, 컨테이너 볼륨).
- **마크업 보존:** 목록 컴포넌트는 버튼 onClick만 추가. 상세 페이지는 신규 최소 화면이라 변경 허용.
- **플레이스홀더:** 없음. 전 코드 스텝에 실제 코드 포함.
