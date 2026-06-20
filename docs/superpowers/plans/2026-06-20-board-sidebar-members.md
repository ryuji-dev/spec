# board 사이드바 활발한 멤버 실데이터화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/board` 데스크톱 사이드바의 "활발한 멤버" 블록을 mock(`CM_MEMBERS`)에서 실집계(board 게시 글 작성자 상위 5명, 전체 기간)로 전환한다.

**Architecture:** `getBoardListData`가 이미 조회한 게시 글 전체(`rows`)를 재사용해 작성자별 글 수를 JS 집계(committee 작업과 동일 패턴, 추가 쿼리 없음). 단, 안정 그룹핑을 위해 목록 select에 `author_id`를 추가한다. `members`를 `BoardListData`에 추가하고 데스크톱 경로(`page.tsx → BoardDesktop → SideMembers`)로만 전달한다. 디자인 마크업은 보존하고 데이터 소스만 교체한다.

**Tech Stack:** Next.js 16 App Router(Server Component), TypeScript strict, Supabase(supabase-js, RLS). 단위 테스트 러너 없음 → `pnpm lint && pnpm build` + 로컬 Supabase e2e로 검증.

---

## 파일 구조

- Modify: `src/server/services/board.ts` — select에 `author_id` 추가, `BoardListData.members` 추가, `rows`에서 멤버 집계.
- Modify: `src/lib/board-data.ts` — `CM_MEMBERS` 상수 제거(`ActiveMember` 타입 유지).
- Modify: `src/app/board/page.tsx` — 데스크톱 분기에 `members={data.members}` 전달.
- Modify: `src/app/board/_components/desktop/BoardDesktop.tsx` — `members` prop 수신·`SideMembers`에 전달.
- Modify: `src/app/board/_components/desktop/Sidebar.tsx` — `SideMembers`가 `members` prop 사용, `CM_MEMBERS` import 제거.

---

## Task 1: 서비스 멤버 집계 + 타입

**Files:**
- Modify: `src/server/services/board.ts`
- Modify: `src/lib/board-data.ts`

- [ ] **Step 1: `CM_MEMBERS` 상수 제거(타입 유지)**

`src/lib/board-data.ts`에서 `CM_MEMBERS` 상수(현재 `export const CM_MEMBERS: ReadonlyArray<ActiveMember> = [ ... ];`)를 **삭제**한다. 바로 위 `ActiveMember` 타입 선언은 그대로 둔다:
```ts
export type ActiveMember = {
  name: string;
  church: string;
  posts: number;
  init: string;
};
```

- [ ] **Step 2: 서비스에 `ActiveMember` import + 반환 타입 확장**

`src/server/services/board.ts` 상단 import의 `import type { FeedPost, BoardCategory } from "@/lib/board-data";`에 `ActiveMember`를 추가:
```ts
import type { FeedPost, BoardCategory, ActiveMember } from "@/lib/board-data";
```
그리고 `BoardListData` 타입에 `members` 추가:
```ts
export type BoardListData = {
  posts: FeedPost[];
  categories: BoardCategory[];
  members: ActiveMember[];
};
```

- [ ] **Step 3: 목록 select에 `author_id` 추가**

`getBoardListData`의 목록 쿼리 select 문자열에 `author_id`를 추가한다(작성자 id로 안정 그룹핑하기 위함):
```ts
    .select(
      "id, category, title, excerpt, view_count, created_at, author_id, author:profiles(name, church), comments(count), post_likes(count)",
    )
```

- [ ] **Step 4: `rows`에서 멤버 집계**

`getBoardListData` 내부, 카테고리 집계(`const byCat = ...`) **다음**, `return` **앞**에 멤버 집계를 추가한다. `one`은 이 파일에 이미 있는 to-one 정규화 헬퍼:
```ts
  // 활발한 멤버 — 게시 글 전체(rows)에서 작성자별 글 수 집계, 상위 5명
  const memberAgg = new Map<string, { name: string; church: string | null; count: number }>();
  for (const r of rows) {
    if (!r.author_id) continue;
    const author = one(r.author);
    const prev = memberAgg.get(r.author_id);
    if (prev) {
      prev.count += 1;
    } else {
      memberAgg.set(r.author_id, {
        name: author?.name ?? "",
        church: author?.church ?? null,
        count: 1,
      });
    }
  }
  const members: ActiveMember[] = [...memberAgg.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((m) => ({
      name: m.name,
      church: m.church ?? "",
      posts: m.count,
      init: m.name.charAt(0),
    }));
```

- [ ] **Step 5: 반환에 `members` 포함**

`return { posts: list, categories };`를 다음으로 변경:
```ts
  return { posts: list, categories, members };
```

- [ ] **Step 6: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음. (`CM_MEMBERS`를 import하던 `Sidebar.tsx` 관련 에러는 Task 2에서 해소되므로, 나오면 Task 2를 함께 진행 후 재확인.)

---

## Task 2: prop 스레딩(데스크톱) + 컴포넌트 전환

**Files:**
- Modify: `src/app/board/page.tsx`
- Modify: `src/app/board/_components/desktop/BoardDesktop.tsx`
- Modify: `src/app/board/_components/desktop/Sidebar.tsx`

- [ ] **Step 1: `page.tsx` 데스크톱 분기에 `members` 전달**

`src/app/board/page.tsx`의 데스크톱 분기 `<BoardDesktop posts={data.posts} categories={data.categories} />`를 다음으로 변경(모바일 분기는 불변):
```tsx
        <BoardDesktop posts={data.posts} categories={data.categories} members={data.members} />
```

- [ ] **Step 2: `BoardDesktop`에 `members` prop 추가·전달**

`src/app/board/_components/desktop/BoardDesktop.tsx`:
1. 타입 import에 `ActiveMember` 추가 — `import type { BoardCategory, FeedPost } from "@/lib/board-data";`를:
```ts
import type { BoardCategory, FeedPost, ActiveMember } from "@/lib/board-data";
```
2. props 구조분해와 타입에 `members` 추가:
```tsx
export default function BoardDesktop({
  posts,
  categories,
  members,
}: {
  posts: FeedPost[];
  categories: BoardCategory[];
  members: ActiveMember[];
}) {
```
3. `<SideMembers palette={palette} />`를:
```tsx
          <SideMembers palette={palette} members={members} />
```

- [ ] **Step 3: `Sidebar.tsx` — `SideMembers`가 `members` prop 사용**

`src/app/board/_components/desktop/Sidebar.tsx`:
1. import에서 `CM_MEMBERS` 제거하고 `ActiveMember` 타입 추가:
```ts
import { CM_TAGS, type BoardCategory, type ActiveMember } from "@/lib/board-data";
```
2. `SideMembers` 시그니처를 prop 수신으로 변경:
```tsx
export function SideMembers({ palette, members }: Props & { members: ActiveMember[] }) {
```
3. 본문의 `CM_MEMBERS.map((m, i) => (`를 `members.map((m, i) => (`로, `i < CM_MEMBERS.length - 1`을 `i < members.length - 1`로 변경(map 내부 스타일·로직 불변).

- [ ] **Step 4: lint·build**

Run: `pnpm lint && pnpm build`
Expected: 통과. `CM_MEMBERS` 미사용/미정의 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/server/services/board.ts src/lib/board-data.ts src/app/board/
git commit -m "feat: board 사이드바 활발한 멤버 실데이터 집계로 전환"
```

---

## Task 3: 로컬 e2e 검증 및 plan 커밋

**Files:** (코드 변경 없음 — 검증·문서)

- [ ] **Step 1: 로컬 스택·마이그레이션 확인**

```bash
npx supabase status >/dev/null 2>&1 || (colima start && npx supabase start)
npx supabase db reset
```
Expected: `Finished supabase db reset`.

> `db reset` 후 grant 초기화로 조회가 비면 로컬 한정 복구:
> ```bash
> CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
> docker exec -i "$CID" psql -U postgres -d postgres -c "grant select, insert on all tables in schema public to anon, authenticated; grant all on all tables in schema public to service_role;"
> ```

- [ ] **Step 2: 서로 다른 작성자의 board 게시 글 확보**

시드(`pnpm seed`)가 동작하면 사용. 부족하면 GoTrue admin API로 작성자 생성 후 superuser psql로 글 삽입(예: A 3건·B 1건):
```bash
SR=$(npx supabase status -o json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).SERVICE_ROLE_KEY))")
for u in "mema@example.com:김도현 목사:서경중앙" "memb@example.com:박혜진 전도사:강서동산"; do
  email="${u%%:*}"; rest="${u#*:}"; name="${rest%%:*}"; church="${rest#*:}"
  curl -s "http://127.0.0.1:54321/auth/v1/admin/users" -H "apikey: $SR" -H "Authorization: Bearer $SR" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"Passw0rd!23\",\"email_confirm\":true,\"user_metadata\":{\"name\":\"$name\"}}" >/dev/null
done
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec -i "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
update profiles p set church='서경중앙' from auth.users u where u.id=p.id and u.email='mema@example.com';
update profiles p set church='강서동산' from auth.users u where u.id=p.id and u.email='memb@example.com';
insert into posts (section, title, body, category, is_published, author_id)
select 'board','MEMBER-E2E A '||g,'본문','나눔',true,u.id from auth.users u, generate_series(1,3) g where u.email='mema@example.com';
insert into posts (section, title, body, category, is_published, author_id)
select 'board','MEMBER-E2E B','본문','질문',true,u.id from auth.users u where u.email='memb@example.com';
SQL
docker exec "$CID" psql -U postgres -d postgres -c "select pr.name, pr.church, count(*) from posts p join profiles pr on pr.id=p.author_id where p.section='board' and p.is_published group by pr.name, pr.church order by count(*) desc;"
```
Expected: 작성자별 글 수가 내림차순 출력(A 3·B 1 등).

- [ ] **Step 3: 로그인 회원으로 /board 데스크톱 사이드바 확인**

`pnpm dev` 후 회원 로그인 상태로 데스크톱 `/board` 접속(또는 Claude Preview). "활발한 멤버" 블록에 **실제 이름·교회·글 수**가 글 수 내림차순 상위 5명으로 표시되는지 확인. 이전 고정 mock(오은혜/정민호 등)이 보이지 않아야 함.

> `/board`는 회원 가드라 비로그인은 접근 불가. 검증은 로그인 세션 또는 사이드바 데이터 자체를 superuser 쿼리(Step 2 출력)로 교차 확인.

- [ ] **Step 4: lint·build 및 테스트 데이터 정리**

```bash
pnpm lint && pnpm build
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec "$CID" psql -U postgres -d postgres -c "delete from posts where title like 'MEMBER-E2E%'; delete from auth.users where email in ('mema@example.com','memb@example.com');"
```
Expected: lint·build 통과, 임시 데이터 삭제.

- [ ] **Step 5: plan 커밋**

```bash
git add docs/superpowers/plans/2026-06-20-board-sidebar-members.md
git commit -m "docs: board 사이드바 활발한 멤버 실데이터화 plan 추가"
```

---

## Self-Review 메모

- **Spec 커버리지**: select author_id 추가·멤버 집계(전체기간·상위5·정렬)=Task 1, prop 스레딩·컴포넌트 전환·디자인 보존=Task 2, e2e·정렬/상위5 검증=Task 3. "태그/인기스레드/통계 제외"·"모바일 미사용"은 변경 없음으로 충족. 누락 없음.
- **Placeholder 스캔**: 모든 코드/명령 구체화. `MEMBER-E2E`·`<CID>`는 검증용 표식/런타임 값.
- **타입 일관성**: `ActiveMember`(name·church·posts·init), `BoardListData.members`, `SideMembers`의 `members: ActiveMember[]` 전 구간 일치. `one`·`author_id`·`author:profiles(name,church)` 기존 코드와 동일.
- **db:types**: 스키마 불변(집계는 앱 레벨) → 재생성 불필요.
