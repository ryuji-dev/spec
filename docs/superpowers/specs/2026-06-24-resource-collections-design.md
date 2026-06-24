# 자료실 컬렉션 실데이터화 — 설계

**작성일**: 2026-06-24
**대상**: 자료실(`/resources`)의 "큐레이션 묶음(FEATURED COLLECTIONS)" 섹션
**목표**: 현재 mock 상수(`LB_COLLECTIONS`)로 렌더되는 컬렉션을 Supabase 실데이터 + admin CRUD로 전환한다.

---

## 배경

자료실 본문 자료(`LB_FILES`)는 이미 `posts`(section=`resource`) 테이블로 실데이터화 + admin CRUD가 완료된 상태다. 화면에 남은 마지막 mock은 **컬렉션 섹션**(`LB_COLLECTIONS`, 데스크톱 `CollectionsSection.tsx` + 모바일 `ResourcesMobile.tsx`)뿐이다.

컬렉션은 단일 카테고리가 아니라 **여러 자료를 주제로 묶은 큐레이션 번들**이다(예: "부활절 연합 예배 패키지" = 설교PPT + 악보 + 영상). 따라서 카테고리 자동 파생이 아니라 **관리자 수동 큐레이션 + 자료 연결**로 모델링한다.

### 결정 사항 (브레인스토밍)

- **전환 방식**: 조인 테이블(컬렉션 + 자료 연결). `items`(자료 수)·`downloads`(합산 다운로드)를 연결된 실제 자료에서 **파생**한다(저장 X).
- **배지(NEW/HOT)**: 관리자 수동 선택(없음/NEW/HOT).
- **커버 아트**: 고정 SVG 3종(`spring`·`easter`·`teacher`) 중 드롭다운 선택 — 기존 디자인 자산 재사용.
- **공개 노출**: `is_published` 토글(기존 도메인과 동일).

---

## 1. 데이터 모델

### `resource_collections` (컬렉션 메타)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | uuid PK | `gen_random_uuid()` |
| `title` | text not null | 묶음 제목 |
| `sub` | text not null | 설명 |
| `cover` | text not null | CHECK in (`'spring'`,`'easter'`,`'teacher'`) |
| `badge` | text null | CHECK in (`'NEW'`,`'HOT'`) 또는 null |
| `tag` | text not null | 표시 태그(교안·예배·교사 등 자유 문자열) |
| `is_published` | boolean not null default true | 공개 토글 |
| `sort_order` | int not null default 0 | 정렬 |
| `created_at` | timestamptz not null default now() | |

### `resource_collection_items` (컬렉션 ↔ 자료 조인)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `collection_id` | uuid not null FK → `resource_collections(id)` on delete cascade | |
| `post_id` | uuid not null FK → `posts(id)` on delete cascade | 연결 자료 |
| `sort_order` | int not null default 0 | 묶음 내 순서 |
| PK | (`collection_id`, `post_id`) | 중복 방지 |

인덱스: `resource_collections (sort_order)`, `resource_collection_items (collection_id)`.

### 파생 수치

- `items` = 해당 컬렉션에 연결된 자료 개수
- `downloads` = 연결된 자료들의 `posts.view_count` 합

둘 다 저장하지 않고 조회 시 JS에서 집계한다.

---

## 2. RLS

두 테이블 모두 `enable row level security`. 헬퍼 `public.auth_is_admin()` 재사용.

- `resource_collections`
  - select: `using (is_published or public.auth_is_admin())` — 비공개는 admin만.
  - write: `for all using (public.auth_is_admin()) with check (public.auth_is_admin())`.
- `resource_collection_items`
  - select: `using (true)` — 부모 컬렉션 공개 여부로 노출이 통제되므로 단순화.
  - write: `for all using (public.auth_is_admin()) with check (public.auth_is_admin())`.

> 로컬 `npx supabase db reset` 후 public 스키마 grant 복구가 필요한 것은 기존과 동일(로컬 한정, 커밋하지 않음).

---

## 3. 서비스·변환 계층

### `src/lib/resource.ts` (클라이언트 안전 순수 유틸)

- `CollectionRow` 타입(평면): `{ id, title, sub, cover, badge, tag, items, downloads }`.
- `toCollectionView(row: CollectionRow): ResourceCollection` 순수 매퍼 — 기존 뷰 타입(`ResourceCollection`)으로 매핑. `badge`가 null이면 키 생략.
- 커버/배지 enum 상수(`COLLECTION_COVERS`, `COLLECTION_BADGES`)를 노출해 admin 폼·zod에서 공유.

### `src/server/services/resource.ts`

- `getResourceListData()`에 컬렉션 조회를 추가:
  - `resource_collections`에서 공개분을 `sort_order` 순으로 조회.
  - 조인(`resource_collection_items` → `posts(view_count)`)을 임베드해 컬렉션별 `items`(연결 수)·`downloads`(view_count 합)를 JS에서 집계.
  - `ResourceListData`에 `collections: ResourceCollection[]` 추가.
- admin 전용:
  - `listCollectionsForAdmin()` — 비공개 포함 전체 + 파생 `items`.
  - `getCollectionForEdit(id)` — 메타 + 연결된 `post_id` 목록.
  - `listResourcePostsForPicker()` — 컬렉션에 연결할 후보 자료 목록(`id`, `title`, `category`).

---

## 4. 서버 액션 + admin CRUD UI

### `src/server/actions/collections.ts`

- `createCollection` / `updateCollection(id)` / `deleteCollection(id)`.
- zod 검증: `title`·`sub`·`tag` min 1, `cover` enum, `badge` enum 또는 빈값 → null, `sortOrder` coerce int min 0, `isPublished` coerce boolean.
- 자료 연결: 폼의 `postIds[]`를 받아 조인 테이블을 **전량 교체**(해당 컬렉션 행 삭제 후 재삽입). 순서는 폼 순서대로 `sort_order` 부여.
- 진입부 `requireAdmin()` 재확인(2차 방어). 완료 후 `/admin/collections`로 redirect.

### `(admin)/admin/collections/`

기존 `timetable` admin 패턴을 따른다.

- `page.tsx` — 목록 테이블(제목·태그·커버·배지·자료수·공개여부·수정) + "새 컬렉션" 버튼.
- `new/page.tsx` — `createCollection` 바인딩.
- `[id]/edit/page.tsx` — `updateCollection` 바인딩 + 삭제 폼.
- `EditorForm.tsx` (`'use client'`, `useActionState`, 인라인 스타일) — 필드: title·sub·tag(required), cover(select), badge(select: 없음/NEW/HOT), sortOrder(number), isPublished(checkbox), 자료 연결(**체크박스 목록** — `listResourcePostsForPicker()` 결과, 자료가 소수라 단순 체크박스로 충분).
- `(admin)/admin/page.tsx`에 `자료실 컬렉션 관리 →` 링크 추가.

---

## 5. 공개 화면 배선 (디자인 보존)

- `src/app/resources/page.tsx`: 서비스가 주는 `data.collections`를 데스크톱·모바일 컴포넌트에 props로 주입.
- `CollectionsSection.tsx`(데스크톱): `LB_COLLECTIONS` import 제거 → `collections` prop의 `.map`으로 교체.
- `ResourcesMobile.tsx`(모바일): 동일하게 `collections` prop 사용.
- **마크업·Tailwind/인라인 스타일·`CollectionCover`·`LbCatLabel` 등 디자인 요소는 변경 금지**, 데이터 출처만 교체(헌법 [7]).

---

## 6. 데이터 정리 + 검증

- `src/lib/resources-data.ts`: `LB_COLLECTIONS` 값 상수 삭제. 타입(`ResourceCollection`·`CollectionCoverKind`·`CollectionBadge`)은 유지.
- `src/lib/database.types.ts`: 마이그레이션 후 `npx supabase gen types typescript --local`로 재생성.
- 시드(`scripts/seed-supabase.mjs`): 기존 mock 3종에 대응하는 컬렉션 + 자료 연결을 로컬 시드에 추가(로컬 검증용).
- 로컬 e2e:
  1. admin에서 컬렉션 생성(자료 N건 연결) → 공개 `/resources`에서 `items`=N, `downloads`=연결 자료 view_count 합 확인.
  2. 수정(연결 자료 변경) 반영 확인.
  3. 비공개 토글 시 공개 화면에서 사라지는지 확인.
  4. 삭제 + 빈 컬렉션(자료 0건) 렌더 확인.
  5. 검증 데이터 정리.

---

## 범위 밖 (YAGNI)

- "전체 컬렉션 보기"·"모두 받기" 버튼은 현재 디자인상 동작 링크가 없으며(href 없음) 이번 범위에서 다루지 않는다(디자인 원본 유지).
- 커버 아트 신규 추가(3종 외)는 디자인 변경이므로 범위 밖.
- 컬렉션 단독 상세 페이지는 만들지 않는다(목록 카드까지만).
