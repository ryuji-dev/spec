-- 조회수 증가 RPC — security definer로 RLS(작성자/admin만 update) 우회.
-- 어떤 방문자(anon 포함)도 게시글 조회 시 view_count를 올릴 수 있어야 하므로 필요.
create or replace function public.increment_post_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set view_count = view_count + 1 where id = p_id and is_published = true;
$$;

grant execute on function public.increment_post_view(uuid) to anon, authenticated;
