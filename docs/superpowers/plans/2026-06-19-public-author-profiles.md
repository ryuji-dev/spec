# 공개 글 작성자 표시 RLS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개(게시)된 글/댓글의 작성자에 한해 `profiles` 표시 정보를 누구나 읽을 수 있게 RLS를 확대해, 공개 목록·상세의 작성자 "익명" 표기를 실제 이름으로 바꾼다.

**Architecture:** `profiles`에 스코프 SELECT 정책 1개를 추가한다. 판정은 기존 `auth_is_admin()`과 동일한 `security definer` 함수 `is_public_author(uuid)`로 캡슐화(공개 글 작성자 OR 공개 글 댓글 작성자). 서비스 코드는 이미 `author:profiles(...)`를 조인하므로 변경 없음.

**Tech Stack:** Supabase PostgreSQL + RLS, Supabase CLI 마이그레이션(SQL), 로컬 스택(colima + supabase start).

**검증 방식(이 저장소 규약):** 단위 테스트 러너가 없으므로 `npx supabase db reset`로 마이그레이션 적용 + 로컬 e2e(비로그인/회원/음성 케이스) + `pnpm lint && pnpm build`로 검증한다.

---

## 파일 구조

- Create: `supabase/migrations/<ts>_public_author_profiles.sql` — `is_public_author` 함수 + `profiles_select_public_author` 정책 + execute grant. (`<ts>`는 `npx supabase migration new`가 생성하는 타임스탬프)

서버 코드 변경 없음(서비스가 이미 author 조인).

---

## Task 1: 마이그레이션 작성 및 적용

**Files:**
- Create: `supabase/migrations/<ts>_public_author_profiles.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `npx supabase migration new public_author_profiles`
생성된 빈 파일 경로(`supabase/migrations/<ts>_public_author_profiles.sql`)를 확인한다.

- [ ] **Step 2: 마이그레이션 SQL 작성**

생성된 파일에 아래 내용을 작성:
```sql
-- 공개(게시)된 글/댓글의 작성자에 한해 profiles 표시 정보를 공개.
-- 기존 profiles_select(본인/admin)와 OR로 결합되어 읽기 범위만 넓힌다.

-- 공개 작성자 판정(보안정의: RLS 우회로 일관 판정, search_path 고정).
create or replace function public.is_public_author(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.posts p
    where p.author_id = profile_id and p.is_published
  ) or exists (
    select 1 from public.comments c
    join public.posts p on p.id = c.post_id
    where c.author_id = profile_id and p.is_published
  );
$$;

revoke all on function public.is_public_author(uuid) from public;
grant execute on function public.is_public_author(uuid) to anon, authenticated;

-- 공개 작성자 행에 대한 SELECT 허용(permissive → 기존 정책과 OR).
create policy profiles_select_public_author on public.profiles
  for select using (public.is_public_author(id));
```

- [ ] **Step 3: 로컬 스택 기동 확인 후 마이그레이션 적용**

로컬 스택이 꺼져 있으면 먼저 기동:
```bash
colima start
npx supabase start
```
적용:
```bash
npx supabase db reset
```
Expected: 모든 마이그레이션이 순서대로 적용되고 `Finished supabase db reset`. 에러 없이 완료.

- [ ] **Step 4: 함수·정책 적용 확인(superuser psql)**

DB 컨테이너에서 직접 확인(컨테이너명은 `docker ps`로 확인, 보통 `supabase_db_<worktree>`):
```bash
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec "$CID" psql -U postgres -d postgres -c "\df+ public.is_public_author"
docker exec "$CID" psql -U postgres -d postgres -c "select polname from pg_policy where polrelid='public.profiles'::regclass;"
```
Expected: 함수가 `security definer`(Security: definer)로 존재하고, 정책 목록에 `profiles_select_public_author` 포함.

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/
git commit -m "feat: 공개 글/댓글 작성자 프로필 표시 RLS 정책 추가"
```

---

## Task 2: 로컬 e2e 검증 및 plan 커밋

**Files:** (코드 변경 없음 — 검증·문서)

검증용 데이터는 시드(`pnpm seed`)가 동작하면 그것을, 안 되면 superuser psql로 직접 삽입한다. 게시 글 1건(작성자 A, 공개) + 비공개 글만 가진 작성자 B + (선택) 댓글 작성자 C가 필요하다.

- [ ] **Step 1: 검증 데이터 확보**

`pnpm seed`가 성공하면 시드 사용. 실패하거나 부족하면 superuser psql로 삽입(예시):
```bash
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec -i "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
-- 표시명 있는 프로필이 없으면 임의 auth user가 필요하므로, 기존 시드 프로필을 활용하거나
-- 본 검증은 시드(admin/member) 프로필에 게시 글을 붙여 수행한다.
-- 예: member 프로필 id를 작성자로 하는 공개 board 글 1건.
insert into posts (section, title, body, category, is_published, author_id)
select 'board','AUTHOR-E2E 공개글','본문','나눔',true, id
from profiles where role='member' limit 1;
SQL
docker exec "$CID" psql -U postgres -d postgres -c "select title, author_id, is_published from posts where title like 'AUTHOR-E2E%';"
```
Expected: 공개 글 1건이 member 작성자로 삽입됨.

- [ ] **Step 2: 비로그인 컨텍스트(anon)에서 작성자명 노출 확인**

dev 서버 기동(`pnpm dev`) 후, 해당 글이 보이는 공개 목록(board는 로그인 전용이므로, 검증은 anon API 또는 committee/notice/training 공개 섹션에 공개 글을 붙여 수행). 가장 직접적인 확인은 anon 키로 PostgREST 조회:
```bash
ANON=$(npx supabase status -o json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).ANON_KEY))")
curl -s "http://127.0.0.1:54321/rest/v1/posts?select=title,author:profiles(name)&title=like.AUTHOR-E2E*" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
Expected: 응답의 `author.name`이 `null`이 아니라 실제 member 이름. (정책 적용 전이라면 `author:null` → 적용 후 이름)

- [ ] **Step 3: 음성 케이스 — 비공개 작성자 비노출 확인**

공개 글/댓글이 없는 프로필이 anon에 노출되지 않는지 확인:
```bash
ANON=$(npx supabase status -o json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).ANON_KEY))")
curl -s "http://127.0.0.1:54321/rest/v1/profiles?select=id,name" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
Expected: 공개 글/댓글 작성자만 반환(게시 이력 없는 프로필은 미포함). 적어도 "전체 프로필이 노출되지 않음"을 확인.

- [ ] **Step 4: 앱 화면 확인(비로그인)**

`pnpm dev` 상태에서 공개 글이 있는 섹션 목록/상세를 비로그인으로 열어 작성자가 이름으로 표시되는지 확인(브라우저 프리뷰). board 검증이 필요하면 로그인 회원으로 타인 글/댓글 이름 표시도 확인.

- [ ] **Step 5: lint·build 및 테스트 데이터 정리**

```bash
pnpm lint && pnpm build
```
Expected: 통과.
검증용 임시 데이터 삭제:
```bash
CID=$(docker ps --format '{{.Names}}' | grep supabase_db | head -1)
docker exec "$CID" psql -U postgres -d postgres -c "delete from posts where title like 'AUTHOR-E2E%';"
```

- [ ] **Step 6: plan 커밋**

```bash
git add docs/superpowers/plans/2026-06-19-public-author-profiles.md
git commit -m "docs: 공개 글 작성자 표시 RLS 구현 plan 추가"
```

---

## Self-Review 메모

- **Spec 커버리지**: 마이그레이션(함수+정책+grant)=Task 1, 노출 확대 동작·음성 케이스·lint/build=Task 2. 서버 코드 변경 없음(spec 명시) — 별도 태스크 불필요. 누락 없음.
- **placeholder**: `<ts>`는 `supabase migration new`가 채우는 실제 타임스탬프(템플릿 변수, placeholder 아님). 그 외 모든 SQL·명령 구체화.
- **타입/식별자 일관성**: 함수명 `is_public_author`, 정책명 `profiles_select_public_author` 전 구간 일치. spec과 동일.
- **db:types**: 함수/정책만 추가라 `database.types.ts` 영향 없음(테이블 스키마 불변) → 재생성 불필요.
