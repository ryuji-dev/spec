-- 교역자수련회 이벤트(예정/지난/강사/일정). 게시판 posts와 분리된 구조화 데이터.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  theme text,
  category text,
  badge text,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  place text,
  note text,
  cover text not null default 'mountain-dawn',
  capacity int,
  registered int,
  fee text,
  deadline date,
  speakers jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  participants int,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index events_starts_at_idx on public.events (starts_at);

alter table public.events enable row level security;

-- 공개: 게시된 이벤트 읽기
create policy events_select on public.events
  for select using (is_published);

-- admin: 전체 쓰기 (admin PR에서 실사용)
create policy events_write on public.events
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());
