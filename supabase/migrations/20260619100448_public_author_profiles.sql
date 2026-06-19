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
