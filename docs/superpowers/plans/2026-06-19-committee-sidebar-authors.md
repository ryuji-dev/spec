# committee 사이드바 활발한 작성자 실데이터화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/committee` 데스크톱 사이드바의 "활발한 작성자" 블록을 mock(`SIDE_AUTHORS`)에서 실집계(교육위원회 게시 글 작성자 상위 4명)로 전환한다.

**Architecture:** `getCommitteeListData`가 이미 조회한 게시 글 전체(`rows`)를 재사용해 작성자별 글 수를 JS로 집계(기존 카테고리·첨부 집계와 동일 패턴, 추가 쿼리 없음). `authors`를 `CommitteeListData`에 추가하고 데스크톱 경로(`page.tsx → CommitteeDesktop → Sidebar → SideAuthorsBlock`)로만 전달한다. 디자인 마크업은 보존하고 데이터 소스만 교체한다.

**Tech Stack:** Next.js 16 App Router(Server Component), TypeScript strict, Supabase(supabase-js, RLS). 단위 테스트 러너 없음 → `pnpm lint && pnpm build` + 로컬 Supabase e2e로 검증.

---

## 파일 구조

- Modify: `src/lib/committee-data.ts` — `SIDE_AUTHORS` 상수 제거(`SideAuthor` 타입은 유지).
- Modify: `src/server/services/committee.ts` — `CommitteeListData`에 `authors` 추가, `rows`에서 작성자 집계.
- Modify: `src/app/committee/page.tsx` — 데스크톱 분기에 `authors={data.authors}` 전달.
- Modify: `src/app/committee/_components/desktop/CommitteeDesktop.tsx` — `authors` prop 수신·`Sidebar`에 전달.
- Modify: `src/app/committee/_components/desktop/Sidebar.tsx` — `Sidebar`·`SideAuthorsBlock`이 `authors` prop 사용, `SIDE_AUTHORS` import 제거.

---

## Task 1: 서비스 작성자 집계 + 타입 정리

**Files:**
- Modify: `src/lib/committee-data.ts`
- Modify: `src/server/services/committee.ts`

- [ ] **Step 1: `SIDE_AUTHORS` 상수 제거(타입 유지)**

`src/lib/committee-data.ts`에서 `SIDE_AUTHORS` 상수(현재 `export const SIDE_AUTHORS: SideAuthor[] = [ ... ];`)를 **삭제**한다. 바로 위의 `SideAuthor` 타입 선언은 그대로 둔다:

```ts
export type SideAuthor = {
  name: string;
  role: string;
  init: string;
  posts: number;
};
```

- [ ] **Step 2: 서비스에 `SideAuthor` import 및 반환 타입 확장**

`src/server/services/committee.ts` 상단의 `committee-data` import에 `SideAuthor`를 추가한다(기존에 `PopularPost`, `PostCategory` 등을 가져오는 import 구문에 합류). 그리고 `CommitteeListData` 타입에 `authors` 필드를 추가한다:

```ts
export type CommitteeListData = {
  pinned: Post | null;
  posts: Post[];
  categories: PostCategory[];
  popular: PopularPost[];
  authors: SideAuthor[];
};
```

(필드명·순서는 기존 타입에 맞춰 `popular` 다음에 `authors`를 추가. `Post`·`PostCategory`·`PopularPost`는 이미 import/정의되어 있음.)

- [ ] **Step 3: `rows`에서 작성자 집계**

`getCommitteeListData` 내부, "인기글" 블록(`const { data: pop } ...`) **앞**에 작성자 집계를 추가한다. `rows`는 이미 `author_id`와 `author:profiles(name, title)`를 포함해 조회돼 있다(상단 목록 쿼리).

```ts
  // 활발한 작성자 — 게시 글 전체(rows)에서 작성자별 글 수 집계, 상위 4명
  const authorAgg = new Map<string, { name: string; title: string | null; count: number }>();
  for (const r of rows) {
    if (!r.author_id) continue;
    const author = one(r.author);
    const prev = authorAgg.get(r.author_id);
    if (prev) {
      prev.count += 1;
    } else {
      authorAgg.set(r.author_id, {
        name: author?.name ?? "",
        title: author?.title ?? null,
        count: 1,
      });
    }
  }
  const authors: SideAuthor[] = [...authorAgg.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 4)
    .map((a) => ({
      name: a.name,
      role: a.title ?? "",
      init: a.name.charAt(0),
      posts: a.count,
    }));
```

(`one`은 이 파일에서 이미 to-one 임베드 정규화에 사용 중인 헬퍼.)

- [ ] **Step 4: 반환에 `authors` 포함**

함수 끝 `return { pinned, posts: list, categories, popular };`를 다음으로 변경:

```ts
  return { pinned, posts: list, categories, popular, authors };
```

- [ ] **Step 5: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음. (`SIDE_AUTHORS`를 import하던 곳이 아직 남아 있으면 다음 Task에서 해소되므로, 이 단계에서 `Sidebar.tsx` 관련 에러가 나면 무시하지 말고 Task 2를 함께 진행한 뒤 재확인.)

---

## Task 2: prop 스레딩(데스크톱 경로) + 컴포넌트 전환

**Files:**
- Modify: `src/app/committee/page.tsx`
- Modify: `src/app/committee/_components/desktop/CommitteeDesktop.tsx`
- Modify: `src/app/committee/_components/desktop/Sidebar.tsx`

- [ ] **Step 1: `page.tsx` 데스크톱 분기에 `authors` 전달**

`src/app/committee/page.tsx`의 데스크톱 분기 `<CommitteeDesktop ... />`에 `authors={data.authors}`를 추가한다(모바일 분기는 변경하지 않음):

```tsx
        <CommitteeDesktop
          pinned={data.pinned}
          posts={data.posts}
          categories={data.categories}
          popular={data.popular}
          authors={data.authors}
        />
```

- [ ] **Step 2: `CommitteeDesktop`에 `authors` prop 추가·전달**

`src/app/committee/_components/desktop/CommitteeDesktop.tsx`:
1. 상단 타입 import에 `SideAuthor`를 추가한다(기존 `import type { PopularPost } from "@/lib/committee-data";` 구문에 합류 → `import type { PopularPost, SideAuthor } from "@/lib/committee-data";`).
2. `Props`에 `authors: SideAuthor[];`를 `popular: PopularPost[];` 다음 줄에 추가.
3. 함수 시그니처 구조분해를 `{ pinned, posts, categories, popular, authors }`로 변경.
4. `<Sidebar palette={palette} popular={popular} />`를 `<Sidebar palette={palette} popular={popular} authors={authors} />`로 변경.

- [ ] **Step 3: `Sidebar.tsx` — `authors` prop 사용, mock import 제거**

`src/app/committee/_components/desktop/Sidebar.tsx`:
1. import에서 `SIDE_AUTHORS` 제거: `import { BD_TAGS, SIDE_AUTHORS } from "@/lib/committee-data";` → `import { BD_TAGS } from "@/lib/committee-data";`
2. 타입 import에 `SideAuthor` 추가: `import type { PopularPost } from "@/lib/committee-data";` → `import type { PopularPost, SideAuthor } from "@/lib/committee-data";`
3. `SideAuthorsBlock` 시그니처를 prop 수신으로 변경하고 `SIDE_AUTHORS.map`을 `authors.map`으로 변경:

```tsx
/** 사이드 — 활발한 작성자. */
function SideAuthorsBlock({ palette, authors }: SideProps & { authors: SideAuthor[] }) {
```

그리고 본문의 `{SIDE_AUTHORS.map((a) => {` 를 `{authors.map((a) => {` 로 변경한다(map 내부 로직·스타일은 그대로).

4. `Sidebar` 기본 export 시그니처와 `SideAuthorsBlock` 호출에 `authors`를 추가:

```tsx
export default function Sidebar({
  palette,
  popular,
  authors,
}: SideProps & { popular: PopularPost[]; authors: SideAuthor[] }) {
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <SidePopular palette={palette} popular={popular} />
      <SideTags palette={palette} />
      <SideAuthorsBlock palette={palette} authors={authors} />
    </aside>
  );
}
```

- [ ] **Step 4: lint·build**

Run: `pnpm lint && pnpm build`
Expected: 통과. `SIDE_AUTHORS` 미사용/미정의 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/committee-data.ts src/server/services/committee.ts src/app/committee/
git commit -m "feat: committee 사이드바 활발한 작성자 실데이터 집계로 전환"
```

---

## Task 3: 로컬 e2e 검증 및 plan 커밋

**Files:** (코드 변경 없음 — 검증·문서)

- [ ] **Step 1: 로컬 스택 기동·마이그레이션 적용 확인**

```bash
npx supabase status >/dev/null 2>&1 || (colima start && npx supabase start)
npx supabase db reset
```
Expected: `Finished supabase db reset`. (스키마 불변이라 `db:types` 재생성 불필요.)

> 참고: `db reset` 후 로컬 grant가 초기화될 수 있다. anon이 `posts`/`profiles`를 못 읽어 작성자가 비면, 로컬 한정으로 표준 grant를 복구한다:
> ```bash
> CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
> docker exec -i "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
> grant select on all tables in schema public to anon, authenticated;
> grant all on all tables in schema public to service_role;
> SQL
> ```

- [ ] **Step 2: 서로 다른 작성자의 committee 게시 글 확보(필요 시 직접 삽입)**

시드(`pnpm seed`)가 동작하면 그대로 사용. 부족하면 superuser psql로 서로 다른 작성자·글 수를 만들어 순위를 확인할 수 있게 한다(예: 작성자 A 3건, B 1건):

```bash
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec -i "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
-- 시드 프로필(admin/member)을 작성자로 하는 공개 committee 글 삽입
insert into posts (section, title, body, category, is_published, author_id)
select 'committee','SIDEAUTH-E2E '||g, '본문','나눔', true, p.id
from (select id from profiles where role='member' limit 1) p, generate_series(1,3) g;
insert into posts (section, title, body, category, is_published, author_id)
select 'committee','SIDEAUTH-E2E admin', '본문','공지', true, p.id
from (select id from profiles where role='admin' limit 1) p;
SQL
docker exec "$CID" psql -U postgres -d postgres -c "select author_id, count(*) from posts where section='committee' and is_published group by author_id order by count(*) desc;"
```
Expected: 서로 다른 작성자별 글 수가 출력됨.

- [ ] **Step 3: 비로그인 데스크톱에서 작성자 블록 확인**

`pnpm dev` 후 데스크톱 UA로 `/committee` 접속(또는 Claude Preview). "활발한 작성자"(CONTRIBUTORS) 블록에 **실제 이름·직함·글 수**가 글 수 내림차순 상위 4명으로 표시되는지 확인. 이전 고정 mock(한경수/김도현/...)이 더 이상 보이지 않아야 함.

직접 데이터 레벨 확인(anon PostgREST, 집계는 화면에서 검증하되 작성자 노출 자체 확인):
```bash
ANON=$(npx supabase status -o json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).ANON_KEY))")
curl -s "http://127.0.0.1:54321/rest/v1/posts?select=author:profiles(name)&section=eq.committee&is_published=eq.true&limit=5" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
Expected: `author.name`이 `null`이 아닌 실제 이름.

- [ ] **Step 4: lint·build 및 테스트 데이터 정리**

```bash
pnpm lint && pnpm build
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec "$CID" psql -U postgres -d postgres -c "delete from posts where title like 'SIDEAUTH-E2E%';"
```
Expected: lint·build 통과, 임시 글 삭제됨.

- [ ] **Step 5: plan 커밋**

```bash
git add docs/superpowers/plans/2026-06-19-committee-sidebar-authors.md
git commit -m "docs: committee 사이드바 활발한 작성자 실데이터화 plan 추가"
```

---

## Self-Review 메모

- **Spec 커버리지**: 작성자 집계(committee 섹션·상위 4명·글 수 정렬)=Task 1, prop 스레딩·컴포넌트 전환·디자인 보존=Task 2, e2e·정렬/상위4 검증=Task 3. "주요 태그 정적 유지"·"모바일 미사용"은 변경 없음으로 충족(비범위 명시). 누락 없음.
- **Placeholder 스캔**: 모든 코드/명령 구체화. `SIDEAUTH-E2E`·`<CID>`는 검증용 실제 토큰/런타임 값.
- **타입 일관성**: `SideAuthor`(name·role·init·posts), `CommitteeListData.authors`, `Sidebar`/`SideAuthorsBlock`의 `authors: SideAuthor[]` 전 구간 일치. `one` 헬퍼·`author_id`·`author:profiles(name,title)`는 기존 코드와 동일.
- **db:types**: 스키마 불변(집계는 앱 레벨) → 재생성 불필요.
