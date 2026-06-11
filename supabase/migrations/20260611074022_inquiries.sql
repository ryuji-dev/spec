-- 고객지원 문의함 — 비로그인 포함 접수. 열람은 본인/관리자, 답변·삭제는 관리자만(RLS).
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  category text not null check (category in ('general','password')),
  name text not null check (char_length(name) between 1 and 50),
  email text not null check (char_length(email) <= 254),
  contact text check (contact is null or char_length(contact) <= 100),
  body text not null check (char_length(body) between 1 and 2000),
  answer text check (answer is null or char_length(answer) <= 2000),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
create index inquiries_created_at_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

-- 접수: 비로그인 포함 누구나. 단 user_id는 비우거나 본인(타인 명의 위조 차단).
create policy inquiries_insert on public.inquiries for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- 열람: 관리자 전체 + 본인 것.
create policy inquiries_select on public.inquiries for select
  using (public.auth_is_admin() or user_id = (select auth.uid()));

-- 답변(update)·삭제: 관리자만.
create policy inquiries_update on public.inquiries for update
  using (public.auth_is_admin());
create policy inquiries_delete on public.inquiries for delete
  using (public.auth_is_admin());
