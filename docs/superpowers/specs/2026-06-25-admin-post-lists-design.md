# admin 글 관리 색인 + 삭제 연결 설계

> 작성일: 2026-06-25 · 브랜치: `feat/admin-post-lists`
> 관련: admin UX 개선 A단계. B/C단계(공개토글·대시보드 개편)는 범위 밖.

## 배경 / 문제

`posts` 테이블을 `section` 컬럼으로 구분하는 5개 콘텐츠 도메인(notice·training·committee·webzine·resources)에는
편집 폼(`new`/`[id]/edit`)만 있고 **admin 목록 페이지가 없다.** 이로 인한 실제 공백:

1. **관리 색인 부재** — 기존 글을 고치려면 공개 사이트(`/notice` 등)를 돌아다니며 상세페이지의 관리자 "수정" 링크로만 진입 가능. 한눈에 보는 화면이 없다.
2. **삭제 UI 부재** — `deletePost`(resources는 `deleteResource`) 액션은 존재하나 **어떤 UI에도 연결되지 않아** 관리자가 글을 지울 수 없다.

> 참고: 작성 액션은 `is_published`를 설정하지 않아 DB 기본값 `true`로 항상 공개 생성된다. 즉 현재 "미공개 초안"은 존재하지 않는다. 목록은 미공개도 포함해 표시하도록(future-proof) 만들되, **공개/비공개 토글·초안 워크플로는 이번 범위에서 추가하지 않는다.**

이미 같은 패턴의 admin 목록이 존재한다: events(`listEventsForAdmin` + `/admin/events/page.tsx`), hero, collections. 본 작업은 그 패턴을 5개 도메인으로 확장한다.

## 목표

- 5개 도메인 각각에 admin 목록 페이지 신설 (모든 글 표시, 수정/삭제 진입)
- 기존 삭제 액션을 확인(confirm) 절차와 함께 UI에 연결
- admin 대시보드에서 5개 목록으로 진입하는 링크 정비

## 비목표 (범위 밖)

- 공개/비공개 토글, 초안 워크플로 (B안)
- 대시보드 시각 개편 (B/C단계)
- 편집 폼·zod 스키마·Supabase 스키마·RLS 변경
- events/hero/collections 등 기존 목록 페이지 리팩터링

## 아키텍처

기존 패턴(헌법: 읽기는 Server Component→service, 쓰기는 Server Action) 유지. 신규 마이그레이션·신규 액션 없음.

### 1. 서비스 계층 (읽기) — 도메인별 `list…ForAdmin()` 5개 신설

각 서비스 파일에 함수 추가. 해당 `section`의 **모든 글**(미공개 포함)을 `created_at` 내림차순으로 반환.
공통 반환 타입은 `{ id, title, createdAt, isPublished }`이며, 도메인이 쓰는 필드만 덧붙인다.

| 도메인 | 서비스 파일 | 신규 함수 | 추가 필드 |
|---|---|---|---|
| notice | `services/notice.ts` | `listNoticesForAdmin()` | `isPinned` |
| training | `services/training.ts` | `listTrainingPostsForAdmin()` | `category` |
| committee | `services/committee.ts` | `listCommitteePostsForAdmin()` | `category` |
| webzine | `services/webzine.ts` | `listWebzineArticlesForAdmin()` | `category` |
| resources | `services/resource.ts` | `listResourcePostsForAdmin()` | `category` |

반환 행 타입 예시(committee):

```ts
export type CommitteeAdminRow = {
  id: string;
  title: string;
  category: string | null;
  createdAt: string; // ISO
  isPublished: boolean;
};

export async function listCommitteePostsForAdmin(): Promise<CommitteeAdminRow[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category, created_at, is_published")
    .eq("section", SECTION)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    createdAt: r.created_at,
    isPublished: r.is_published,
  }));
}
```

notice는 `category` 대신 `is_pinned`를 select/매핑한다. RLS는 admin에 전체 행을 허용하므로(`auth_is_admin()`) 미공개 글도 조회된다.

### 2. 삭제 UI — 공용 클라이언트 컴포넌트 1개

`src/app/(admin)/admin/_components/DeletePostButton.tsx` 신설(5개 도메인 공유).

```tsx
"use client";
export default function DeletePostButton({
  action,
  confirmText = "삭제하시겠습니까? 되돌릴 수 없습니다.",
}: {
  action: () => Promise<void>; // deletePost.bind(null, id) 등 바인딩된 서버 액션
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <button type="submit" style={{ color: "#c00", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        삭제
      </button>
    </form>
  );
}
```

- 기존 액션 재사용: notice·training·committee·webzine = `deletePost(id)`, resources = `deleteResource(id)`. 신규 액션 없음.
- 바인딩: 목록 페이지(Server Component)에서 `action={deletePost.bind(null, r.id)}`로 전달.
- 기존 삭제 액션은 모두 내부에서 `redirect(...)`로 공개 목록(예: `/notice`)으로 이동한다. 이는 의도된 동작이며 본 작업에서 변경하지 않는다(목록→삭제→공개 목록 이동).

### 3. 목록 페이지 5개 — `/admin/<domain>/page.tsx`

`events/page.tsx`를 그대로 미러. 인라인 스타일 테이블, 상단 "새 글" 링크, 행마다 제목·(분류 또는 고정)·작성일·공개(✓)·수정/삭제. `requireAdmin()` 재확인.

```tsx
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listCommitteePostsForAdmin } from "@/server/services/committee";
import { deletePost } from "@/server/actions/committee";
import { isoToKstDate } from "@/lib/datetime";
import DeletePostButton from "../_components/DeletePostButton";

export default async function AdminCommitteePage() {
  await requireAdmin();
  const rows = await listCommitteePostsForAdmin();
  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>위원회 소식 관리</h1>
        <Link href="/admin/committee/new" style={{ fontSize: 14, padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>새 글</Link>
      </div>
      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "8px 6px" }}>제목</th>
            <th style={{ padding: "8px 6px" }}>분류</th>
            <th style={{ padding: "8px 6px" }}>작성일</th>
            <th style={{ padding: "8px 6px" }}>공개</th>
            <th style={{ padding: "8px 6px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.title}</td>
              <td style={{ padding: "8px 6px" }}>{r.category ?? "-"}</td>
              <td style={{ padding: "8px 6px" }}>{isoToKstDate(r.createdAt)}</td>
              <td style={{ padding: "8px 6px" }}>{r.isPublished ? "✓" : ""}</td>
              <td style={{ padding: "8px 6px", display: "flex", gap: 12 }}>
                <Link href={`/admin/committee/${r.id}/edit`} style={{ color: "#06c" }}>수정</Link>
                <DeletePostButton action={deletePost.bind(null, r.id)} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} style={{ padding: "16px 6px", color: "#888" }}>등록된 글이 없습니다.</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

도메인별 차이:
- **notice**: 분류 컬럼 대신 "고정"(`r.isPinned ? "📌" : ""`). h1 "공지 관리", new=`/admin/notice/new`, edit=`/admin/notice/[id]/edit`, 삭제=`deletePost`(notice).
- **training**: h1 "강습회 글 관리", 분류 컬럼. (events 목록과 별개 — training은 `/training` 섹션 글)
- **webzine**: h1 "웹진 관리", 분류 컬럼.
- **resources**: h1 "자료실 관리", 분류 컬럼. edit=`/admin/resources/[id]/edit`, 삭제=`deleteResource`(이름 다름 주의).

### 4. 대시보드 링크 정비 — `/admin/page.tsx`

기존 링크 묶음에 누락 5개를 추가하고, 공개 페이지로 가던 `공지 관리 → /notice`를 `/admin/notice`로 교정.

```tsx
<Link href="/admin/notice">공지 관리 →</Link>
<Link href="/admin/training">강습회 글 관리 →</Link>
<Link href="/admin/committee">위원회 소식 관리 →</Link>
<Link href="/admin/webzine">웹진 관리 →</Link>
<Link href="/admin/resources">자료실 관리 →</Link>
```

(기존 events·timetable·collections·hero·inquiries 링크는 유지.)

## 영향받는 파일

신규:
- `src/app/(admin)/admin/_components/DeletePostButton.tsx`
- `src/app/(admin)/admin/{notice,training,committee,webzine,resources}/page.tsx` (5)

수정:
- `src/server/services/{notice,training,committee,webzine,resource}.ts` — `list…ForAdmin` + 행 타입 (5)
- `src/app/(admin)/admin/page.tsx` — 링크 정비

## 검증 (로컬 e2e)

로컬 Supabase + admin 로그인 상태에서 5개 도메인 각각:
1. `/admin/<domain>` 목록 렌더 (기존 시드 글 표시, 작성일·공개 컬럼 정상)
2. "새 글" → 작성 → 목록에 새 항목 반영
3. "수정" 링크 진입 정상
4. "삭제" → confirm → 행 사라짐 + 공개 사이트에서도 제거 확인
5. 빈 섹션은 빈 상태 문구 표시

전체: `pnpm tsc`(0) · `pnpm lint`(0) · `pnpm build`(0).

## 리스크 / 메모

- resources 삭제 액션명이 `deleteResource`로 다름 — 바인딩 시 혼동 주의.
- 기존 삭제 액션이 공개 목록으로 redirect → admin 목록이 아닌 공개 페이지로 이동하는 UX. 이번엔 의도된 기존 동작 유지(범위 최소화). 추후 admin 목록으로 돌리는 개선은 별건.
- 5개 목록 테이블이 거의 동일 — 공용 컴포넌트 추출도 가능하나, 컬럼 차이(분류/고정)와 기존 bespoke 패턴(events/hero/collections) 일관성을 위해 이번엔 도메인별 페이지로 둔다(DeletePostButton만 공용).
