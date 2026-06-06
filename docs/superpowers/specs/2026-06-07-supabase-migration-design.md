# Supabase 전면 전환 설계 (Oracle VM → Supabase + Vercel)

> **상태**: 설계 승인 대기 → 검토 후 `writing-plans`로 단계별 plan 작성 예정
> **작성일**: 2026-06-07
> **대체 문서**: `docs/superpowers/plans/2026-05-30-oracle-nextjs-fullstack.md`(Oracle VM 전제)의 배포·인증·데이터 계층 결정을 무효화한다.

---

## 1. 배경 (왜 바꾸는가)

기존 배포 타깃은 **Oracle Cloud Always Free ARM VM 1대 + Docker Compose(web·postgres·caddy)**, 인증은 **커스텀 세션(jose JWT + argon2)**, 데이터는 **Drizzle ORM**이었다. 콘텐츠 6개 섹션 + 교수 디렉터리까지 이 구조로 구현·머지 완료된 상태다(PR #26~31).

그러나 **Oracle ARM VM 프로비저닝이 막혔다**(OCI ARM 용량 부족·계정 인증 등). VM 자체를 확보하지 못하면 이 배포 경로 전체가 진행 불가다. 따라서 **VM 의존을 버리고 관리형(managed) 조합으로 전환**한다.

### 확정된 결정 (사용자 승인 완료)

| 항목 | 결정 |
|------|------|
| 앱 호스팅 | **Vercel** (Next.js 네이티브, 비영리 Hobby 무료) |
| DB·인증·스토리지 | **Supabase** (Pro 플랜, 월 $25) |
| 데이터 접근 | **supabase-js + RLS** (Drizzle 폐기, RLS가 1차 보안 경계) |
| 인증 | **Supabase Auth** (`@supabase/ssr` 쿠키 세션. 커스텀 jose/argon2 폐기) |
| 파일 저장 | **Supabase Storage** (로컬 디스크 폐기) |
| 마이그레이션 | **Supabase CLI** (`supabase/migrations`, drizzle-kit 폐기) |
| 로컬 개발 | **Supabase 로컬 스택**(`supabase start`, 로컬 Docker) |
| 비용 전제 | 헌법의 "무료 운영" → "**저비용 운영(월 $25)**"으로 갱신 |

> 비용 트레이드오프: 월 $25 + 백엔드 plumbing 재작성 공수를 감수하는 대가로 **VM 운영(프로비저닝·OS 패치·백업·TLS·방화벽) 부담이 사라진다.** Supabase 무료 티어는 미접속 시 일시정지되어 상시 공개 사이트에 부적합하므로 Pro를 택했다.

### 1.1 결제 지연 전략 (확정)

유료 결제 시점을 **최대한 마지막으로 늦춘다**. 핵심은 **로컬 스택은 무료, 클라우드 Pro만 유료**라는 점이다.

| | 로컬 스택 (`supabase start`) | 클라우드 Pro 프로젝트 |
|---|---|---|
| 정체 | 내 PC의 Docker 컨테이너(Postgres·Auth·Storage·Studio) | Supabase 호스팅 운영 인스턴스 |
| 비용 | **$0** (계정·로그인·결제 불필요) | **$25/월** |
| 결제 시작 | 안 함 | **프로젝트 생성·연결하는 순간** |

따라서 **Phase 0~4(모든 소스코드 작업 + 검증)는 무료 로컬 스택으로 전부 진행**하고($0), **Phase 5에서 비로소 Pro 결제 → 클라우드 연결 → Vercel 배포**한다. 코드는 무료 로컬 스택에서 미리 검증(RLS·인증·업로드 e2e)해 두므로, 유료 클라우드에서는 첫 실행이 곧 검증된 코드의 배포가 된다(무검증 위험 없음). 사용자 결정: **무료 로컬 스택으로 검증, 클라우드는 맨 마지막에만 연결.**

---

## 2. 목표 아키텍처

```
                         ┌─────────────────────────────┐
   브라우저  ──HTTPS──▶   │  Vercel (Next.js 16 앱)      │
                         │  - Server Component (읽기)   │
                         │  - Server Action (쓰기)      │
                         │  - proxy.ts (세션 갱신·가드) │
                         └───────┬───────────┬─────────┘
                                 │           │
                @supabase/ssr    │           │  service-role 클라이언트
                (사용자 세션·RLS 적용)        │  (admin 전용·server-only)
                                 ▼           ▼
                      ┌──────────────────────────────────┐
                      │  Supabase (Pro 프로젝트)          │
                      │  - Auth (auth.users)              │
                      │  - Postgres (public 스키마 + RLS) │
                      │  - Storage (attachments 버킷)     │
                      └──────────────────────────────────┘

로컬: `supabase start` = 위 스택을 로컬 Docker로 그대로 재현(Studio·API·DB)
```

### 보안 모델의 전환 (핵심)

- **기존**: Server Action 진입부의 `requireAdmin()`이 유일한 경계.
- **신규**: **RLS(Row Level Security) 정책이 DB 차원의 1차 경계**가 된다. supabase-js는 쿠키의 사용자 세션으로 쿼리하므로, 각 행 접근에 정책이 자동 적용된다.
  - 공개 콘텐츠: 누구나 `SELECT`(게시 상태 한정).
  - 쓰기·관리: `admin` 역할 또는 작성자 본인만.
  - 서버 측 역할 재확인(`requireAdmin` 류)은 **방어층(defense-in-depth)으로 일부 유지**하되, 진실의 원천은 RLS다.
- **역할(role) 전달**: `public.profiles.role`을 진실의 원천으로 두고, **Supabase Auth 커스텀 액세스 토큰 훅**으로 JWT에 `user_role` 클레임을 심어, (a) RLS 정책이 테이블 재조회 없이 역할을 읽고, (b) `proxy.ts`가 엣지에서 DB 없이 `/admin` 가드를 수행한다. (훅 미사용 시 대안: `SECURITY DEFINER` 헬퍼 함수로 RLS 재귀 회피 — 8장 참조)

---

## 3. 무엇이 유지·교체·폐기되는가 (인벤토리 기반)

조사한 현재 코드 인벤토리를 기준으로 한 운명표다.

### ✅ 유지 (거의 손대지 않음)
- **디자인 이식 UI 전체** — `web/src/app/**`의 클라이언트 컴포넌트. props만 받으므로 불변(헌법 [7] 디자인 100% 보존).
- **디자인 타입** — `lib/*-data.ts`(board-data, committee-data, training-data, webzine-data, faculty-data, resources-data). 순수 타입.
- **zod 검증 스키마** — actions 내부 입력 검증. 언어 중립적이라 재사용.

### 🔶 부분 유지 (시그니처 유지, 내부 교체)
- **뷰모델 매퍼** — `lib/{board,committee,training,webzine,faculty,resource,comments}.ts`. 순수 함수라 로직은 유지하되, 입력 `Row` 타입을 **Supabase 생성 타입**(`database.types.ts`)으로 교체.
- **서비스 함수 시그니처** — `getBoardListData()` 등 export 시그니처는 유지, 내부 Drizzle 쿼리 → supabase-js 쿼리로 교체.
- **액션 진입점** — `createPost`/`updatePost`/`deletePost`/`addComment`/`toggleLike`/`createFaculty` 등 시그니처·zod 검증 유지, 내부 데이터·권한 처리 교체.
- **`server/uploads/core.ts`** — MIME 검사(file-type)·파일명 재생성 로직 유지, 저장 대상만 로컬 디스크 → Supabase Storage.

### 🔁 재작성
- **`server/db/index.ts`**(Drizzle 싱글톤) → `server/supabase/{server,service,client}.ts`(supabase-js 클라이언트 팩토리).
- **`server/db/schema/*`**(7 테이블·enum) → `supabase/migrations/*.sql`(테이블 + enum + **profiles** + **RLS 정책** + 헬퍼 함수 + 트리거 + 버킷).
- **`server/services/*`**(6 + faculty) → supabase-js 읽기 쿼리.
- **`server/actions/*`**(board·committee·training·webzine·resource·faculty·comments·board-like·auth·admin) → supabase-js + RLS 의존.
- **`server/auth/current-user.ts`** → Supabase 세션에서 사용자·역할 조회.
- **`proxy.ts`** → `@supabase/ssr` 세션 갱신 미들웨어 + `/admin`·`/board` 가드.
- **업로드 Route Handler 3종**(`api/{committee,training,resources}/[postId]/uploads/route.ts`) → Storage 업로드.

### ❌ 폐기
- `server/auth/session.ts`(jose), `server/auth/password.ts`(argon2).
- `server/db/migrations/*`(drizzle 생성 SQL 4개), `drizzle.config.ts`.
- `web/scripts/*` 대부분: `dev-db.mjs`·`migrate.mjs`·`seed-admin.mjs`·`verify-migrate.mjs`·`verify-{db,board,committee,training,webzine,faculty,resource,uploads}.mjs`. (검증은 로컬 Supabase 대상 테스트로 대체)
- 인프라: `docker-compose.yml`·`web/Dockerfile`·`deploy/Caddyfile`·`deploy/README.md`(Vercel 런북으로 재작성).
- `next.config.ts`의 `output: 'standalone'`(Vercel 불필요).
- 의존성 제거: `drizzle-orm`·`drizzle-kit`·`postgres`·`jose`·`@node-rs/argon2`·`@electric-sql/pglite`·`@electric-sql/pglite-socket`.
- 의존성 추가: `@supabase/supabase-js`·`@supabase/ssr`. (Supabase CLI는 `npx supabase` 또는 brew)
- `zod`·`file-type`·`server-only`는 **유지**.

---

## 4. 데이터베이스 스키마 (Supabase)

기존 7개 테이블을 그대로 옮기되, **`users` 테이블을 `auth.users` + `public.profiles`로 분해**한다.

### 4.1 인증·프로필
- `auth.users` — Supabase Auth가 관리(이메일·비밀번호·세션). 우리가 직접 만들지 않음.
- `public.profiles`
  - `id uuid PK references auth.users(id) on delete cascade`
  - `name text not null`, `title text`, `church text`
  - `role` enum `user_role`(`admin` | `member`) not null default `member`
  - `created_at`·`updated_at timestamptz`
  - 신규 가입 시 프로필 자동 생성 트리거 `on auth.users insert → handle_new_user()` (user_metadata의 name·title·church·role 복사).

> 기존 enum 이름은 `userRole`(admin|member)이었다. Postgres enum으로 `user_role`(admin|member) 유지.

### 4.2 콘텐츠 (기존 유지, `author_id`만 재배선)
- `posts` — section enum(`notice|board|committee|training|webzine|resource`), category·title·excerpt·body·`author_id uuid references profiles(id)`·is_published·view_count·is_pinned·event_date·meta·타임스탬프.
- `attachments` — post_id·original_name·**stored_path**(Storage 경로로 의미 변경)·mime·size_bytes.
- `comments` — post_id·`author_id`·body. (post_id·created_at 인덱스 유지)
- `post_likes` — post_id·user_id·unique(post_id,user_id).
- `faculty` — 독립 테이블(dept·tone enum, teaches 배열, is_cover 등) 그대로.

### 4.3 enum
`post_section`, `faculty_dept`, `faculty_tone`, `user_role` — 기존 정의 그대로 이관.

---

## 5. RLS 정책 설계

모든 `public` 테이블에 RLS 활성화. 역할 판정은 JWT 클레임 `user_role`(또는 `SECURITY DEFINER` 헬퍼 `auth_is_admin()`)을 사용.

| 테이블 | SELECT | INSERT | UPDATE / DELETE |
|--------|--------|--------|------------------|
| **profiles** | 본인 + admin 전체 | 트리거/서비스롤 | 본인(제한 필드) / admin |
| **posts** | `is_published` 공개 + 작성자 본인 + admin | `section='board' AND auth.uid() IS NOT NULL` **또는** admin | `(section='board' AND author_id=auth.uid())` 또는 admin |
| **comments** | 부모 글이 보이면 | 로그인 사용자 | 작성자 본인 또는 admin |
| **post_likes** | 누구나(카운트용) | 본인(`user_id=auth.uid()`) | 본인 |
| **attachments** | 부모 글이 보이면 | admin | admin |
| **faculty** | 누구나(공개) | admin | admin |

> 섹션 의존 쓰기 정책(게시판=회원 허용, 나머지=admin 전용)이 핵심 난이도. posts insert/update에 section 분기를 명시한다.

---

## 6. 파일 저장 (Supabase Storage)

- **버킷**: `attachments`(비공개). 경로 네임스페이스 `{section}/{postId}/{storedName}`.
- **읽기**: 공개 다운로드가 필요한 자료(교육위원회·수련회·자료공유 첨부)는 **서명 URL(signed URL)** 발급으로 제공. (공개 버킷 대신 서명 URL로 접근 제어 유지)
- **쓰기**: admin만. 업로드 전에 기존 `core.ts`의 **확장자 화이트리스트·실 MIME 검사(file-type)·용량 제한·파일명 재생성**을 그대로 적용한 뒤 Storage에 put. 메타데이터는 `attachments` 테이블에 기록.
- 버킷 RLS 정책도 `admin` 쓰기로 설정.

---

## 7. 인증 흐름 (Supabase Auth + @supabase/ssr)

- **클라이언트 팩토리 3종**(`server/supabase/`):
  1. `server.ts` — `createServerClient`(쿠키 read/write). Server Component·Action에서 사용자 세션으로 쿼리.
  2. `client.ts` — 브라우저 클라이언트(필요한 클라이언트 컴포넌트 한정).
  3. `service.ts` — `service_role` 키 클라이언트(**server-only**). admin 사용자 생성 등 RLS 우회 특권 작업 전용. 절대 클라이언트 번들 유입 금지.
- **로그인**(`actions/auth.ts`): `supabase.auth.signInWithPassword({email,password})` → 세션 쿠키 자동 설정. zod 입력 검증 유지.
- **로그아웃**: `supabase.auth.signOut()`.
- **현재 사용자**(`current-user.ts` 재작성): `supabase.auth.getUser()` + `profiles` 조회로 `{ id, role, name, ... }` 반환. `requireAdmin()`은 role 확인 후 미달 시 redirect(방어층).
- **admin 전용 가입**(`actions/admin.ts`): Supabase 대시보드에서 **공개 가입 비활성화**. admin이 `service.ts` 클라이언트로 `auth.admin.createUser({ email, password, email_confirm:true, user_metadata:{name,title,church,role} })` 호출 → 트리거가 profiles 생성. 비밀번호 해시는 Supabase가 처리(argon2/bcrypt 내장).
- **proxy.ts**: `@supabase/ssr` 권장 패턴으로 매 요청 세션 토큰 갱신 + `/admin/**`(role=admin)·`/board/**`(로그인) 가드, 미인증 시 `/login?next=` 리다이렉트. JWT의 `user_role` 클레임으로 엣지 DB 호출 없이 판정.

---

## 8. 마이그레이션 전략 (Supabase CLI)

- `supabase init` → `supabase/`(config.toml·migrations·seed.sql).
- 스키마는 **단일 소유권을 Supabase 마이그레이션에 둔다**(Drizzle·Supabase MCP 이중 관리 금지).
- 초기 마이그레이션에 포함: enum 4종 + 테이블 6종 + profiles + 인덱스 + RLS 정책 + 헬퍼 함수(`auth_is_admin()` 등) + `handle_new_user` 트리거 + 커스텀 액세스 토큰 훅 등록 + Storage 버킷·정책.
- 적용: 로컬은 `supabase start`/`supabase db reset`이 자동 적용, 운영은 `supabase db push`.
- **타입 생성**: `supabase gen types typescript --local > web/src/lib/database.types.ts`. 매퍼·서비스·액션은 이 타입을 import.

> **RLS 재귀 주의**: profiles 기반 admin 판정을 profiles 정책 안에서 직접 조회하면 무한 재귀. → 커스텀 클레임(권장) 또는 `SECURITY DEFINER` 함수 `auth_is_admin()`로 우회.

---

## 9. 로컬 개발

- `supabase start` → 로컬 스택 기동(Studio `:54323`, API `:54321`, DB `:54322`). 로컬 Docker 필요(운영 Docker 부담과는 별개).
- **시드**: 콘텐츠는 `supabase/seed.sql`(`supabase db reset` 시 자동). **auth 사용자**(admin@…, member@…)는 SQL 시드가 까다로우므로 **로컬 service-role 키로 `auth.admin.createUser`를 호출하는 시드 스크립트**(`scripts/seed-supabase.mjs`)로 생성 후, 트리거가 profiles를 채운다.
- 기존 `dev-db.mjs`(PGlite) 워크플로는 폐기.
- `.env.local`에 로컬 Supabase 키(`supabase status` 출력)를 채운다.

---

## 10. 배포 (Vercel)

- Vercel에 GitHub 저장소 연결, 프레임워크 프리셋 Next.js, **Root Directory = `web`**.
- 환경변수(Vercel Project Settings):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(클라이언트 노출 허용)
  - `SUPABASE_SERVICE_ROLE_KEY`(server-only)
- 스키마 반영은 배포와 분리: `supabase db push`(수동 또는 CI)로 운영 DB 마이그레이션.
- 도메인 연결·TLS는 Vercel이 자동 처리(Caddy 불필요).
- `push → 자동 빌드·배포`. 프리뷰 배포는 Vercel이 PR마다 제공.

### 환경변수 정리
| 변수 | 위치 | 비고 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라/서버 | 공개 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라/서버 | 공개(RLS가 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | admin 작업·시드. 절대 노출 금지 |
| ~~`DATABASE_URL`·`JWT_SECRET`·`SEED_ADMIN_*`~~ | 제거 | 폐기 |

---

## 11. 단계별 로드맵 (plan에서 상세화)

- **Phase 0 — 문서·셋업**: CLAUDE.md(스택·통신규약·보안·배포·"무료→저비용") 재작성, `supabase init`, deps 교체(추가/제거), env 구조 확립, Vercel 프로젝트 생성.
- **Phase 1 — 스키마·RLS·인증 기반**: 초기 Supabase 마이그레이션(테이블·enum·profiles·RLS·헬퍼·트리거·액세스 토큰 훅·Storage 버킷). 타입 생성. seed.sql + auth 시드 스크립트. `supabase start`로 검증.
- **Phase 2 — 인증 재구축**: supabase 클라이언트 팩토리 3종, `current-user` 재구현, `proxy.ts` 재작성, login/logout/createUser 액션. 로그인·가드 e2e.
- **Phase 3 — 읽기 계층 재배선**: services 6섹션 + faculty를 supabase-js로 재작성, 매퍼 Row 타입 교체. 섹션별로 분리 진행·검증.
- **Phase 4 — 쓰기·CRUD·업로드**: actions 재작성(RLS 의존), 업로드 3종을 Storage로. admin CRUD·댓글·좋아요 e2e.
- **Phase 5 — 배포·정리 (★유일한 유료 단계)**: **이 시점에 비로소 Supabase Pro 결제 → 클라우드 프로젝트 생성**(`supabase login`·`link`). `supabase db push`로 운영 DB에 마이그레이션 반영, auth 시드. Vercel 연결·env(클라우드 키)·도메인. Docker/Caddy/Oracle/Drizzle/스크립트 자산 제거. 운영 스모크 테스트. **Phase 0~4까지는 결제 없음($0).**

각 Phase 끝에 동작 확인 방법을 제시(헌법 [7]).

---

## 12. 리스크·열린 질문

1. **커스텀 액세스 토큰 훅** 구성(Pro 기능) — `user_role` 클레임 주입. 미사용 시 `SECURITY DEFINER` 헬퍼로 폴백(설계상 양쪽 다 가능).
2. **섹션 의존 posts 쓰기 RLS** — 게시판=회원, 그 외=admin 분기를 정책으로 정확히 표현해야 함(테스트 필수).
3. **첨부 공개 방식** — 서명 URL(권장) vs 공개 버킷. 서명 URL 만료·캐싱 정책 결정 필요.
4. **로컬 auth 시드** — `auth.admin.createUser` 스크립트의 멱등성.
5. **Server Action + RLS 쿠키 배선** — `@supabase/ssr` 서버 클라이언트가 Action 컨텍스트에서 쿠키를 올바로 read/write하는지 검증.
6. **데이터 이행** — 현재 운영 데이터는 없음(개발 단계). 기존 머지된 백엔드는 교체 대상이므로 데이터 마이그레이션 부담 없음.

---

## 13. 검증 (Verification)

- **Phase 0**: `pnpm install` 통과, `supabase start` 정상 기동, `pnpm build` 통과.
- **Phase 1**: `supabase db reset`으로 마이그레이션·시드 적용, Studio에서 테이블·RLS·버킷 확인, 타입 생성물 컴파일 통과.
- **Phase 2**: 로컬에서 admin/member 로그인 → 세션 쿠키 발급, `/admin` 미인증 차단, role 가드 동작.
- **Phase 3**: 각 공개 페이지가 Supabase 데이터로 렌더(디자인 불변 확인 — Preview MCP).
- **Phase 4**: admin CRUD·파일 업로드(Storage 적재·서명 URL 다운로드)·댓글·좋아요 동작, RLS가 비권한 쓰기를 차단.
- **Phase 5**: Vercel 프리뷰/프로덕션에서 전체 스모크, 운영 Supabase 마이그레이션 반영 확인.

> Next.js 16 변경점(proxy·Server Action 시그니처)·`@supabase/ssr` 최신 패턴은 구현 직전 `web/AGENTS.md`와 각 라이브러리 공식 가이드를 확인한다.
