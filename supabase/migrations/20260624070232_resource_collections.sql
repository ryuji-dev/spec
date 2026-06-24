-- 자료실 큐레이션 컬렉션: 메타 + 자료 연결 조인.
-- items/downloads는 연결된 posts에서 파생(저장하지 않음).
create table public.resource_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sub text not null,
  cover text not null check (cover in ('spring', 'easter', 'teacher')),
  badge text check (badge in ('NEW', 'HOT')),
  tag text not null,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index resource_collections_sort_idx on public.resource_collections (sort_order);

create table public.resource_collection_items (
  collection_id uuid not null references public.resource_collections (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  sort_order int not null default 0,
  primary key (collection_id, post_id)
);
create index resource_collection_items_collection_idx
  on public.resource_collection_items (collection_id);

alter table public.resource_collections enable row level security;
alter table public.resource_collection_items enable row level security;

-- 공개분은 누구나, 비공개분은 admin만 읽는다.
create policy resource_collections_select on public.resource_collections
  for select using (is_published or public.auth_is_admin());
create policy resource_collections_write on public.resource_collections
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());

-- 조인 행은 부모 공개여부로 노출이 통제되므로 select는 단순 허용.
create policy resource_collection_items_select on public.resource_collection_items
  for select using (true);
create policy resource_collection_items_write on public.resource_collection_items
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());
