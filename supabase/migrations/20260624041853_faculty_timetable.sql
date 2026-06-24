create table public.faculty_timetable (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  time text not null,
  course text not null,
  prof text not null,
  room text not null,
  host boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index faculty_timetable_sort_idx on public.faculty_timetable (sort_order);
alter table public.faculty_timetable enable row level security;
create policy faculty_timetable_select on public.faculty_timetable for select using (true);
create policy faculty_timetable_write on public.faculty_timetable for all using (public.auth_is_admin()) with check (public.auth_is_admin());
