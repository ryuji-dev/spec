# admin 공개/비공개 토글 설계 (B단계)

> 작성일: 2026-06-25 · 브랜치: `feat/admin-publish-toggle`
> 선행: admin 글 관리 목록(A단계, PR #58 머지). 후속 C단계(대시보드 개편)는 범위 밖.

## 배경 / 문제

5개 `posts` 도메인(notice·training·committee·webzine·resources)은 작성 시 `is_published`를
설정하지 않아 DB 기본값 `true`로 **항상 공개** 생성되고, 편집 폼에 공개 전환 수단이 없다.
A단계에서 만든 admin 목록의 `공개` 컬럼은 현재 **읽기 전용 표시(✓)** 일 뿐 토글이 안 된다.

따라서 관리자가 글을 **비공개(초안)로 내리거나 준비 후 공개**할 방법이 없다. 본 작업은 값 쓰기 경로만
추가해 이 공백을 메운다.

## 결정 (brainstorming 확정)

- **새 글 기본값**: 공개 유지(체크박스 기본 체크). 기존 운영 흐름과 동일, 필요 시에만 비공개.
- **토글 위치**: 편집 폼 체크박스 + 목록 빠른 토글(둘 다).
- **범위**: 목록을 갖춘 5개 도메인 전체.

## 비목표 (범위 밖)

- 예약 발행·만료 등 일정 기반 공개
- 공개 컬럼 외 목록/대시보드 UI 개편(C단계)
- **스키마·마이그레이션·RLS 변경 없음** — `posts.is_published`와 공개 서비스 필터·RLS는 이미 존재

## 아키텍처

기존 구조를 그대로 활용한다. 공개 서비스는 모두 `is_published=true`만 노출하고
(`getNoticeList` 등 `.eq("is_published", true)`), posts select RLS는
`is_published or author_id = auth.uid() or auth_is_admin()`로 admin/작성자에 전체 행을 허용한다.
즉 값을 **쓰는 경로 3개**(작성·수정·토글)만 추가하면 공개/비공개가 동작한다.

### 1. 작성/수정 액션 — `is_published` 반영 (5개 액션 파일)

`actions/{notice,training,committee,webzine}.ts`와 `actions/resource.ts`:

- zod 스키마에 `isPublished: z.coerce.boolean()` 추가.
- 파서에 `isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true"` 추가
  (notice의 `isPinned` 파싱과 동일 방식).
- `createPost`/`createResource`의 `insert`에 `is_published: r.data.isPublished` 추가.
- `updatePost`/`updateResource`의 `update`에 `is_published: r.data.isPublished` 추가.

작성 폼은 기본 체크(공개)이므로 신규 글은 종전대로 공개로 생성된다.

### 2. 편집 폼 — `공개` 체크박스 (5개 폼)

각 도메인 자체 `EditorForm.tsx`(notice·training·committee·webzine)와 `ResourceEditorForm.tsx`:

- `Initial` 타입에 `isPublished?: boolean` 추가.
- 폼에 체크박스 추가(`isPinned` 라벨과 같은 스타일):

```tsx
<label style={{ fontSize: 14 }}>
  <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
</label>
```

`defaultChecked`는 `?? true` — 신규(initial 없음)·기존 모두 합리적 기본.

### 3. ForEdit 서비스 + 편집 페이지 — initial 전달 (5개 서비스 + 5개 페이지)

- 각 `get…ForEdit`의 select에 `is_published` 추가, EditData 타입에 `isPublished: boolean` 추가, 반환에 매핑.
- 각 `[id]/edit/page.tsx`의 `initial`에 `isPublished: post.isPublished` 추가.

### 4. 목록 빠른 토글 — 공용 컴포넌트 + 도메인별 토글 액션

공용 클라이언트 `src/app/(admin)/admin/_components/PublishToggle.tsx`
(`DeletePostButton`과 동일 패턴 — 바인딩된 서버 액션을 `<form>`으로 호출):

```tsx
"use client";
export default function PublishToggle({
  action,
  isPublished,
}: {
  action: () => Promise<void>;
  isPublished: boolean;
}) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <button
        type="submit"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit", color: isPublished ? "#080" : "#888" }}
        title={isPublished ? "클릭하면 비공개로 전환" : "클릭하면 공개로 전환"}
      >
        {isPublished ? "공개 ✓" : "비공개"}
      </button>
    </form>
  );
}
```

각 액션 파일에 토글 액션 추가 — `deletePost`처럼 `section` 스코프 + 도메인별 `revalidatePath`:

```ts
export async function togglePublished(id: string, next: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("posts").update({ is_published: next }).eq("id", id).eq("section", "notice");
  revalidatePath("/notice");
  revalidatePath("/main");
  revalidatePath("/admin/notice");
}
```

(도메인별 `section` 값과 revalidate 경로만 다르다. resources는 `section="resource"`, revalidate `/resources`·`/admin/resources`. training은 `/training`·`/main`·`/admin/training`. committee는 `/committee`·`/main`·`/admin/committee`. webzine은 `/webzine`·`/admin/webzine`. notice는 위 예시.)

목록 `page.tsx`의 기존 정적 `✓` 셀을 토글로 교체:

```tsx
<td style={{ padding: "8px 6px" }}>
  <PublishToggle action={togglePublished.bind(null, r.id, !r.isPublished)} isPublished={r.isPublished} />
</td>
```

> 주의: 토글 액션은 `redirect`하지 않는다(목록에 머무름). revalidatePath로 목록·공개 경로를 갱신한다.

## 영향받는 파일

신규:
- `src/app/(admin)/admin/_components/PublishToggle.tsx`

수정(각 5개):
- `src/server/actions/{notice,training,committee,webzine,resource}.ts` — 스키마+파서, create/update의 is_published, `togglePublished` 신설
- `src/server/services/{notice,training,committee,webzine,resource}.ts` — `get…ForEdit`에 isPublished
- `src/app/(admin)/admin/{notice,training,committee,webzine}/EditorForm.tsx` + `resources/ResourceEditorForm.tsx` — 공개 체크박스
- `src/app/(admin)/admin/{notice,training,committee,webzine,resources}/[id]/edit/page.tsx` — initial.isPublished
- `src/app/(admin)/admin/{notice,training,committee,webzine,resources}/page.tsx` — 토글 셀

## 검증 (로컬 e2e)

로컬 Supabase + admin 로그인. 도메인별로:
1. 새 글 작성(공개 체크 기본) → 목록에 `공개 ✓` 표시, 공개 사이트에 노출
2. 목록에서 토글 클릭 → `비공개`로 바뀜 → 공개 목록/상세에서 사라짐(비로그인/공개 경로 확인)
3. 다시 토글 → `공개 ✓` → 공개 사이트 노출 복귀
4. 편집 폼에서 공개 체크 해제 저장 → 비공개 반영, 다시 체크 저장 → 공개 반영
5. 비공개 글이 admin 목록에는 계속 보이는지 확인(RLS admin 전체 허용)

전체: `npx tsc --noEmit`(0) · `pnpm lint`(0) · `pnpm build`(0).

## 리스크 / 메모

- resources는 액션명이 `createResource`/`updateResource`/`deleteResource`로 다름 — 토글도 같은 파일에 `togglePublished` 추가.
- 공개 상세 페이지(`/notice/[id]` 등)는 비공개 시 RLS·서비스 필터로 404가 되는지 확인(이미 `.eq("is_published", true)`로 필터하므로 비로그인은 못 봄). admin은 미리보기로 볼 수 있어야 자연스럽지만, 현재 상세 서비스가 `is_published=true`로 막으면 admin도 상세를 못 본다 — 이는 기존 동작이며 본 작업 범위 밖(필요 시 후속). 목록·편집으로 관리는 가능.
- 토글 버튼은 confirm 없이 즉시 전환(삭제와 달리 되돌리기 쉬움).
