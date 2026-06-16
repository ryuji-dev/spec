# 공개 `/notice` 공지 페이지 + 누적형 공지 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** notice를 누적형 게시판으로 전환해, 일반 유저가 `/notice`에서 지난 공지 목록·상세를 열람하고 admin이 공지를 작성·수정·삭제할 수 있게 한다.

**Architecture:** notice는 `posts`(section='notice')에 누적된다. committee의 서비스/액션/admin 패턴을 미러(카테고리·첨부·댓글·인기 제외). 공개 목록은 committee와 같은 디자인 언어(`PageHero`·forest 팔레트)로 간결히 신설, 상세는 committee처럼 최소 기능. 기존 싱글톤 "메인 공지 한 줄"(set/clearAnnouncement·AnnouncementForm·getCurrentAnnouncement)은 공지 CRUD로 대체한다. `/main` 배너는 getHomeData의 최신 공지 제목을 그대로 쓴다(변경 없음).

**Tech Stack:** Next.js 16 App Router(Server Component·Server Action·`useActionState`), supabase-js(PostgREST), zod, TypeScript strict. 테스트 러너 없음 → `pnpm lint`/`pnpm build` + 로컬 Supabase·Preview MCP로 검증.

**빌드 안전 순서:** 신규 기능을 **추가(additive)** 한 뒤 공개 페이지를 붙이고, 마지막에 싱글톤을 제거한다. 그래서 매 커밋 빌드가 통과한다.

**참조(미러 대상):**
- 서비스: `src/server/services/committee.ts` (`one()`, list/detail/forEdit/incrementView 패턴)
- 액션: `src/server/actions/committee.ts` (`createPost`/`updatePost`/`deletePost`)
- admin: `src/app/(admin)/admin/committee/{EditorForm.tsx,new/page.tsx,[id]/edit/page.tsx}`
- 공개: `src/app/committee/page.tsx`, `src/app/committee/[id]/page.tsx`
- 공유 UI: `@/app/_components/PageHero`(named export `PageHeroDesktop`/`PageHeroMobile`, props `{kicker,title,lead?,rightAccent?,bgImage?}`), forest 팔레트 CSS 변수 `var(--palette-*)`, `@/lib/format`(`formatDate`,`formatAuthor`), `@/lib/device`(`getDeviceType`)

---

### Task 1: notice 서비스 — 목록·상세·편집·조회수 (additive)

`getCurrentAnnouncement`는 **남겨둔 채**(Task 7에서 제거) 새 함수/타입을 추가한다.

**Files:**
- Modify: `src/server/services/notice.ts`

- [ ] **Step 1: 서비스 재작성(기존 getCurrentAnnouncement 유지 + 신규 추가)**

`src/server/services/notice.ts` 전체를 아래로 교체:

```ts
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { formatDate, formatAuthor } from "@/lib/format";

// PostgREST 임베드 to-one이 환경에 따라 배열로 올 수 있어 단일 객체로 정규화.
function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const SECTION = "notice" as const;
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// /admin 메인 공지(싱글톤) 표시용 — Task 7에서 제거 예정(현재 admin 페이지가 사용 중).
export async function getCurrentAnnouncement(): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("posts")
    .select("title")
    .eq("section", SECTION)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.title ?? null;
}

export type NoticePost = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  views: number;
  isPinned: boolean;
  isNew: boolean;
};

export type NoticeListData = { pinned: NoticePost | null; posts: NoticePost[] };

export async function getNoticeListData(): Promise<NoticeListData> {
  const now = Date.now();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, view_count, created_at, is_pinned, author:profiles(name, title)")
    .eq("section", SECTION)
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  let pinned: NoticePost | null = null;
  const posts: NoticePost[] = [];
  for (const r of data ?? []) {
    const a = one(r.author);
    const createdAt = new Date(r.created_at);
    const view: NoticePost = {
      id: r.id,
      title: r.title,
      excerpt: r.excerpt ?? "",
      author: formatAuthor(a?.name ?? null, a?.title ?? null),
      date: formatDate(createdAt),
      views: r.view_count,
      isPinned: r.is_pinned,
      isNew: now - createdAt.getTime() < NEW_WINDOW_MS,
    };
    if (r.is_pinned && !pinned) pinned = view;
    else posts.push(view);
  }
  return { pinned, posts };
}

export type NoticeDetail = {
  id: string;
  title: string;
  body: string | null;
  author: string;
  date: string;
  views: number;
};

export async function getNoticePost(id: string): Promise<NoticeDetail | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("posts")
    .select("id, title, body, view_count, created_at, author:profiles(name, title)")
    .eq("id", id)
    .eq("section", SECTION)
    .eq("is_published", true)
    .maybeSingle();
  if (!r) return null;
  const a = one(r.author);
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    author: formatAuthor(a?.name ?? null, a?.title ?? null),
    date: formatDate(new Date(r.created_at)),
    views: r.view_count,
  };
}

export async function incrementNoticeView(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: id });
}

export type NoticeEditData = {
  id: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  isPinned: boolean;
};

export async function getNoticePostForEdit(id: string): Promise<NoticeEditData | null> {
  const supabase = await createSupabaseServer();
  const { data: r } = await supabase
    .from("posts")
    .select("id, title, excerpt, body, is_pinned")
    .eq("id", id)
    .eq("section", SECTION)
    .maybeSingle();
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    isPinned: r.is_pinned,
  };
}
```

- [ ] **Step 2: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. (admin 페이지는 여전히 `getCurrentAnnouncement`를 import — 유지했으므로 OK)

- [ ] **Step 3: 커밋**

```bash
git add src/server/services/notice.ts
git commit -m "feat: 공지(notice) 목록·상세·편집 서비스 추가"
```

---

### Task 2: notice 액션 — 작성/수정/삭제 (additive)

기존 `setAnnouncement`/`clearAnnouncement`는 **남겨둔 채**(Task 7에서 제거) CRUD 액션을 추가한다.

**Files:**
- Modify: `src/server/actions/notice.ts`

- [ ] **Step 1: 액션 추가(파일 끝에 append)**

`src/server/actions/notice.ts`의 import 블록에 다음을 추가(이미 있으면 중복 추가 금지):

```ts
import { redirect } from "next/navigation";
```

그리고 파일 맨 끝에 아래를 추가:

```ts
// ── 공지 게시물 CRUD (committee 액션 미러, category·첨부·event_date 없음) ──
const noticeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요.")
    .max(200, "제목은 200자 이내로 입력해주세요."),
  excerpt: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  body: z
    .string()
    .optional()
    .transform((v) => v || null),
  isPinned: z.coerce.boolean(),
});

export interface PostFormState {
  error?: string;
}

function parseNotice(formData: FormData) {
  return noticeSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    isPinned: formData.get("isPinned") === "on" || formData.get("isPinned") === "true",
  });
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireAdmin();
  const r = parseNotice(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      section: "notice",
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "저장에 실패했습니다." };
  revalidatePath("/notice");
  revalidatePath("/main");
  redirect(`/notice/${data.id}`);
}

export async function updatePost(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const r = parseNotice(formData);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("posts")
    .update({
      title: r.data.title,
      excerpt: r.data.excerpt,
      body: r.data.body,
      is_pinned: r.data.isPinned,
    })
    .eq("id", id)
    .eq("section", "notice");
  if (error) return { error: "수정에 실패했습니다." };
  revalidatePath("/notice");
  revalidatePath("/main");
  revalidatePath(`/notice/${id}`);
  redirect(`/notice/${id}`);
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").delete().eq("id", id).eq("section", "notice");
  revalidatePath("/notice");
  revalidatePath("/main");
  redirect("/notice");
}
```

(참고: `z`·`requireAdmin`·`createSupabaseServer`·`revalidatePath`는 기존 파일 상단에서 이미 import되어 있다. `redirect`만 새로 추가.)

- [ ] **Step 2: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. (set/clearAnnouncement와 새 CRUD가 공존)

- [ ] **Step 3: 커밋**

```bash
git add src/server/actions/notice.ts
git commit -m "feat: 공지(notice) 작성·수정·삭제 액션 추가"
```

---

### Task 3: admin 공지 에디터 (EditorForm + new + edit)

committee admin 패턴 미러, category·eventDate·location·첨부 제외.

**Files:**
- Create: `src/app/(admin)/admin/notice/EditorForm.tsx`
- Create: `src/app/(admin)/admin/notice/new/page.tsx`
- Create: `src/app/(admin)/admin/notice/[id]/edit/page.tsx`

- [ ] **Step 1: EditorForm**

`src/app/(admin)/admin/notice/EditorForm.tsx`:

```tsx
"use client";
import { useActionState } from "react";
import type { PostFormState } from "@/server/actions/notice";

type Initial = {
  title?: string;
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

- [ ] **Step 2: new 페이지**

`src/app/(admin)/admin/notice/new/page.tsx`:

```tsx
import { requireAdmin } from "@/server/auth/current-user";
import { createPost } from "@/server/actions/notice";
import EditorForm from "../EditorForm";

export default async function NewNoticePage() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>새 공지 작성</h1>
      <EditorForm action={createPost} submitLabel="저장" />
    </main>
  );
}
```

- [ ] **Step 3: edit 페이지(삭제 폼 포함)**

`src/app/(admin)/admin/notice/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getNoticePostForEdit } from "@/server/services/notice";
import { updatePost, deletePost } from "@/server/actions/notice";
import EditorForm from "../../EditorForm";

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = await getNoticePostForEdit(id);
  if (!post) notFound();

  const update = updatePost.bind(null, id);
  const remove = deletePost.bind(null, id);

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <Link href={`/notice/${id}`} style={{ fontSize: 13, color: "#666" }}>← 글 보기</Link>
      <h1 style={{ fontSize: 22 }}>공지 수정</h1>
      <EditorForm
        action={update}
        initial={{
          title: post.title,
          excerpt: post.excerpt ?? undefined,
          body: post.body ?? undefined,
          isPinned: post.isPinned,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          공지 삭제
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과.

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(admin)/admin/notice"
git commit -m "feat: admin 공지 작성·수정·삭제 에디터 추가"
```

---

### Task 4: 공개 `/notice` 목록 (page + desktop + mobile)

committee와 같은 디자인 언어(PageHero + forest 팔레트 CSS 변수)로 **간결한 목록**을 신설. 카테고리·인기·검색·뷰토글·페이지네이션 없음. 인라인 스타일 + `var(--palette-*)`(committee 상세와 동일 접근). admin이면 "글쓰기" 링크 노출.

**Files:**
- Create: `src/app/notice/page.tsx`
- Create: `src/app/notice/_components/desktop/NoticeDesktop.tsx`
- Create: `src/app/notice/_components/mobile/NoticeMobile.tsx`

- [ ] **Step 1: page.tsx (device split)**

`src/app/notice/page.tsx`:

```tsx
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getNoticeListData } from "@/server/services/notice";
import { getCurrentUser } from "@/server/auth/current-user";
import DesktopNav from "@/app/_components/DesktopNav";
import NoticeDesktop from "./_components/desktop/NoticeDesktop";
import NoticeMobile from "./_components/mobile/NoticeMobile";

/** 공개 공지 목록 — DB 연동(읽기). committee와 같은 디자인 언어, 간결 구성. */
export default async function NoticePage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const { pinned, posts } = await getNoticeListData();
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <NoticeDesktop pinned={pinned} posts={posts} isAdmin={isAdmin} />
      </>
    );
  }
  return <NoticeMobile pinned={pinned} posts={posts} isAdmin={isAdmin} />;
}
```

- [ ] **Step 2: NoticeDesktop**

`src/app/notice/_components/desktop/NoticeDesktop.tsx`:

```tsx
import Link from "next/link";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import type { NoticePost } from "@/server/services/notice";

const C = {
  bg: "var(--palette-bg)",
  surface: "var(--palette-surface)",
  primary: "var(--palette-primary)",
  accent: "var(--palette-accent)",
  ink: "var(--palette-ink)",
  muted: "var(--palette-muted)",
  line: "var(--palette-line)",
};

function Row({ n }: { n: NoticePost }) {
  return (
    <li style={{ borderBottom: `1px solid ${C.line}` }}>
      <Link
        href={`/notice/${n.id}`}
        style={{ display: "block", padding: "18px 8px", textDecoration: "none", color: C.ink }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {n.isPinned && (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.surface, background: C.primary, padding: "2px 8px", borderRadius: 4 }}>
              고정
            </span>
          )}
          <span style={{ fontSize: 17, fontWeight: 600 }}>{n.title}</span>
          {n.isNew && <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>NEW</span>}
        </div>
        {n.excerpt && (
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {n.excerpt}
          </p>
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
          {n.author} · {n.date} · 조회 {n.views}
        </div>
      </Link>
    </li>
  );
}

export default function NoticeDesktop({
  pinned,
  posts,
  isAdmin,
}: {
  pinned: NoticePost | null;
  posts: NoticePost[];
  isAdmin: boolean;
}) {
  const all = pinned ? [pinned, ...posts] : posts;
  return (
    <>
      <PageHeroDesktop kicker="NOTICE" title="공지사항" lead="교육위원회의 안내와 소식을 전합니다." />
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px 96px", background: C.bg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, color: C.ink, margin: 0 }}>전체 공지</h2>
          {isAdmin && (
            <Link
              href="/admin/notice/new"
              style={{ fontSize: 13, color: C.surface, background: C.primary, padding: "8px 16px", borderRadius: 6, textDecoration: "none" }}
            >
              글쓰기
            </Link>
          )}
        </div>
        {all.length === 0 ? (
          <p style={{ color: C.muted, padding: "48px 0", textAlign: "center" }}>등록된 공지가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `2px solid ${C.primary}` }}>
            {all.map((n) => (
              <Row key={n.id} n={n} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 3: NoticeMobile**

`src/app/notice/_components/mobile/NoticeMobile.tsx`:

```tsx
import Link from "next/link";
import { PageHeroMobile } from "@/app/_components/PageHero";
import type { NoticePost } from "@/server/services/notice";

const C = {
  bg: "var(--palette-bg)",
  surface: "var(--palette-surface)",
  primary: "var(--palette-primary)",
  accent: "var(--palette-accent)",
  ink: "var(--palette-ink)",
  muted: "var(--palette-muted)",
  line: "var(--palette-line)",
};

function Card({ n }: { n: NoticePost }) {
  return (
    <li style={{ borderBottom: `1px solid ${C.line}` }}>
      <Link href={`/notice/${n.id}`} style={{ display: "block", padding: "16px 4px", textDecoration: "none", color: C.ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {n.isPinned && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.surface, background: C.primary, padding: "2px 6px", borderRadius: 4 }}>
              고정
            </span>
          )}
          {n.isNew && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>NEW</span>}
        </div>
        <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{n.title}</div>
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
          {n.author} · {n.date} · 조회 {n.views}
        </div>
      </Link>
    </li>
  );
}

export default function NoticeMobile({
  pinned,
  posts,
  isAdmin,
}: {
  pinned: NoticePost | null;
  posts: NoticePost[];
  isAdmin: boolean;
}) {
  const all = pinned ? [pinned, ...posts] : posts;
  return (
    <>
      <PageHeroMobile kicker="NOTICE" title="공지사항" lead="교육위원회의 안내와 소식." />
      <main style={{ padding: "24px 20px 80px", background: C.bg, minHeight: "60vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, color: C.ink, margin: 0 }}>전체 공지</h2>
          {isAdmin && (
            <Link href="/admin/notice/new" style={{ fontSize: 12, color: C.surface, background: C.primary, padding: "6px 12px", borderRadius: 6, textDecoration: "none" }}>
              글쓰기
            </Link>
          )}
        </div>
        {all.length === 0 ? (
          <p style={{ color: C.muted, padding: "40px 0", textAlign: "center" }}>등록된 공지가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `2px solid ${C.primary}` }}>
            {all.map((n) => (
              <Card key={n.id} n={n} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 4: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. `PageHeroDesktop`/`PageHeroMobile`는 `@/app/_components/PageHero` index의 named export. `getDeviceType`·`getCurrentUser`는 기존 모듈.

- [ ] **Step 5: 커밋**

```bash
git add src/app/notice/page.tsx src/app/notice/_components
git commit -m "feat: 공개 공지 목록 페이지(/notice) 추가"
```

---

### Task 5: 공개 `/notice/[id]` 상세

committee 상세 미러, 카테고리·댓글·첨부 제외.

**Files:**
- Create: `src/app/notice/[id]/page.tsx`

- [ ] **Step 1: 상세 페이지**

`src/app/notice/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getNoticePost, incrementNoticeView } from "@/server/services/notice";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function NoticePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getNoticePost(id);
  if (!post) notFound();
  await incrementNoticeView(id);

  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/notice" style={{ fontSize: 13, color: "#666" }}>← 목록으로</Link>
      <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
        {post.author} · {post.date} · 조회 {post.views}
      </p>
      <h1 style={{ fontSize: 26, lineHeight: 1.3 }}>{post.title}</h1>
      {isAdmin && (
        <Link href={`/admin/notice/${id}/edit`} style={{ fontSize: 13, color: "#06c" }}>
          수정
        </Link>
      )}
      <article style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8, marginTop: 16 }}>
        {post.body}
      </article>
    </main>
  );
}
```

- [ ] **Step 2: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add "src/app/notice/[id]"
git commit -m "feat: 공개 공지 상세 페이지(/notice/[id]) 추가"
```

---

### Task 6: `/notice` 진입 경로 (푸터 링크 + 모바일 공지 배너 링크)

디자인 보존 — 링크만 부여, 레이아웃 불변.

**Files:**
- Modify: `src/lib/main-page-data.ts` (FooterColumn 항목 모델 최소 확장)
- Modify: `src/app/main/_components/desktop/DesktopFooter.tsx`
- Modify: `src/app/main/_components/mobile/AnnouncementStrip.tsx`

- [ ] **Step 1: FooterColumn 항목 모델 확장**

`src/lib/main-page-data.ts`의 `FooterColumn` 타입과 `FOOTER_COLUMNS`를 아래로 교체:

```ts
export type FooterItem = { label: string; href?: string };
export type FooterColumn = { title: string; items: ReadonlyArray<FooterItem> };

export const FOOTER_COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    title: "교육 사역",
    items: [{ label: "교사 수련회" }, { label: "성경고사" }, { label: "찬양제" }, { label: "교사 헌신예배" }],
  },
  {
    title: "자료실",
    items: [{ label: "설교 PPT" }, { label: "주일학교 교안" }, { label: "찬양 악보" }, { label: "주보 양식" }],
  },
  {
    title: "소통",
    items: [{ label: "공지사항", href: "/notice" }, { label: "사진첩" }, { label: "문의하기" }, { label: "제안 보내기" }],
  },
];
```

- [ ] **Step 2: DesktopFooter — 항목 렌더를 href 인지로 변경**

`src/app/main/_components/desktop/DesktopFooter.tsx`에 `import Link from "next/link";`를 추가하고(상단 import들 사이), `c.items.map(...)` 블록을 아래로 교체:

```tsx
            {c.items.map((item) => (
              <div key={item.label} className={styles.colItem}>
                {item.href ? (
                  <Link href={item.href} style={{ color: "inherit", textDecoration: "none" }}>
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </div>
            ))}
```

- [ ] **Step 3: AnnouncementStrip — 전체를 /notice 링크로 래핑**

`src/app/main/_components/mobile/AnnouncementStrip.tsx` 전체를 아래로 교체:

```tsx
import Link from "next/link";
import styles from "./AnnouncementStrip.module.css";

export default function AnnouncementStrip({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <Link href="/notice" className={styles.strip} style={{ textDecoration: "none" }}>
      <div className={styles.tag}>NOTICE</div>
      <div className={styles.text}>{text}</div>
      <svg width="14" height="14" viewBox="0 0 14 14" className={styles.arrow}>
        <path d="M3 3l8 4-8 4 2-4-2-4z" fill="#fff" />
      </svg>
    </Link>
  );
}
```

(`.strip` 클래스가 `div` 기준 스타일이라도 `a`에 그대로 적용된다 — 시각 변화 없음. 색상 상속을 위해 `textDecoration:none`만 추가.)

- [ ] **Step 4: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. `FOOTER_COLUMNS`의 유일 소비처는 `DesktopFooter`(Step 2에서 함께 갱신). `FooterMobile`은 `FOOTER_COLUMNS`를 쓰지 않으므로 영향 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/main-page-data.ts src/app/main/_components/desktop/DesktopFooter.tsx src/app/main/_components/mobile/AnnouncementStrip.tsx
git commit -m "feat: 공지 진입 경로(푸터·모바일 배너 → /notice) 연결"
```

---

### Task 7: 싱글톤 "메인 공지 한 줄" 제거

공지 CRUD로 대체되었으므로 싱글톤 경로를 제거한다. 한 커밋에서 모두 제거해 빌드가 깨지지 않게 한다.

**Files:**
- Modify: `src/server/services/notice.ts` (getCurrentAnnouncement 제거)
- Modify: `src/server/actions/notice.ts` (setAnnouncement/clearAnnouncement/AnnouncementState/textSchema 제거)
- Modify: `src/app/(admin)/admin/page.tsx` (메인 공지 섹션 제거 + 공지 관리 링크 추가)
- Delete: `src/app/(admin)/admin/AnnouncementForm.tsx`

- [ ] **Step 1: 서비스에서 getCurrentAnnouncement 제거**

`src/server/services/notice.ts`에서 `getCurrentAnnouncement` 함수(그리고 그 위의 "/admin 메인 공지(싱글톤)…" 주석)를 삭제한다. 나머지(one, SECTION, NEW_WINDOW_MS, NoticePost 등)는 유지.

- [ ] **Step 2: 액션에서 싱글톤 제거**

`src/server/actions/notice.ts`에서 다음을 삭제: `AnnouncementState` 인터페이스, `textSchema` 상수, `setAnnouncement` 함수, `clearAnnouncement` 함수. CRUD(`noticeSchema`/`PostFormState`/`parseNotice`/`createPost`/`updatePost`/`deletePost`)와 import는 유지. 파일 상단 주석(메인 공지 싱글톤 설명)이 있으면 공지 CRUD 설명으로 정리.

- [ ] **Step 3: AnnouncementForm 삭제**

```bash
git rm "src/app/(admin)/admin/AnnouncementForm.tsx"
```

- [ ] **Step 4: admin 페이지에서 메인 공지 섹션 제거 + 공지 관리 링크**

`src/app/(admin)/admin/page.tsx`에서:
- import 제거: `import { getCurrentAnnouncement } from "@/server/services/notice";` 와 `import AnnouncementForm from "./AnnouncementForm";`
- `const announcement = await getCurrentAnnouncement();` 줄 제거
- "메인 공지" `<section>` 블록(`<h2>메인 공지</h2>` … `<AnnouncementForm current={announcement} />` … `</section>`) 전체 제거
- 기존 `문의 접수함 →` 링크 문단을 아래로 교체(공지 관리 링크 추가):

```tsx
      <p style={{ marginTop: 16, display: "flex", gap: 16 }}>
        <Link href="/admin/inquiries">문의 접수함 →</Link>
        <Link href="/notice">공지 관리 →</Link>
      </p>
```

- [ ] **Step 5: 검증**

Run: `pnpm lint && pnpm build`
Expected: 통과. `getCurrentAnnouncement`/`setAnnouncement`/`clearAnnouncement`/`AnnouncementForm` 참조가 더는 없어야 한다(grep로 확인):

Run: `grep -rn "getCurrentAnnouncement\|setAnnouncement\|clearAnnouncement\|AnnouncementForm" src`
Expected: 결과 없음.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "refactor: 싱글톤 메인 공지 한 줄을 공지 CRUD로 대체(레거시 제거)"
```

---

### Task 8: 로컬 e2e 검증 및 문서 커밋

**Files:** 없음(검증·문서)

- [ ] **Step 1: 로컬 스택·dev 서버**

`npx supabase status`(미기동 시 `colima start && npx supabase start`), Preview MCP `preview_start`.

- [ ] **Step 2: admin CRUD + 공개 열람 e2e**

admin 로그인 → `/notice`에서 "글쓰기" → 공지 2건 작성(1건 상단고정) → `/notice` 목록에 **고정 우선** 정렬·노출 확인 → 상세 진입 시 본문 표시·조회수 증가 확인 → `/main`(모바일 뷰)의 공지 배너가 최신 제목 표시 + 클릭 시 `/notice` 이동 확인 → 데스크톱 `/main` 푸터 "공지사항" → `/notice` 이동 확인 → 공지 수정/삭제 동작 확인.

- [ ] **Step 3: 비로그인 공개 확인**

로그아웃 상태로 `/notice`·`/notice/[id]` 열람 가능(가드 없음), "글쓰기"·"수정" 미노출 확인.

- [ ] **Step 4: 정리**

검증용 공지 삭제로 로컬 DB 원복.

- [ ] **Step 5: 최종 검증 + 문서 커밋**

Run: `pnpm lint && pnpm build`
Expected: 통과.

```bash
git add docs/superpowers/specs/2026-06-16-public-notice-page-design.md docs/superpowers/plans/2026-06-16-public-notice-page.md
git commit -m "docs: 공개 공지 페이지 설계·실행 plan 추가"
```

---

## Self-Review

- **Spec 커버리지**: 서비스(Task 1)·액션(Task 2)·admin 에디터(Task 3) ↔ spec §4 서비스/액션/admin·Q1. 공개 목록(Task 4)·상세(Task 5) ↔ §4 공개 페이지·Q2(간결 신설)·Q3(첨부 없음). 진입 경로(Task 6) ↔ §4 진입 경로·Q4. 싱글톤 제거(Task 7) ↔ §1 "싱글톤 대체". e2e(Task 8) ↔ §6. `/main` 배너는 getHomeData 그대로 → 무변경(명시). 누락 없음.
- **Placeholder 스캔**: 모든 코드 step에 실제 코드 포함. TBD/TODO 없음.
- **타입 일관성**: `PostFormState`(Task 2 정의) ↔ EditorForm(Task 3)·new/edit가 동일 타입 사용. `NoticePost`(Task 1) ↔ Task 4 컴포넌트 props. `NoticeEditData.{title,excerpt,body,isPinned}`(Task 1) ↔ Task 3 edit 페이지 initial 매핑. `getNoticePostForEdit`/`getNoticePost`/`incrementNoticeView`/`getNoticeListData` 이름이 Task 1 정의와 이후 사용처에서 일치. `createPost`/`updatePost`/`deletePost` 시그니처(Task 2) ↔ Task 3 호출(`updatePost.bind(null,id)`·`deletePost.bind(null,id)`) 일치.
- **빌드 안전**: Task 1·2는 additive(싱글톤 공존), Task 7에서 일괄 제거 → 매 커밋 빌드 green. Task 6의 `FOOTER_COLUMNS` 모델 변경은 유일 소비처 `DesktopFooter`를 같은 태스크에서 갱신.
- **스키마/RLS**: posts 기존 정책이 notice 섹션 커버 → 신규 마이그레이션·RLS 없음.
