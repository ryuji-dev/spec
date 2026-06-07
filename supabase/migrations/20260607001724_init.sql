-- 서경노회 교육위원회 — Supabase 초기 스키마
-- 기존 Drizzle 7테이블을 이관하되, users → auth.users + public.profiles 로 분해.
-- 보안 1차 경계는 RLS. 역할(role)은 profiles.role → JWT 커스텀 클레임 user_role 로 전달.

-- ─────────────────────────────────────────────
-- 1. enum
-- ─────────────────────────────────────────────
create type public.user_role as enum ('admin', 'member');
create type public.post_section as enum ('notice','board','committee','training','webzine','resource');
create type public.faculty_dept as enum ('ot','nt','st','pt','ch','mn');
create type public.faculty_tone as enum ('forest','olive','pine','sage');

-- ─────────────────────────────────────────────
-- 2. updated_at 자동 갱신 트리거 함수
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- 3. profiles (auth.users 1:1) — 기존 users의 비인증 필드
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  title text,
  church text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 4. posts (통합 콘텐츠) — author_id는 profiles 참조
-- ─────────────────────────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  section public.post_section not null,
  category text,
  title text not null,
  excerpt text,
  body text,
  author_id uuid references public.profiles(id) on delete set null,
  is_published boolean not null default true,
  view_count integer not null default 0,
  is_pinned boolean not null default false,
  event_date timestamptz,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_section_idx on public.posts (section);
create index posts_created_at_idx on public.posts (created_at);
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 5. attachments — stored_name 값은 Storage 오브젝트 경로
-- ─────────────────────────────────────────────
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  original_name text not null,
  stored_name text not null,
  mime text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 6. comments
-- ─────────────────────────────────────────────
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_post_id_idx on public.comments (post_id, created_at);

-- ─────────────────────────────────────────────
-- 7. post_likes — (post_id,user_id) 유니크
-- ─────────────────────────────────────────────
create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_post_user_uq unique (post_id, user_id)
);
create index post_likes_post_id_idx on public.post_likes (post_id);

-- ─────────────────────────────────────────────
-- 8. faculty (독립 테이블)
-- ─────────────────────────────────────────────
create table public.faculty (
  id uuid primary key default gen_random_uuid(),
  dept public.faculty_dept not null,
  name text not null,
  title text not null,
  en text not null,
  degree text not null,
  tone public.faculty_tone not null,
  field text not null,
  teaches jsonb not null default '[]'::jsonb,
  quote text not null,
  years integer not null default 0,
  papers integer not null default 0,
  office text not null,
  hours text not null,
  is_cover boolean not null default false,
  about text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 9. 헬퍼: 현재 요청자가 admin 인가 (JWT 커스텀 클레임 기반 — RLS 재귀 회피)
-- ─────────────────────────────────────────────
create or replace function public.auth_is_admin()
returns boolean language sql stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'user_role') = 'admin', false)
$$;

-- ─────────────────────────────────────────────
-- 10. 신규 가입 시 profiles 자동 생성
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- 이름·직함·교회는 사용자 입력(user_metadata). role은 어떤 메타데이터도 신뢰하지 않고
  -- 항상 'member'로 생성한다(공개 가입자의 role 위조 차단). admin 승격은 생성 후
  -- service-role의 명시적 profiles UPDATE로만 수행한다(admin.ts·seed).
  insert into public.profiles (id, name, title, church, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'title',
    new.raw_user_meta_data->>'church',
    'member'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 비-admin이 자기 profiles.role을 변경(권한 상승)하는 것을 차단.
-- role 판정의 진실 원천은 JWT 클레임이지만, 그 클레임은 토큰 발급 시 profiles.role을
-- 읽으므로 role 자가 변경을 막지 않으면 다음 토큰에서 admin이 된다.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- service-role(서버의 admin 발급·승격 경로)과 admin 사용자만 role을 바꿀 수 있다.
  -- 일반 사용자(authenticated/anon)의 role 변경은 조용히 무시(권한 상승 차단).
  if new.role is distinct from old.role
     and not public.auth_is_admin()
     and auth.role() <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end;
$$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ─────────────────────────────────────────────
-- 11. 커스텀 액세스 토큰 훅 — JWT에 user_role 클레임 주입
--     (config.toml [auth.hook.custom_access_token]에서 활성화)
-- ─────────────────────────────────────────────
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable
set search_path = ''
as $$
declare
  claims jsonb;
  v_role text;
begin
  select role::text into v_role from public.profiles where id = (event->>'user_id')::uuid;
  claims := event->'claims';
  if v_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  else
    claims := claims - 'user_role'; -- role 미상이면 클레임 제거(auth_is_admin은 false로 안전 실패)
  end if;
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on table public.profiles to supabase_auth_admin;

-- ─────────────────────────────────────────────
-- 12. RLS 활성화
-- ─────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.attachments enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.faculty enable row level security;

-- profiles
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.auth_is_admin());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all
  using (public.auth_is_admin()) with check (public.auth_is_admin());
-- 훅 실행 주체(supabase_auth_admin)의 profiles 읽기 허용
create policy profiles_auth_admin_read on public.profiles for select
  to supabase_auth_admin using (true);

-- posts: 공개글 + 작성자 + admin 읽기 / 섹션 의존 쓰기(board=회원, 그 외=admin)
create policy posts_select on public.posts for select
  using (is_published or author_id = auth.uid() or public.auth_is_admin());
create policy posts_insert on public.posts for insert with check (
  public.auth_is_admin()
  or (section = 'board' and auth.uid() is not null and author_id = auth.uid())
);
create policy posts_update on public.posts for update using (
  public.auth_is_admin() or (section = 'board' and author_id = auth.uid())
) with check (
  public.auth_is_admin() or (section = 'board' and author_id = auth.uid())
);
create policy posts_delete on public.posts for delete using (
  public.auth_is_admin() or (section = 'board' and author_id = auth.uid())
);

-- comments
create policy comments_select on public.comments for select using (
  exists (select 1 from public.posts p where p.id = post_id
          and (p.is_published or p.author_id = auth.uid() or public.auth_is_admin()))
);
create policy comments_insert on public.comments for insert
  with check (
    auth.uid() is not null and author_id = auth.uid()
    and exists (
      select 1 from public.posts p where p.id = post_id
      and (p.is_published or p.author_id = auth.uid() or public.auth_is_admin())
    )
  );
create policy comments_delete on public.comments for delete
  using (author_id = auth.uid() or public.auth_is_admin());

-- post_likes
create policy likes_select on public.post_likes for select using (true);
create policy likes_insert on public.post_likes for insert
  with check (user_id = auth.uid());
create policy likes_delete on public.post_likes for delete
  using (user_id = auth.uid());

-- attachments
create policy attachments_select on public.attachments for select using (
  exists (select 1 from public.posts p where p.id = post_id
          and (p.is_published or p.author_id = auth.uid() or public.auth_is_admin()))
);
create policy attachments_write on public.attachments for all
  using (public.auth_is_admin()) with check (public.auth_is_admin());

-- faculty (공개 읽기, admin 쓰기)
create policy faculty_select on public.faculty for select using (true);
create policy faculty_write on public.faculty for all
  using (public.auth_is_admin()) with check (public.auth_is_admin());

-- ─────────────────────────────────────────────
-- 13. Storage — attachments 버킷(비공개). 공개 다운로드는 서명 URL(service-role)로.
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy storage_attachments_admin on storage.objects for all to authenticated
  using (bucket_id = 'attachments' and public.auth_is_admin())
  with check (bucket_id = 'attachments' and public.auth_is_admin());
