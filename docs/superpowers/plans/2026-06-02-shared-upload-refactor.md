# committee↔resource 공통 추출 리팩터 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 교육위원회·자료공유의 중복(포맷 유틸·업로드 정책·서버 저장·첨부 매니저)을 공통 모듈로 추출한다. **동작 100% 보존**(behavior-preserving refactor) — 세 번째 섹션 추가 전 중복 제거.

**Architecture:** 근거리 중복을 "코어 + 섹션별 설정"으로 매개변수화한다. 코어는 일반 로직, 섹션 파일은 얇은 설정·재export(기존 export 이름 유지 → 호출처 변경 최소화). EditorForm은 스키마(컬럼)가 달라 분리 유지.

**Tech Stack:** Next.js 16, Drizzle, file-type, TS strict, pnpm.

**안전망(필수):** 모든 단계는 동작 보존이며 기존 검증이 인코딩한 행위로 보호된다 — `pnpm build`/`lint` + `db:verify`·`committee:verify`·`uploads:verify`·`resource:verify`가 매 단계 통과해야 한다. 최종 Preview/dev e2e로 두 섹션 회귀 확인.

**범위(추출):** ① 포맷 유틸(`lib/format.ts`) ② 업로드 정책 엔진(`lib/upload-policy.ts`) ③ 서버 저장 코어(`server/uploads/core.ts`) ④ 공통 AttachmentManager.
**범위 밖(분리 유지):** EditorForm(committee=body+isPinned, resource=sub로 필드 상이), 뷰모델 매퍼(섹션별 뷰모델 상이), Route Handler(얇은 중복 — 후속), 서비스 쿼리.

---

## File Structure

- `web/src/lib/format.ts` — formatDate·formatBytes·formatAuthor (신규, 클라 안전)
- `web/src/lib/committee.ts` — 로컬 formatDate/formatAuthor 제거 → format.ts 사용 (수정)
- `web/src/lib/resource.ts` — 로컬 formatDate/formatBytes 제거 → format.ts 사용 (수정)
- `web/src/server/services/committee.ts`·`resource.ts` — formatAuthor/formatDate 사용처를 format.ts로 (수정)
- `web/src/lib/upload-policy.ts` — UploadKind/UploadPolicy 타입 + extOf·preCheck(policy,…)·resolveMime(policy,…) 코어 (신규)
- `web/src/lib/committee-upload.ts` — `COMMITTEE_UPLOAD` 정책 + 얇은 preCheck/resolveMime 재export (수정)
- `web/src/lib/resource-upload.ts` — `RESOURCE_UPLOAD` 정책 + 얇은 preCheck/resolveMime 재export (수정)
- `web/src/server/uploads/core.ts` — createAttachmentStore({uploadDir,section,policy}) + UploadError + StoredAttachment (신규)
- `web/src/server/uploads/committee.ts`·`resource.ts` — 코어 호출 + 기존 이름 재export (수정)
- `web/src/app/_components/AttachmentManager.tsx` — 공통 첨부 매니저(URL·preCheck 주입) (신규)
- `web/src/app/(admin)/admin/committee/[id]/edit/page.tsx`·`resources/[id]/edit/page.tsx` — 공통 매니저 사용 (수정)
- `web/src/app/(admin)/admin/committee/AttachmentManager.tsx`·`resources/ResourceAttachmentManager.tsx` — 삭제 (제거)

---

## Task 1: 포맷 유틸 추출 (lib/format.ts)

**Files:** Create `web/src/lib/format.ts`; Modify `lib/committee.ts`, `lib/resource.ts`, `server/services/committee.ts`, `server/services/resource.ts`.

- [ ] **Step 1: 공통 포맷 모듈** — `web/src/lib/format.ts`:
```ts
// 공통 포맷 유틸 — 클라이언트 안전 순수 함수.
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

// 작성자 표시명 — 이름 + 직함(있으면). 이름 없으면 "익명".
export function formatAuthor(name: string | null, title: string | null): string {
  const n = name ?? "익명";
  return title ? `${n} ${title}` : n;
}
```

- [ ] **Step 2: committee.ts 정리** — `web/src/lib/committee.ts`에서 로컬 `formatDate`·`formatAuthor` 정의를 제거하고 상단에 `import { formatDate, formatAuthor } from "./format";` 추가. (이 파일이 export하던 `formatDate`/`formatAuthor`를 외부가 쓰므로) 호환을 위해 `export { formatDate, formatAuthor } from "./format";` re-export 추가. `toCommitteePostView` 내부의 `formatDate`/`formatAuthor` 호출은 그대로 동작.

- [ ] **Step 3: resource.ts 정리** — `web/src/lib/resource.ts`에서 로컬 `formatDate`·`formatBytes` 정의 제거, `import { formatDate, formatBytes } from "./format";` 추가 + `export { formatDate, formatBytes } from "./format";`(외부 사용처 호환: 상세 페이지가 `formatBytes`를 import). `toResourceFileView` 내부 호출 그대로.

- [ ] **Step 4: 서비스 author 조합 통일** — `server/services/committee.ts`·`resource.ts`에서 `r.authorTitle ? \`${name} ${r.authorTitle}\` : name` 형태의 인라인 작성자 조합을 `formatAuthor(r.authorName, r.authorTitle)`로 교체(각 파일에서 `formatAuthor`를 `@/lib/format` 또는 `@/lib/committee`/`@/lib/resource`에서 import). committee 서비스는 `getCommitteePost`의 게시글 author + 댓글 author 2곳, resource 서비스는 `getResourcePost`·`getResourcePostForEdit`(있으면) author. **동작 동일**(formatAuthor가 같은 규칙).

- [ ] **Step 5: 검증** — `cd web && pnpm build && pnpm committee:verify && pnpm resource:verify`. 전부 통과(매퍼 출력 동일 — formatDate/formatBytes/by 결과 불변).

- [ ] **Step 6: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/lib/format.ts web/src/lib/committee.ts web/src/lib/resource.ts web/src/server/services/committee.ts web/src/server/services/resource.ts
git commit -m "refactor: 공통 포맷 유틸(format.ts) 추출"
```
(트레일러: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 2: 업로드 정책 엔진 추출 (lib/upload-policy.ts)

**Files:** Create `web/src/lib/upload-policy.ts`; Modify `lib/committee-upload.ts`, `lib/resource-upload.ts`.

- [ ] **Step 1: 정책 코어** — `web/src/lib/upload-policy.ts`:
```ts
// 업로드 정책 엔진 — 클라이언트 안전 순수. 섹션별 정책을 주입해 검증.
export type UploadKind =
  | "image" | "pdf" | "office-zip" | "hwp-cfb"
  | "video" | "audio" | "archive" | "psd" | "ai";

export type UploadPolicy = {
  allowedExt: Record<string, UploadKind>;
  maxFileBytes: number;
  maxFiles: number;
  maxTotalBytes: number;
  // preCheck 메시지에 쓸 사람 친화 한도 표기 (예: "20MB", "300MB")
  maxFileLabel: string;
};

export function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i < 0 ? "" : filename.slice(i + 1).toLowerCase();
}

export function preCheck(policy: UploadPolicy, filename: string, sizeBytes: number): string | null {
  const ext = extOf(filename);
  if (!(ext in policy.allowedExt)) return "허용되지 않은 형식입니다.";
  if (sizeBytes > policy.maxFileBytes) return `파일이 ${policy.maxFileLabel}를 초과합니다.`;
  if (sizeBytes <= 0) return "빈 파일입니다.";
  return null;
}

export function resolveMime(
  policy: UploadPolicy,
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  const kind = policy.allowedExt[ext];
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
      return dext === ext && !!dmime && dmime.startsWith("video/") ? dmime : null;
    case "audio":
      return dext === ext && !!dmime && dmime.startsWith("audio/") ? dmime : null;
    case "archive":
      return dext === "zip" ? "application/zip" : null;
    case "psd":
      return dext === "psd" ? "image/vnd.adobe.photoshop" : null;
    case "ai":
      return dmime === "application/pdf" || dmime === "application/postscript"
        ? "application/illustrator"
        : null;
  }
}
```

- [ ] **Step 2: committee-upload.ts → 정책 설정** — `web/src/lib/committee-upload.ts`를 다음으로 교체(기존 export 이름·시그니처 유지):
```ts
// 교육위원회 첨부 정책. 검증 로직은 lib/upload-policy 코어를 사용.
import {
  type UploadPolicy,
  extOf as coreExtOf,
  preCheck as corePreCheck,
  resolveMime as coreResolveMime,
} from "./upload-policy";

export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_FILES_PER_POST = 50;
export const MAX_TOTAL_BYTES = 300 * 1024 * 1024; // 300MB

export const COMMITTEE_UPLOAD: UploadPolicy = {
  allowedExt: {
    png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
    pdf: "pdf",
    docx: "office-zip", pptx: "office-zip", xlsx: "office-zip", hwpx: "office-zip",
    hwp: "hwp-cfb",
  },
  maxFileBytes: MAX_FILE_BYTES,
  maxFiles: MAX_FILES_PER_POST,
  maxTotalBytes: MAX_TOTAL_BYTES,
  maxFileLabel: "20MB",
};

export const extOf = coreExtOf;
export function preCheck(filename: string, sizeBytes: number): string | null {
  return corePreCheck(COMMITTEE_UPLOAD, filename, sizeBytes);
}
export function resolveMime(
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  return coreResolveMime(COMMITTEE_UPLOAD, ext, detected);
}
```
(주의: 기존 `MAX_FILE_BYTES`/`MAX_FILES_PER_POST`/`MAX_TOTAL_BYTES`/`extOf`/`preCheck`/`resolveMime` export 이름이 그대로 유지되어 verify-uploads.mjs·server/uploads/committee.ts·committee AttachmentManager가 변경 없이 동작. `UploadKind`/`ALLOWED_EXT`를 외부에서 쓰지 않으면 제거; 쓰면 유지.)

- [ ] **Step 3: resource-upload.ts → 정책 설정** — `web/src/lib/resource-upload.ts`를 다음으로 교체:
```ts
// 자료공유 첨부 정책. 검증 로직은 lib/upload-policy 코어를 사용.
import {
  type UploadPolicy,
  extOf as coreExtOf,
  preCheck as corePreCheck,
  resolveMime as coreResolveMime,
} from "./upload-policy";

export const RES_MAX_FILE_BYTES = 300 * 1024 * 1024; // 300MB
export const RES_MAX_FILES = 20;
export const RES_MAX_TOTAL_BYTES = 500 * 1024 * 1024; // 500MB

export const RESOURCE_UPLOAD: UploadPolicy = {
  allowedExt: {
    png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
    pdf: "pdf",
    docx: "office-zip", pptx: "office-zip", xlsx: "office-zip", hwpx: "office-zip",
    hwp: "hwp-cfb",
    mp4: "video", mov: "video", webm: "video",
    mp3: "audio", wav: "audio",
    zip: "archive",
    psd: "psd",
    ai: "ai",
  },
  maxFileBytes: RES_MAX_FILE_BYTES,
  maxFiles: RES_MAX_FILES,
  maxTotalBytes: RES_MAX_TOTAL_BYTES,
  maxFileLabel: "300MB",
};

export const extOf = coreExtOf;
export function preCheck(filename: string, sizeBytes: number): string | null {
  return corePreCheck(RESOURCE_UPLOAD, filename, sizeBytes);
}
export function resolveMime(
  ext: string,
  detected: { ext?: string; mime?: string } | null,
): string | null {
  return coreResolveMime(RESOURCE_UPLOAD, ext, detected);
}
```

- [ ] **Step 4: 검증** — `cd web && pnpm build && pnpm uploads:verify && pnpm resource:verify`. 두 verify가 preCheck/resolveMime을 같은 이름으로 import하므로 **모든 단언이 그대로 통과해야 함**(동작 보존 증명). 메시지도 동일("20MB"/"300MB 초과"). `pnpm lint`.

- [ ] **Step 5: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/lib/upload-policy.ts web/src/lib/committee-upload.ts web/src/lib/resource-upload.ts
git commit -m "refactor: 업로드 정책 엔진(upload-policy.ts) 추출"
```

---

## Task 3: 서버 저장 코어 추출 (server/uploads/core.ts)

**Files:** Create `web/src/server/uploads/core.ts`; Modify `server/uploads/committee.ts`, `server/uploads/resource.ts`.

- [ ] **Step 1: 저장 코어** — `web/src/server/uploads/core.ts`:
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
  type UploadPolicy,
  extOf,
  preCheck,
  resolveMime,
} from "@/lib/upload-policy";

export type StoredAttachment = { id: string; name: string; sizeBytes: number; mime: string };

export class UploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type Section = "committee" | "resource";

export type AttachmentStore = {
  uploadPath: (storedName: string) => string;
  storeAttachment: (postId: string, file: File) => Promise<StoredAttachment>;
  deleteAttachment: (id: string) => Promise<void>;
  deletePostFiles: (postId: string) => Promise<void>;
};

// 섹션별 설정으로 첨부 저장소를 만든다(디렉터리·section·정책 + 사용자 메시지).
export function createAttachmentStore(config: {
  uploadDir: string;
  section: Section;
  policy: UploadPolicy;
  notFoundMessage: string; // 대상 글 부재 시 메시지
  tooManyMessage: string; // 개수 초과
  tooLargeMessage: string; // 합계 초과
}): AttachmentStore {
  const { uploadDir, section, policy } = config;

  function uploadPath(storedName: string): string {
    return join(uploadDir, storedName);
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
    if (count + 1 > policy.maxFiles) throw new UploadError("TOO_MANY", config.tooManyMessage);
    if (total + incomingBytes > policy.maxTotalBytes)
      throw new UploadError("TOO_LARGE_TOTAL", config.tooLargeMessage);
  }

  async function storeAttachment(postId: string, file: File): Promise<StoredAttachment> {
    const ext = extOf(file.name);
    const pre = preCheck(policy, file.name, file.size);
    if (pre) throw new UploadError("INVALID_FILE", pre);

    const [target] = await getDb()
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.section, section)))
      .limit(1);
    if (!target) throw new UploadError("POST_NOT_FOUND", config.notFoundMessage);

    await ensureCapacity(postId, file.size);

    const buf = Buffer.from(await file.arrayBuffer());
    const detected = (await fileTypeFromBuffer(buf)) ?? null;
    const mime = resolveMime(policy, ext, detected);
    if (!mime) throw new UploadError("MIME_MISMATCH", "파일 내용이 확장자와 일치하지 않습니다.");

    await mkdir(uploadDir, { recursive: true });
    const storedName = `${randomUUID()}.${ext}`;
    await writeFile(join(uploadDir, storedName), buf);

    const [row] = await getDb()
      .insert(attachments)
      .values({ postId, originalName: file.name, storedName, mime, sizeBytes: file.size })
      .returning({ id: attachments.id });

    return { id: row.id, name: file.name, sizeBytes: file.size, mime };
  }

  async function deleteAttachment(id: string): Promise<void> {
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

  async function deletePostFiles(postId: string): Promise<void> {
    const rows = await getDb()
      .select({ storedName: attachments.storedName })
      .from(attachments)
      .where(eq(attachments.postId, postId));
    await Promise.all(rows.map((r) => unlink(uploadPath(r.storedName)).catch(() => {})));
  }

  return { uploadPath, storeAttachment, deleteAttachment, deletePostFiles };
}
```

- [ ] **Step 2: committee.ts → 코어 사용** — `web/src/server/uploads/committee.ts`를 교체(기존 export 이름 유지):
```ts
import "server-only";
import { join } from "node:path";
import { createAttachmentStore, UploadError, type StoredAttachment } from "./core";
import { COMMITTEE_UPLOAD } from "@/lib/committee-upload";

const UPLOAD_DIR = join(process.cwd(), "uploads", "committee");

const store = createAttachmentStore({
  uploadDir: UPLOAD_DIR,
  section: "committee",
  policy: COMMITTEE_UPLOAD,
  notFoundMessage: "게시물을 찾을 수 없습니다.",
  tooManyMessage: `첨부는 게시물당 ${COMMITTEE_UPLOAD.maxFiles}개까지입니다.`,
  tooLargeMessage: "게시물 첨부 합계 용량(300MB)을 초과합니다.",
});

export { UploadError };
export type { StoredAttachment };
export const uploadPath = store.uploadPath;
export const storeAttachment = store.storeAttachment;
export const deleteAttachment = store.deleteAttachment;
export const deletePostFiles = store.deletePostFiles;
```

- [ ] **Step 3: resource.ts → 코어 사용** — `web/src/server/uploads/resource.ts`를 교체(기존 export 이름 유지: resourceUploadPath, storeResourceAttachment, deleteResourceAttachment, deleteResourcePostFiles, RESOURCE_UPLOAD_DIR):
```ts
import "server-only";
import { join } from "node:path";
import { createAttachmentStore, UploadError, type StoredAttachment } from "./core";
import { RESOURCE_UPLOAD } from "@/lib/resource-upload";

export const RESOURCE_UPLOAD_DIR = join(process.cwd(), "uploads", "resource");

const store = createAttachmentStore({
  uploadDir: RESOURCE_UPLOAD_DIR,
  section: "resource",
  policy: RESOURCE_UPLOAD,
  notFoundMessage: "자료를 찾을 수 없습니다.",
  tooManyMessage: `첨부는 자료당 ${RESOURCE_UPLOAD.maxFiles}개까지입니다.`,
  tooLargeMessage: "자료 첨부 합계 용량(500MB)을 초과합니다.",
});

export { UploadError };
export type { StoredAttachment };
export const resourceUploadPath = store.uploadPath;
export const storeResourceAttachment = store.storeAttachment;
export const deleteResourceAttachment = store.deleteAttachment;
export const deleteResourcePostFiles = store.deletePostFiles;
```

- [ ] **Step 4: 검증** — `cd web && pnpm lint && pnpm build`. 빌드가 두 섹션의 Route Handler·서비스·액션이 기존 export 이름을 그대로 import함을 검사. 라우트 목록 변동 없음.

- [ ] **Step 5: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/server/uploads/core.ts web/src/server/uploads/committee.ts web/src/server/uploads/resource.ts
git commit -m "refactor: 서버 첨부 저장 코어(createAttachmentStore) 추출"
```

---

## Task 4: 공통 AttachmentManager 추출

**Files:** Create `web/src/app/_components/AttachmentManager.tsx`; Modify committee/resource edit 페이지; Delete 두 중복 컴포넌트.

- [ ] **Step 1: 공통 컴포넌트** — `web/src/app/_components/AttachmentManager.tsx`:
```tsx
"use client";
import { useState } from "react";
import { apiPostForm, apiDelete, ApiError } from "@/lib/api";

type Att = { id: string; name: string; sizeBytes: number; mime: string };

type Props = {
  postId: string;
  initial: Att[];
  // 섹션별 엔드포인트·사전검증 주입
  uploadUrl: (postId: string) => string;
  deleteUrl: (id: string) => string;
  fileUrl: (id: string) => string;
  preCheck: (filename: string, sizeBytes: number) => string | null;
};

export default function AttachmentManager({
  postId,
  initial,
  uploadUrl,
  deleteUrl,
  fileUrl,
  preCheck,
}: Props) {
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
        const added = await apiPostForm<Att[]>(uploadUrl(postId), form);
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
      await apiDelete(deleteUrl(id));
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
            <a href={fileUrl(a.id)}>{a.name}</a>
            <span style={{ fontSize: 12, color: "#888" }}>({Math.round(a.sizeBytes / 1024)} KB)</span>
            <button type="button" onClick={() => onDelete(a.id)} style={{ fontSize: 12 }}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```
비고: 기존 committee 매니저는 `<a target="_blank" rel="noreferrer">`였고 resource는 일반 링크였다. 공통은 일반 링크(다운로드/inline 모두 동작)로 통일 — 사소한 동작 차이이나 마크업 보존 대상(이식 디자인)이 아닌 신규 admin 최소 화면이라 허용.

- [ ] **Step 2: committee edit 페이지** — `web/src/app/(admin)/admin/committee/[id]/edit/page.tsx`의 `import AttachmentManager from "../../AttachmentManager";`를 제거하고 공통 컴포넌트 사용:
```tsx
import AttachmentManager from "@/app/_components/AttachmentManager";
import { preCheck } from "@/lib/committee-upload";
...
<AttachmentManager
  postId={id}
  initial={post.attachments}
  uploadUrl={(pid) => `/api/committee/${pid}/uploads`}
  deleteUrl={(aid) => `/api/committee/attachments/${aid}`}
  fileUrl={(aid) => `/api/committee/files/${aid}`}
  preCheck={preCheck}
/>
```

- [ ] **Step 3: resource edit 페이지** — `web/src/app/(admin)/admin/resources/[id]/edit/page.tsx`의 `ResourceAttachmentManager` import 제거, 공통 사용:
```tsx
import AttachmentManager from "@/app/_components/AttachmentManager";
import { preCheck } from "@/lib/resource-upload";
...
<AttachmentManager
  postId={id}
  initial={resource.attachments}
  uploadUrl={(pid) => `/api/resources/${pid}/uploads`}
  deleteUrl={(aid) => `/api/resources/attachments/${aid}`}
  fileUrl={(aid) => `/api/resources/files/${aid}`}
  preCheck={preCheck}
/>
```

- [ ] **Step 4: 중복 컴포넌트 삭제**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git rm "web/src/app/(admin)/admin/committee/AttachmentManager.tsx" "web/src/app/(admin)/admin/resources/ResourceAttachmentManager.tsx"
```

- [ ] **Step 5: 검증** — `cd web && pnpm lint && pnpm build`. 두 edit 라우트 정상 컴파일.

- [ ] **Step 6: 커밋**
```bash
cd /Users/noah/Documents/projects/spec/.claude/worktrees/pedantic-gates-aba33a
git add web/src/app
git commit -m "refactor: 공통 AttachmentManager 추출 + 중복 제거"
```

---

## Task 5: 통합 검증 (회귀 + e2e)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 회귀** — `cd web && pnpm lint && pnpm build && pnpm db:verify && pnpm committee:verify && pnpm uploads:verify && pnpm resource:verify` 전부 통과(동작 보존 증명).

- [ ] **Step 2: 로컬 DB + dev** — `rm -rf web/.pglite web/uploads/* && pnpm dev:db`(백그라운드) + Bash `pnpm dev`(백그라운드).

- [ ] **Step 3: 두 섹션 회귀 e2e (curl/Preview)**:
  - 공개: `/committee` 목록·상세, `/resources` 목록·상세 정상 렌더.
  - admin 로그인 → 교육위원회 글 작성→편집에서 PNG 업로드(공통 매니저) 200·잘못된 파일 거부. 자료 작성→편집 업로드 200·대용량 형식.
  - 다운로드(committee `/api/committee/files/[id]`·resource `/api/resources/files/[id]`) 동작, 자료 다운로드 수 증가.
  - 비로그인 업로드 403.
  (committee/resource 업로드가 동일 코어로 동작하는지가 핵심.)

- [ ] **Step 4: 정리** — 서버 종료, 포트 비우기.

---

## Self-Review 메모

- **동작 보존:** 모든 추출은 기존 export 이름·시그니처를 유지(committee-upload/resource-upload의 preCheck/resolveMime, server/uploads의 함수명, format 함수). verify 스크립트가 import 경로/이름 불변으로 그대로 통과 → 행위 동일성 증명.
- **유일한 의도적 차이:** 공통 AttachmentManager의 링크가 committee의 `target=_blank rel=noreferrer`를 제거(resource와 통일). admin 전용 최소 화면이라 허용. (원하면 prop으로 분기 가능 — 후속.)
- **분리 유지:** EditorForm(필드 상이), 뷰모델 매퍼, Route Handler(얇음), 서비스 쿼리.
- **타입 일관성:** `UploadPolicy`/`UploadKind`(upload-policy) ↔ 섹션 정책 ↔ core. `StoredAttachment`는 core에서 정의, 섹션이 재export.
- **플레이스홀더:** 없음.
