# 교육위원회 게시판 — 댓글 구현 Plan (Plan 3/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 로그인 회원(admin·member)이 교육위원회 글에 댓글을 작성하고, 작성자 본인 또는 admin이 댓글을 삭제할 수 있다. 비로그인은 읽기만. 이 Plan이 끝나면 교육위원회 게시판 슬라이스(읽기·쓰기·업로드·댓글)가 완성된다.

**Architecture:** 댓글 작성/삭제는 Server Action(`server/actions/comments.ts`, requireAdmin 아닌 `getCurrentUser` 게이트). 상세 페이지(서버 컴포넌트)는 로그인 사용자에게만 작성 폼(`CommentForm` client)을 노출하고, 각 댓글에는 본인/admin일 때만 삭제 폼을 렌더한다. 댓글 목록 읽기는 Plan 1에서 이미 구현됨 — 여기에 `authorId`만 추가해 삭제 권한 판정에 쓴다.

**Tech Stack:** Next.js 16, Drizzle, zod, TypeScript strict, pnpm.

**검증:** `pnpm lint`/`pnpm build` + Preview 브라우저 e2e(회원 댓글 작성, 본인 삭제, admin이 타인 댓글 삭제, 비로그인 작성 차단).

---

## File Structure

- `web/src/server/services/committee.ts` — `getCommitteePost`의 댓글 뷰모델에 `authorId` 추가 (수정)
- `web/src/server/actions/comments.ts` — `addComment`·`deleteComment` (신규)
- `web/src/app/committee/_components/CommentForm.tsx` — 댓글 작성 폼(client) (신규)
- `web/src/app/committee/[id]/page.tsx` — 작성 폼 + 댓글별 삭제 폼 배선 (수정)

---

## Task 1: 댓글 Server Action + 뷰모델 authorId 추가

**Files:** Modify `web/src/server/services/committee.ts`; Create `web/src/server/actions/comments.ts`.

- [ ] **Step 1: getCommitteePost 댓글에 authorId 추가**

`web/src/server/services/committee.ts`의 `getCommitteePost` 안:
1. `CommitteeDetail` 타입의 `comments` 항목에 `authorId: string | null` 추가:
```ts
  comments: { id: string; authorId: string | null; author: string; date: string; body: string }[];
```
2. 댓글 select에 `authorId: comments.authorId` 추가 (기존 `cms` select 객체에 한 줄):
```ts
    .select({
      id: comments.id,
      authorId: comments.authorId,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorTitle: users.title,
    })
```
3. 반환 매핑에 `authorId` 포함:
```ts
    comments: cms.map((c) => {
      const cn = c.authorName ?? "익명";
      return {
        id: c.id,
        authorId: c.authorId,
        author: c.authorTitle ? `${cn} ${c.authorTitle}` : cn,
        date: formatDate(c.createdAt),
        body: c.body,
      };
    }),
```

- [ ] **Step 2: 댓글 액션 작성**

`web/src/server/actions/comments.ts` 신규:

```ts
"use server";
// 댓글 작성/삭제. 작성은 로그인 회원(admin·member), 삭제는 작성자 본인 또는 admin.
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { comments } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth/current-user";

const bodySchema = z
  .string()
  .trim()
  .min(1, "댓글 내용을 입력해주세요.")
  .max(2000, "댓글이 너무 깁니다.");

export interface CommentState {
  error?: string;
}

export async function addComment(
  postId: string,
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const parsed = bodySchema.safeParse(formData.get("body"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }
  await getDb()
    .insert(comments)
    .values({ postId, authorId: user.id, body: parsed.data });
  redirect(`/committee/${postId}`);
}

export async function deleteComment(commentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [c] = await getDb()
    .select({ postId: comments.postId, authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!c) redirect("/committee");
  // 권한: 작성자 본인 또는 admin만. 그 외에는 삭제하지 않고 글로 복귀.
  if (user.role !== "admin" && c.authorId !== user.id) {
    redirect(`/committee/${c.postId}`);
  }
  await getDb().delete(comments).where(eq(comments.id, commentId));
  redirect(`/committee/${c.postId}`);
}
```

- [ ] **Step 3: 빌드** — Run: `cd web && pnpm build`. 성공.

- [ ] **Step 4: 커밋**
```bash
git add web/src/server/services/committee.ts web/src/server/actions/comments.ts
git commit -m "feat: 댓글 작성/삭제 Server Action + 댓글 authorId 노출"
```
(트레일러: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 2: CommentForm + 상세 페이지 배선

**Files:** Create `web/src/app/committee/_components/CommentForm.tsx`; Modify `web/src/app/committee/[id]/page.tsx`.

- [ ] **Step 1: 댓글 작성 폼(client)**

`web/src/app/committee/_components/CommentForm.tsx` 신규:

```tsx
"use client";
import { useActionState } from "react";
import { addComment, type CommentState } from "@/server/actions/comments";

const initial: CommentState = {};

export default function CommentForm({ postId }: { postId: string }) {
  const action = addComment.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} style={{ marginTop: 16, display: "grid", gap: 8 }}>
      <textarea
        name="body"
        required
        rows={3}
        placeholder="댓글을 입력하세요"
        style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" }}
      />
      {state.error && (
        <p role="alert" style={{ color: "#c00", margin: 0 }}>
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{ padding: "8px 14px", borderRadius: 6, justifySelf: "start" }}
      >
        {pending ? "등록 중…" : "댓글 등록"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 상세 페이지에 작성 폼·삭제 폼 배선**

`web/src/app/committee/[id]/page.tsx` 수정:
1. import 추가:
```tsx
import { deleteComment } from "@/server/actions/comments";
import CommentForm from "../_components/CommentForm";
```
2. 댓글 섹션을 아래로 교체(기존 `<section>`의 댓글 map + 자리표시 주석 부분):
```tsx
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15 }}>댓글 ({post.comments.length})</h2>
        {post.comments.map((c) => {
          const canDelete = isAdmin || (user != null && c.authorId === user.id);
          return (
            <div key={c.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                {c.author} · {c.date}
              </p>
              <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{c.body}</p>
              {canDelete && (
                <form action={deleteComment.bind(null, c.id)} style={{ marginTop: 4 }}>
                  <button type="submit" style={{ fontSize: 12, color: "#c00" }}>
                    삭제
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {user ? (
          <CommentForm postId={id} />
        ) : (
          <p style={{ fontSize: 13, color: "#888", marginTop: 16 }}>
            댓글을 작성하려면 <Link href="/login" style={{ color: "#06c" }}>로그인</Link>이 필요합니다.
          </p>
        )}
      </section>
```
(`user`·`isAdmin`은 이미 페이지 상단에서 `getCurrentUser()`로 계산됨. `Link`는 이미 import됨.)

- [ ] **Step 3: 빌드·린트** — Run: `cd web && pnpm lint && pnpm build`. 둘 다 성공.

- [ ] **Step 4: 커밋**
```bash
git add web/src/app/committee
git commit -m "feat: 댓글 작성 폼 + 본인·admin 삭제 배선"
```

---

## Task 3: 통합 검증 (Preview 브라우저 e2e)

**Files:** (코드 변경 없음)

- [ ] **Step 1: 회귀** — Run: `cd web && pnpm lint && pnpm build && pnpm db:verify && pnpm committee:verify && pnpm uploads:verify`. 전부 통과.

- [ ] **Step 2: 로컬 DB + Preview 기동** — `rm -rf web/.pglite && pnpm dev:db`(백그라운드), Preview `web-dev` 기동.

- [ ] **Step 3: 비로그인 — 작성 불가** — 비로그인으로 `/committee` → seed 글 상세 진입. 댓글 영역에 작성 폼 대신 "로그인이 필요합니다" 안내 표시. 삭제 버튼 없음.

- [ ] **Step 4: admin 댓글 작성·삭제** — `admin@seogyeong.kr`/`admin1234` 로그인 → 글 상세에서 댓글 작성 → 목록에 즉시 표시(작성자 "관리자 교육위원회"). 본인 댓글 삭제 버튼으로 삭제 → 사라짐.
  - (회원 계정이 있으면 member로 로그인해 댓글 작성 후, admin으로 그 댓글 삭제 가능 확인. 회원 계정이 없으면 admin 페이지에서 createUser로 하나 만들어 검증.)

- [ ] **Step 5: 권한 — 빈 댓글/타인 댓글** — 빈 댓글 제출 시 "댓글 내용을 입력해주세요." 표시. (선택) 비로그인 상태에서 addComment 서버액션 직접 호출 시 무변경/오류(서버 게이트).

- [ ] **Step 6: 정리** — dev:db·Preview 종료, 포트 5432/3000 비우기.

---

## Self-Review 메모

- **스펙 커버리지:** 로그인 회원 댓글 작성·작성자/admin 삭제·비로그인 읽기전용 = 태스크 매핑. 댓글 읽기 표시는 Plan 1에 이미 존재.
- **타입 일관성:** `CommentState`, `addComment(postId,prev,formData)`(bind), `deleteComment(commentId)`(bind), `CommitteeDetail.comments`에 `authorId` 추가 ↔ 페이지의 `canDelete` 판정 일치.
- **보안:** 작성·삭제 모두 서버에서 `getCurrentUser` 재확인. 삭제 권한(본인/admin)은 서버에서 판정(클라이언트 버튼 노출은 편의일 뿐). zod로 길이 검증. dangerouslySetInnerHTML 미사용(pre-wrap 텍스트).
- **플레이스홀더:** 없음.
