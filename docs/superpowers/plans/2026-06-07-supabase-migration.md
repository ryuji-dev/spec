# Supabase 전면 전환 구현 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oracle VM/Docker/Drizzle/커스텀인증 백엔드를 Supabase(supabase-js·RLS·Auth·Storage) + Vercel로 전면 전환하되, 디자인 UI와 뷰모델 매퍼는 보존한다.

**Architecture:** Vercel 호스팅 Next.js 16 앱이 `@supabase/ssr` 쿠키 세션으로 Supabase에 접근한다. RLS가 DB 차원 1차 보안 경계이며, 역할은 `profiles.role` → JWT 커스텀 클레임 `user_role`로 전달된다. 읽기는 Server Component, 쓰기는 Server Action에서 사용자 세션 클라이언트로, admin 특권 작업만 service-role 클라이언트로 수행한다.

**Tech Stack:** Next.js 16.2.4, `@supabase/supabase-js`, `@supabase/ssr`, Supabase CLI(로컬 스택), PostgreSQL+RLS, zod, file-type, pnpm.

**설계 출처:** `docs/superpowers/specs/2026-06-07-supabase-migration-design.md`

---

## ⚠️ 실행 전 공통 규칙

- **Next.js 16은 학습 데이터와 다르다.** 코드 작성 전 `web/node_modules/next/dist/docs/`의 관련 가이드(proxy, server actions)와 `@supabase/ssr` 공식 Next.js 가이드를 먼저 확인한다(`web/AGENTS.md`).
- **결제 지연**: Phase 0~4는 **무료 로컬 스택**(`supabase start`)으로만 진행 — 결제 $0. **Phase 5에서만** Pro 결제·클라우드 연결.
- **디자인 100% 보존**: `web/src/app/**` 클라이언트 컴포넌트의 마크업·Tailwind·인라인 스타일은 불변. 데이터 바인딩·타입만 교체.
- **server-only 경계**: `service.ts`(service_role 키)는 절대 클라이언트 번들에 유입 금지.
- 모든 커밋은 `feat:`/`refactor:`/`chore:`/`docs:` + 한국어 본문, 트레일러 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **커밋·PR은 사용자 명시 요청 시에만.** 각 Task의 커밋 step은 사용자 승인 후 수행한다.

---

# Phase 0 — 의존성·셋업·문서 ($0)

## Task 0.1: Supabase 의존성 추가 / 구 백엔드 의존성 제거

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: 신규 의존성 추가**

```bash
cd web
pnpm add @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: 구 백엔드 의존성 제거**

```bash
cd web
pnpm remove drizzle-orm postgres jose @node-rs/argon2
pnpm remove -D drizzle-kit @electric-sql/pglite @electric-sql/pglite-socket
```

> `zod`·`file-type`·`server-only`은 유지(제거 금지).

- [ ] **Step 3: 설치 확인**

Run: `cd web && pnpm install`
Expected: lockfile 갱신, 에러 없음. (이 시점 빌드는 깨짐 — 구 import가 남아있음. Phase 진행하며 해소)

- [ ] **Step 4: Commit** (사용자 승인 후)

```bash
git add web/package.json web/pnpm-lock.yaml
git commit -m "chore: Supabase 의존성 추가 및 Drizzle·jose·argon2 제거"
```

## Task 0.2: Supabase 로컬 프로젝트 초기화

**Files:**
- Create: `supabase/config.toml` (CLI 생성)
- Modify: `.gitignore` (루트)

- [ ] **Step 1: supabase init (루트에서)**

```bash
npx supabase init
```

Expected: `supabase/` 디렉터리 생성(`config.toml`, `migrations/`, `seed.sql` 등).

- [ ] **Step 2: config.toml에 커스텀 액세스 토큰 훅 활성화**

`supabase/config.toml`에 추가:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

- [ ] **Step 3: .gitignore 확인** — `supabase/.branches`·`supabase/.temp`는 무시, `supabase/migrations`·`config.toml`·`seed.sql`은 커밋 대상. CLI가 추가한 `.gitignore` 항목 검토.

- [ ] **Step 4: 로컬 스택 기동 테스트**

```bash
npx supabase start
```

Expected: API `http://127.0.0.1:54321`, DB `54322`, Studio `54323` 출력. `anon key`·`service_role key` 출력 기록.

```bash
npx supabase stop
```

- [ ] **Step 5: Commit** (사용자 승인 후)

```bash
git add supabase/ .gitignore
git commit -m "chore: Supabase 로컬 프로젝트 초기화(config·훅 등록)"
```

## Task 0.3: 환경변수 구조 확립

**Files:**
- Create: `web/.env.local` (gitignore — 커밋 금지)

- [ ] **Step 1: .env.local 작성** (`supabase start` 출력 키 사용)

```bash
# web/.env.local  (로컬 스택 기본값 — supabase status로 확인)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<로컬 anon key>
SUPABASE_SERVICE_ROLE_KEY=<로컬 service_role key>
```

- [ ] **Step 2: .gitignore 확인** — `web/.env*`(또는 `.env.local`)이 무시되는지 확인. 시크릿 커밋 금지.

- [ ] **Step 3: 구 env 흔적 제거** — `web/` 내 `DATABASE_URL`·`JWT_SECRET`·`SEED_ADMIN_*` 참조 위치를 grep으로 목록화(후속 Task에서 제거 대상으로 추적).

Run: `cd web && grep -rn "DATABASE_URL\|JWT_SECRET\|SEED_ADMIN" src scripts 2>/dev/null`

## Task 0.4: next.config standalone 제거

**Files:**
- Modify: `web/next.config.ts`

- [ ] **Step 1: `output: 'standalone'` 제거** (Vercel 불필요). 다른 설정은 보존.

- [ ] **Step 2: Commit** (사용자 승인 후)

```bash
git add web/next.config.ts
git commit -m "chore: Vercel 배포 위해 standalone 출력 제거"
```

## Task 0.5: CLAUDE.md 헌법 갱신

**Files:**
- Modify: `CLAUDE.md` (루트)

- [ ] **Step 1: 갱신 대상 섹션** — "아키텍처 한눈에"·"기술 스택"·"통신 규약"·"보안 기본기"·"다음 작업"을 Supabase/Vercel 기준으로 재작성:
  - 배포: Oracle ARM VM + Docker Compose → **Vercel + Supabase(Pro)**
  - DB: PostgreSQL(Drizzle) → **Supabase Postgres(supabase-js + RLS)**
  - 인증: jose JWT + argon2 → **Supabase Auth + @supabase/ssr**
  - 파일: 로컬 디스크 `web/uploads/` → **Supabase Storage**
  - "무료 운영" → "**저비용 운영(월 $25, 결제는 배포 시점부터)**"
  - 보안 기본기: argon2 항목 → Supabase Auth 위임, "권한 체크는 서버에서" → "**RLS가 1차 경계 + 서버 방어층**"

- [ ] **Step 2: Commit** (사용자 승인 후)

```bash
git add CLAUDE.md
git commit -m "docs: 헌법을 Supabase·Vercel 스택으로 갱신"
```

**Phase 0 검증:** `cd web && pnpm install` 통과, `npx supabase start`/`stop` 정상, `.env.local` 존재(미커밋). 빌드는 아직 깨짐(정상 — 후속 Phase에서 해소).

---

# Phase 1 — 스키마·RLS·인증 기반 ($0, 로컬)

> 단일 초기 마이그레이션으로 enum·테이블·profiles·RLS·헬퍼·트리거·훅·Storage를 모두 세운다. 큰 파일이므로 논리 블록을 Task로 분할하되, 결과물은 `supabase/migrations/<timestamp>_init.sql` 하나로 합친다.

## Task 1.1: 초기 마이그레이션 — enum·테이블·profiles

**Files:**
- Create: `supabase/migrations/0001_init.sql` (또는 `npx supabase migration new init`로 타임스탬프 파일 생성)

- [ ] **Step 1: 마이그레이션 파일 생성**

```bash
npx supabase migration new init
```

- [ ] **Step 2: enum + profiles + 콘텐츠 테이블 작성** (생성된 파일에)

```sql
-- enum
create type user_role as enum ('admin', 'member');
create type post_section as enum ('notice','board','committee','training','webzine','resource');
create type faculty_dept as enum ('ot','nt','st','pt','ch','mn');
create type faculty_tone as enum ('forest','olive','pine','sage');

-- profiles (auth.users 1:1)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  title text,
  church text,
  role user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  section post_section not null,
  category text,
  title text not null,
  excerpt text,
  body text not null,
  author_id uuid references public.profiles(id) on delete set null,
  is_published boolean not null default true,
  view_count integer not null default 0,
  is_pinned boolean not null default false,
  event_date date,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_section_created_idx on public.posts (section, created_at desc);

-- attachments
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  original_name text not null,
  stored_path text not null,
  mime text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);

-- comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_post_created_idx on public.comments (post_id, created_at);

-- post_likes
create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- faculty (독립 테이블)
create table public.faculty (
  id uuid primary key default gen_random_uuid(),
  dept faculty_dept not null,
  name text not null,
  title text not null,
  en text not null,
  degree text not null,
  tone faculty_tone not null,
  field text not null,
  teaches jsonb not null default '[]'::jsonb,
  quote text,
  years integer not null default 0,
  papers integer not null default 0,
  office text,
  hours text,
  is_cover boolean not null default false,
  about text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
```

> 컬럼명은 snake_case(Postgres 관례). 매퍼는 생성 타입을 통해 이 이름을 받는다. 기존 Drizzle 스키마(`web/src/server/db/schema/*`)와 1:1 대응되는지 대조 확인.

## Task 1.2: 헬퍼 함수 + 커스텀 액세스 토큰 훅 + 트리거

**Files:**
- Modify: `supabase/migrations/0001_init.sql` (이어서 추가)

- [ ] **Step 1: 커스텀 액세스 토큰 훅** — JWT에 `user_role` 클레임 주입

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  v_role text;
begin
  select role::text into v_role from public.profiles where id = (event->>'user_id')::uuid;
  claims := coalesce(event->'claims', '{}'::jsonb);
  if v_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Auth 관리자만 훅 실행, profiles 읽기 허용
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on public.profiles to supabase_auth_admin;
```

- [ ] **Step 2: admin 판정 헬퍼** (RLS 재귀 회피 — JWT 클레임 사용)

```sql
create or replace function public.auth_is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'user_role') = 'admin', false)
$$;
```

- [ ] **Step 3: 신규 가입 시 profiles 자동 생성 트리거**

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, title, church, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'title',
    new.raw_user_meta_data->>'church',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## Task 1.3: RLS 정책

**Files:**
- Modify: `supabase/migrations/0001_init.sql` (이어서 추가)

- [ ] **Step 1: RLS 활성화 + 정책** (설계 5장 정책표 반영)

```sql
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

-- posts: 공개글 + 작성자 + admin 읽기 / 섹션 의존 쓰기
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
create policy comments_select on public.comments for select
  using (exists (select 1 from public.posts p where p.id = post_id
                 and (p.is_published or p.author_id = auth.uid() or public.auth_is_admin())));
create policy comments_insert on public.comments for insert
  with check (auth.uid() is not null and author_id = auth.uid());
create policy comments_delete on public.comments for delete
  using (author_id = auth.uid() or public.auth_is_admin());

-- post_likes
create policy likes_select on public.post_likes for select using (true);
create policy likes_insert on public.post_likes for insert
  with check (user_id = auth.uid());
create policy likes_delete on public.post_likes for delete
  using (user_id = auth.uid());

-- attachments
create policy attachments_select on public.attachments for select
  using (exists (select 1 from public.posts p where p.id = post_id
                 and (p.is_published or p.author_id = auth.uid() or public.auth_is_admin())));
create policy attachments_write on public.attachments for all
  using (public.auth_is_admin()) with check (public.auth_is_admin());

-- faculty
create policy faculty_select on public.faculty for select using (true);
create policy faculty_write on public.faculty for all
  using (public.auth_is_admin()) with check (public.auth_is_admin());
```

## Task 1.4: Storage 버킷 + 정책

**Files:**
- Modify: `supabase/migrations/0001_init.sql` (이어서 추가)

- [ ] **Step 1: attachments 버킷(비공개) + RLS**

```sql
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy storage_attachments_read on storage.objects for select
  using (bucket_id = 'attachments');
create policy storage_attachments_write on storage.objects for all
  using (bucket_id = 'attachments' and public.auth_is_admin())
  with check (bucket_id = 'attachments' and public.auth_is_admin());
```

> 공개 다운로드는 서명 URL로 제공(앱 코드). 버킷 자체는 비공개.

## Task 1.5: 마이그레이션 적용 + 타입 생성

**Files:**
- Create: `web/src/lib/database.types.ts`

- [ ] **Step 1: 로컬 적용**

```bash
npx supabase start
npx supabase db reset   # 마이그레이션 + seed 재적용
```

Expected: 에러 없이 모든 객체 생성. Studio(`:54323`)에서 테이블·RLS·버킷·훅 확인.

- [ ] **Step 2: 타입 생성**

```bash
npx supabase gen types typescript --local > web/src/lib/database.types.ts
```

Expected: `Database` 타입 생성. `pnpm tsc --noEmit`로 컴파일 확인(아직 다른 파일 깨짐은 무시).

- [ ] **Step 3: Commit** (사용자 승인 후)

```bash
git add supabase/migrations web/src/lib/database.types.ts
git commit -m "feat: Supabase 초기 스키마·RLS·Storage·인증 훅 마이그레이션"
```

## Task 1.6: 시드 (콘텐츠 + auth 사용자)

**Files:**
- Create: `supabase/seed.sql` (콘텐츠)
- Create: `web/scripts/seed-supabase.mjs` (auth 사용자 — service_role)

- [ ] **Step 1: auth 시드 스크립트** — 기존 `dev-db.mjs`의 admin/member 계정을 `auth.admin.createUser`로 재현

```js
// web/scripts/seed-supabase.mjs
// 로컬 Supabase에 admin·member 계정 생성(멱등). service_role 키 사용.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const users = [
  { email: "admin@seogyeong.kr", password: "admin1234",
    meta: { name: "교육위원회", title: "관리자", church: "교육위원회", role: "admin" } },
  { email: "member@seogyeong.kr", password: "member1234",
    meta: { name: "홍길동", title: "전도사", church: "은혜로교회", role: "member" } },
];

for (const u of users) {
  const { data: list } = await supabase.auth.admin.listUsers();
  if (list.users.some((x) => x.email === u.email)) {
    console.log(`skip: ${u.email}`); continue;
  }
  const { error } = await supabase.auth.admin.createUser({
    email: u.email, password: u.password, email_confirm: true, user_metadata: u.meta,
  });
  console.log(error ? `error ${u.email}: ${error.message}` : `created: ${u.email}`);
}
```

- [ ] **Step 2: 콘텐츠 시드** — `supabase/seed.sql`에 posts(섹션별)·faculty·attachments 메타·comments·likes 더미. 기존 `dev-db.mjs` 데이터 양식을 SQL로 이관(author_id는 시드된 profiles에서 select).

> auth 사용자가 먼저 있어야 author_id를 채울 수 있으므로 순서: `db reset`(스키마+seed.sql) → `seed-supabase.mjs`(auth) → 필요시 author_id 업데이트. 또는 seed.sql을 auth 사용자 생성 후 실행하는 별도 흐름으로 설계. (구현 시 순서 의존성 확정)

- [ ] **Step 3: 시드 실행·검증**

```bash
cd web && node scripts/seed-supabase.mjs
```

Expected: `created: admin@…`, `created: member@…`. 재실행 시 `skip`.

- [ ] **Step 4: Commit** (사용자 승인 후)

```bash
git add supabase/seed.sql web/scripts/seed-supabase.mjs
git commit -m "feat: Supabase 로컬 시드(콘텐츠 + admin·member 계정)"
```

**Phase 1 검증:** `supabase db reset` + `seed-supabase.mjs` 후 Studio에서 7테이블·RLS·버킷·훅·시드 데이터 확인. 타입 생성물 컴파일 통과.

---

# Phase 2 — 인증 재구축 ($0)

## Task 2.1: Supabase 클라이언트 팩토리 3종

**Files:**
- Create: `web/src/server/supabase/server.ts` (server-only, 사용자 세션)
- Create: `web/src/server/supabase/service.ts` (server-only, service_role)
- Create: `web/src/lib/supabase/client.ts` (브라우저)

- [ ] **Step 1: 서버 클라이언트** (`@supabase/ssr` 공식 Next.js 가이드 확인 후)

```ts
// web/src/server/supabase/server.ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component 컨텍스트: proxy가 세션을 갱신하므로 무시
          }
        },
      },
    },
  );
}
```

- [ ] **Step 2: service-role 클라이언트**

```ts
// web/src/server/supabase/service.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createSupabaseService() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

- [ ] **Step 3: 브라우저 클라이언트** (필요 시점에만 사용)

```ts
// web/src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function createSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

## Task 2.2: current-user 재구현

**Files:**
- Modify: `web/src/server/auth/current-user.ts`
- Delete: `web/src/server/auth/session.ts`, `web/src/server/auth/password.ts` (Phase 5 정리에서 일괄 제거 가능 — 여기선 import만 끊음)

- [ ] **Step 1: getCurrentUser/requireAdmin 재작성**

```ts
// web/src/server/auth/current-user.ts
import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/server/supabase/server";

export type CurrentUser = {
  id: string; email: string; role: "admin" | "member";
  name: string; title: string | null; church: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, title, church")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return {
    id: user.id, email: user.email!, role: profile.role,
    name: profile.name, title: profile.title, church: profile.church,
  };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  return user;
}
```

## Task 2.3: proxy.ts 재작성

**Files:**
- Modify: `web/src/proxy.ts`

- [ ] **Step 1: @supabase/ssr 세션 갱신 + 가드** (`node_modules/next/dist/docs/`의 proxy 가이드 + @supabase/ssr 가이드 확인)

```ts
// web/src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 역할은 JWT 커스텀 클레임에서. getClaims 미지원 버전이면 profiles 조회로 폴백.
  let role: string | undefined;
  if (user) {
    const { data } = await supabase.auth.getClaims();
    role = (data?.claims as Record<string, unknown> | undefined)?.user_role as string | undefined;
  }

  const ok = path.startsWith("/admin") ? role === "admin" : user != null;
  if (!ok) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = { matcher: ["/admin/:path*", "/board/:path*"] };
```

> `supabase.auth.getClaims()`가 설치된 supabase-js 버전에 있는지 확인. 없으면 `profiles` 조회로 role 판정(엣지 DB 호출 — 저트래픽 허용).

## Task 2.4: 로그인·로그아웃 액션

**Files:**
- Modify: `web/src/server/actions/auth.ts`

- [ ] **Step 1: login/logout 재작성** (zod 검증 유지)

```ts
"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/server/supabase/server";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"), password: formData.get("password"),
  });
  if (!parsed.success) return { error: "이메일·비밀번호를 확인해 주세요." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "로그인에 실패했습니다." };
  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
```

## Task 2.5: admin 사용자 생성 액션

**Files:**
- Modify: `web/src/server/actions/admin.ts`

- [ ] **Step 1: createUser 재작성** (service-role + requireAdmin)

```ts
"use server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/current-user";
import { createSupabaseService } from "@/server/supabase/service";

const schema = z.object({
  email: z.string().email(), password: z.string().min(8),
  name: z.string().min(1), title: z.string().optional(),
  church: z.string().optional(), role: z.enum(["admin", "member"]),
});
export type CreateUserState = { error?: string; ok?: boolean };

export async function createUser(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "입력값을 확인해 주세요." };
  const { email, password, ...meta } = parsed.data;
  const supabase = createSupabaseService();
  const { error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: meta,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
```

## Task 2.6: 인증 e2e 검증

- [ ] **Step 1:** `pnpm dev` + `supabase start` 상태에서 Preview MCP로 `/login` 접속 → admin 로그인 → `/admin` 접근 허용 확인.
- [ ] **Step 2:** 로그아웃 → `/admin` 접근 시 `/login` 리다이렉트 확인.
- [ ] **Step 3:** member 로그인 → `/admin` 차단(`/`로) 확인, `/board` 허용 확인.
- [ ] **Step 4: Commit** (사용자 승인 후)

```bash
git add web/src/server/supabase web/src/lib/supabase web/src/server/auth/current-user.ts web/src/proxy.ts web/src/server/actions/auth.ts web/src/server/actions/admin.ts
git commit -m "feat: Supabase Auth 기반 인증·세션·가드 재구축"
```

**Phase 2 검증:** 로그인/로그아웃, `/admin`·`/board` 가드, role 분기가 로컬에서 동작.

---

# Phase 3 — 읽기 계층 재배선 ($0)

> 6개 서비스(board·committee·training·webzine·faculty·resource)를 supabase-js 읽기로 교체. **시그니처는 유지**, 내부 쿼리만 교체. 매퍼(`lib/<section>.ts`)의 `Row` 타입을 생성 타입으로 교체. 한 섹션을 완전 예시로 보이고, 나머지는 동일 패턴을 각 파일에 적용한다.

## Task 3.1: board 읽기 재배선 (완전 예시)

**Files:**
- Modify: `web/src/server/services/board.ts`
- Modify: `web/src/lib/board.ts` (Row 타입 교체)

- [ ] **Step 1: 매퍼 Row 타입을 생성 타입으로**

```ts
// web/src/lib/board.ts (발췌)
import type { Database } from "@/lib/database.types";
export type BoardRow = Database["public"]["Tables"]["posts"]["Row"];
// toFeedPost 등 매퍼 본문 로직은 유지(필드명 snake_case 대응만 조정)
```

- [ ] **Step 2: 서비스 쿼리를 supabase-js로**

```ts
// web/src/server/services/board.ts (발췌)
import "server-only";
import { createSupabaseServer } from "@/server/supabase/server";
import { toFeedPost, type BoardListData } from "@/lib/board";

export async function getBoardListData(): Promise<BoardListData> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("section", "board")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { posts: (data ?? []).map(toFeedPost) /* ...집계 */ };
}

export async function getBoardPost(id: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("posts").select("*").eq("id", id)
    .eq("section", "board").maybeSingle();
  return data ? toBoardDetail(data) : null;
}

export async function incrementBoardView(id: string) {
  const supabase = await createSupabaseServer();
  await supabase.rpc("increment_post_view", { p_id: id }); // 또는 update set view_count = view_count + 1
}
```

> `increment_post_view`가 필요하면 Phase 1 마이그레이션에 RPC 함수를 추가하거나, update 식으로 처리. 좋아요·조회수 등 집계 쿼리는 supabase-js의 `count`·`head` 옵션 또는 RPC로 옮긴다.

- [ ] **Step 3: 검증** — `pnpm dev` + Preview MCP로 `/board` 렌더 확인(디자인 불변, 시드 데이터 표시).

## Task 3.2 ~ 3.6: committee · training · webzine · faculty · resource 읽기 재배선

각 섹션에 Task 3.1과 **동일 패턴** 적용. 파일별 작업:

- [ ] **3.2 committee**: `server/services/committee.ts`(목록·상세·popular) + `lib/committee.ts` Row 타입. `section='committee'`.
- [ ] **3.3 training**: `server/services/training.ts` + `lib/training.ts`. `section='training'`.
- [ ] **3.4 webzine**: `server/services/webzine.ts` + `lib/webzine.ts`. `section='webzine'`. 파생(커버·읽기시간) 로직 유지.
- [ ] **3.5 faculty**: `server/services/faculty.ts` + `lib/faculty.ts`. `faculty` 테이블 조회(cover/members/depts 그룹). teaches는 jsonb 배열.
- [ ] **3.6 resource**: `server/services/resource.ts` + `lib/resource.ts`. `section='resource'` + attachments 조인.

각 Task 공통 step:
1. 매퍼 `Row` 타입을 `Database["public"]["Tables"]["..."]["Row"]`로 교체.
2. 서비스 쿼리를 supabase-js로 교체(시그니처 유지).
3. Preview MCP로 해당 공개 페이지 렌더·디자인 불변 검증.

- [ ] **Commit** (섹션 묶음 단위, 사용자 승인 후)

```bash
git commit -m "refactor: 읽기 서비스 6섹션을 supabase-js로 재배선"
```

**Phase 3 검증:** 6개 공개 페이지가 Supabase 데이터로 렌더, 디자인 불변(Preview MCP 스크린샷 대조).

---

# Phase 4 — 쓰기·CRUD·업로드 ($0)

> actions를 supabase-js + RLS로 재작성. 업로드를 Storage로 이전. RLS가 비권한 쓰기를 막으므로, 액션은 입력 검증 + 쿼리에 집중하고 권한은 RLS에 위임(+ requireAdmin 방어층).

## Task 4.1: 게시판 CRUD + 좋아요 + 댓글 (완전 예시)

**Files:**
- Modify: `web/src/server/actions/board.ts`, `web/src/server/actions/board-like.ts`, `web/src/server/actions/comments.ts`

- [ ] **Step 1: board createPost/updatePost/deletePost** — 작성자 author_id = 현재 사용자, supabase insert/update/delete. RLS가 작성자·admin만 허용.

```ts
"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { createSupabaseServer } from "@/server/supabase/server";

const schema = z.object({ title: z.string().min(1), category: z.string().optional(), body: z.string().min(1) });

export async function createPost(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "입력값을 확인해 주세요." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("posts").insert({
    section: "board", author_id: user.id, ...parsed.data,
  }).select("id").single();
  if (error) return { error: "저장에 실패했습니다." };
  redirect(`/board/${data.id}`);
}
```

- [ ] **Step 2: toggleLike** — insert/delete on post_likes(user_id=auth.uid()), RLS가 본인만 허용. 멱등 토글.
- [ ] **Step 3: addComment/deleteComment** — author_id=현재 사용자. SECTION_PATH redirect 유지.
- [ ] **Step 4: 검증** — Preview MCP로 회원 로그인 → 글 작성/수정/삭제, 좋아요 토글, 댓글 작성/삭제. RLS 차단(타인 글 수정 시도 실패) 확인.

## Task 4.2 ~ 4.4: admin 전용 CRUD (committee · training · webzine · resource · faculty)

각 섹션 `server/actions/<section>.ts`를 supabase-js로 재작성. `requireAdmin()` 방어층 유지 + RLS admin 정책. zod 검증 유지.

- [ ] **4.2 committee/training**: create/update/deletePost(section 지정) + 첨부 삭제 훅(Storage object 삭제).
- [ ] **4.3 webzine**: create/update/deletePost(첨부 없음).
- [ ] **4.4 resource + faculty**: resource(create/update/delete + 첨부), faculty(createFaculty/updateFaculty/deleteFaculty, teaches 배열).

## Task 4.5: 파일 업로드 → Supabase Storage

**Files:**
- Modify: `web/src/server/uploads/core.ts`
- Modify: `web/src/server/uploads/{committee,training,resource}.ts`
- Modify: `web/src/app/api/{committee,training,resources}/[postId]/uploads/route.ts`
- Create: 다운로드 서명 URL 발급 헬퍼

- [ ] **Step 1: core.ts 저장 로직 교체** — 로컬 디스크 쓰기 제거, Storage put으로. MIME 검사(file-type)·확장자 화이트리스트·용량 제한·파일명 재생성은 유지.

```ts
// 발췌: 검증 통과 후
const path = `${section}/${postId}/${storedName}`;
const supabase = createSupabaseService(); // 또는 사용자 세션(admin)
const { error } = await supabase.storage.from("attachments")
  .upload(path, fileBuffer, { contentType: mime, upsert: false });
// attachments 테이블에 stored_path = path 기록
```

- [ ] **Step 2: 다운로드** — `attachments.stored_path`로 `supabase.storage.from('attachments').createSignedUrl(path, ttl)` 발급해 제공.
- [ ] **Step 3: 검증** — Preview MCP로 admin 첨부 업로드 → Storage 적재 확인 → 다운로드(서명 URL) 동작. 비권한 업로드 차단.

- [ ] **Commit** (사용자 승인 후)

```bash
git commit -m "feat: 쓰기 CRUD·댓글·좋아요·업로드를 Supabase(RLS·Storage)로 재작성"
```

**Phase 4 검증:** 전 섹션 CRUD·댓글·좋아요·업로드/다운로드 동작, RLS가 비권한 쓰기 차단.

---

# Phase 5 — 배포·정리 (★유일한 유료 단계)

> 여기서 비로소 **Supabase Pro 결제 → 클라우드 프로젝트 생성**. Phase 0~4는 결제 $0.

## Task 5.1: 클라우드 Supabase Pro 프로젝트 생성·연결

- [ ] **Step 1:** Supabase 대시보드에서 **Pro 조직/프로젝트 생성**(결제 시작). 리전 선택(서울).
- [ ] **Step 2:** 공개 가입 비활성화(Auth settings). 커스텀 액세스 토큰 훅 활성화 확인.
- [ ] **Step 3:** CLI 연결

```bash
npx supabase login
npx supabase link --project-ref <ref>
```

## Task 5.2: 운영 DB 마이그레이션·시드

- [ ] **Step 1:** `npx supabase db push` — 운영에 마이그레이션 반영.
- [ ] **Step 2:** 운영 env로 `seed-supabase.mjs` 실행해 admin 계정 생성(비밀번호는 운영용으로 교체). 콘텐츠 시드는 선택(실데이터 입력 가능).
- [ ] **Step 3:** Studio에서 RLS·훅·버킷 확인.

## Task 5.3: Vercel 연결·배포

- [ ] **Step 1:** Vercel에 저장소 연결, Root Directory `web`, 프레임워크 Next.js.
- [ ] **Step 2:** 환경변수 설정 — `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`·`SUPABASE_SERVICE_ROLE_KEY`(운영 클라우드 키).
- [ ] **Step 3:** 배포 트리거 → 빌드 성공 확인. 프로덕션 URL 스모크.
- [ ] **Step 4:** 도메인 연결·TLS(Vercel 자동).

## Task 5.4: 구 인프라·코드 자산 제거

**Files (삭제):**
- `docker-compose.yml`, `web/Dockerfile`, `deploy/Caddyfile`
- `web/drizzle.config.ts`, `web/src/server/db/**`(Drizzle 스키마·migrations·index)
- `web/src/server/auth/session.ts`, `web/src/server/auth/password.ts`
- `web/scripts/{dev-db,migrate,seed-admin,verify-migrate,verify-db,verify-board,verify-committee,verify-training,verify-webzine,verify-faculty,verify-resource,verify-uploads}.mjs`

- [ ] **Step 1:** 위 파일 삭제, `package.json`의 관련 scripts(`deploy:verify` 등) 정리.
- [ ] **Step 2:** `deploy/README.md`를 Vercel + Supabase 런북으로 재작성.
- [ ] **Step 3:** `pnpm build` + `pnpm lint` 통과 확인(잔존 import 없음).

- [ ] **Commit** (사용자 승인 후)

```bash
git commit -m "chore: Oracle·Docker·Drizzle 자산 제거 및 배포 런북 갱신"
```

## Task 5.5: 운영 스모크 테스트

- [ ] 프로덕션에서 공개 페이지 6섹션 렌더, admin 로그인·CRUD·업로드, member 로그인·게시판, 비권한 차단 확인.

**Phase 5 검증:** Vercel 프로덕션에서 전체 기능 동작, 운영 Supabase 마이그레이션·RLS 반영, 결제는 이 단계부터 시작.

---

## Self-Review 메모

- **Spec 커버리지**: 설계 5장 RLS 정책표 → Task 1.3, 6장 Storage → 1.4/4.5, 7장 인증 → Phase 2, 8장 마이그레이션 → 1.x, 9장 로컬 → 0.2/1.6, 10장 배포 → 5.x. 전부 매핑됨.
- **열린 질문 처리**: 액세스 토큰 훅(1.2), 섹션 의존 posts RLS(1.3), 서명 URL(4.5), 로컬 auth 시드 멱등(1.6), Server Action+RLS 쿠키(2.1 setAll try/catch), 데이터 이행(운영 데이터 없음 → 부담 0).
- **반복 패턴**: Phase 3/4의 6섹션은 한 섹션을 완전 예시로 제시하고 동일 패턴을 파일별로 적용(기존 PR들에서 검증된 매퍼·서비스·액션 구조와 1:1 대응).
- **검증 우선**: Phase 0~4 전부 무료 로컬 스택 + Preview MCP로 검증 후 Phase 5 유료 배포.
