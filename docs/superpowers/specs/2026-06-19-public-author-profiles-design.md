# 공개 글 작성자 표시 RLS 설계

작성일: 2026-06-19

## 배경·목적

공개 목록·상세에서 작성자가 모두 **"익명"**으로 표시된다. 원인은 `profiles` RLS:

```sql
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.auth_is_admin());
```

본인 또는 admin만 프로필을 읽을 수 있어, 비로그인 방문자(및 타 회원)가 글 목록을 볼 때 `author:profiles(...)` 조인이 `null`이 되고 서비스 매퍼가 `"익명"`으로 폴백한다(`board.ts:148`, `lib/board.ts`·`lib/committee.ts`·`lib/training.ts`).

목표: **공개(게시)된 글/댓글의 작성자에 한해** 표시 정보를 누구나 볼 수 있게 열되, 글·댓글을 쓴 적 없는 회원 프로필은 계속 비공개로 둔다.

## 범위 (확정 결정)

- **노출 대상**: 공개 글의 작성자 **+** 공개 글에 달린 댓글의 작성자. (그 외 회원 프로필은 비공개 유지)
- **방식**: `profiles`에 스코프 SELECT 정책 1개 추가(행 접근만 확대). 서비스 코드·노출 필드는 현행 유지.
- **노출 필드**: 각 서비스의 기존 select 그대로 — committee/training/notice는 `name·title`, board는 `name·church`. 정책은 **행 접근**만 열고, 어떤 컬럼을 보여줄지는 서비스 select가 결정한다.
- **수용된 트레이드오프**: RLS는 행 단위이므로, 공개 작성자 행에 대해서는 크래프티드 쿼리로 `role`(admin 여부)·`created_at`·`updated_at`도 조회 가능. 민감도 낮음으로 수용(Q2=A). 컬럼 차단이 필요해지면 후속에 보안 뷰/RPC로 전환.

비범위: 서비스 쿼리 변경, 노출 필드 조정, 댓글 외 다른 관계(post_likes 등) 노출.

## 아키텍처

### 마이그레이션 `supabase/migrations/<ts>_public_author_profiles.sql`

**1) 보안정의 판정 함수** — 기존 `auth_is_admin()`과 동일 패턴. RLS를 우회해 일관·예측 가능하게 판정하고, `profiles` 정책이 `posts`/`comments`를 직접 참조할 때의 평가 의존을 함수 경계로 캡슐화한다.

```sql
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
```

- `security definer` + `set search_path = public`: 검색 경로 하이재킹 방지(보안 필수).
- boolean만 반환 — 데이터 유출 표면 없음.
- `stable`: 트랜잭션 내 동일 입력 동일 결과(플래너 최적화).
- 실행 권한: `revoke all ... from public; grant execute to anon, authenticated;` (정책 평가 주체가 호출).

**2) 스코프 SELECT 정책**

```sql
create policy profiles_select_public_author on public.profiles
  for select using (public.is_public_author(id));
```

- permissive(기본) 정책이므로 기존 `profiles_select`(본인/admin)와 **OR** 결합 → 읽기 범위만 확대.
- `profiles_update_self`·`profiles_admin_all`·`profiles_auth_admin_read` 등 기존 정책 불변.

### 서버 코드 — 변경 없음

`committee.ts`·`training.ts`·`notice.ts`·`board.ts` 모두 이미 `author:profiles(...)`를 조인한다(createSupabaseServer = anon/user 컨텍스트, RLS 적용). 정책 확대만으로 조인이 resolve된다. `"익명"` 폴백은 `author_id`가 실제 null인 경우(작성자 삭제 `on delete set null`)에만 남는다.

## 보안 고려

- 정책이 참조하는 `posts`·`comments`는 `profiles`를 역참조하지 않아 **상호 재귀 없음**(확인 완료).
- 함수가 `security definer`이므로 RLS를 우회한다 — 그러나 `is_published` 조건으로 **공개 글/댓글 작성자만** true. 비공개 글만 가진 작성자는 노출되지 않는다.
- 개인정보(교회 회원) 민감도: 노출 필드는 표시용 `name/title/church`로 제한된 화면 사용에 한정. 행 단위 부가 컬럼(`role`·타임스탬프) 노출은 수용된 트레이드오프로 명시.

## 검증 (로컬 Supabase)

전제: 로컬 스택 기동 + 시드(또는 직접 삽입)로 게시 글/댓글 보유.

- **비로그인**: `/notice`·`/committee`·`/training` 목록·상세에서 작성자 이름이 실제 표시(이전 "익명" → 이름).
- **로그인 회원**: `/board` 글·댓글에서 **타인** 작성자/댓글 이름 표시.
- **음성 케이스**: 공개 글/댓글이 없는 회원 프로필을 anon 컨텍스트로 직접 조회 시 여전히 0건(비공개 유지). 비공개(`is_published=false`) 글만 가진 작성자도 비노출.
- 함수 정의 점검: `security definer` + `set search_path = public` + boolean 반환.
- `npx supabase db reset`로 마이그레이션 적용 성공, `pnpm lint && pnpm build` 통과.

## 구현 단계(개요)

1. 마이그레이션 작성(`is_public_author` 함수 + `profiles_select_public_author` 정책 + execute grant).
2. `npx supabase db reset`로 적용, 로컬 e2e(비로그인/회원/음성 케이스).
3. `pnpm db:types` 재생성 여부 확인(함수는 타입 영향 없음 — 정책/함수만 추가이므로 보통 불필요. 변경 없으면 생략).
4. 문서·마이그레이션 커밋.
