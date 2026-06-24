-- 메인 히어로 사진 배너 슬라이드.
create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  alt text not null default '',
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index hero_slides_sort_idx on public.hero_slides (sort_order);

alter table public.hero_slides enable row level security;

-- 공개분은 누구나, 비공개분은 admin만 읽는다.
create policy hero_slides_select on public.hero_slides
  for select using (is_published or public.auth_is_admin());
create policy hero_slides_write on public.hero_slides
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());

-- Storage — hero 버킷(공개). 배너 이미지는 공개 URL로 직접 노출(CDN 캐시).
insert into storage.buckets (id, name, public)
values ('hero', 'hero', true)
on conflict (id) do nothing;

-- 쓰기(업로드/수정/삭제)는 admin만. 읽기는 공개 버킷이라 익명 URL 접근 허용.
create policy storage_hero_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'hero' and public.auth_is_admin())
  with check (bucket_id = 'hero' and public.auth_is_admin());
