# 소셜 로그인(Google·Kakao) 구현 plan — PR 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일반 회원이 Google·Kakao로 가입·로그인할 수 있게 하고, 가입 시 항상 member 프로필이 자동 생성되게 한다.

**Architecture:** Server Action(`signInWithProvider`)이 `signInWithOAuth`로 공급자 URL을 받아 `redirect()` → 공급자 인증 후 `/auth/callback`이 `exchangeCodeForSession`으로 세션 발급 → `next`(기본 `/main`) 이동. 프로필은 기존 `handle_new_user` 트리거가 생성하되 OAuth 메타데이터에서 이름 도출을 보강. 권한은 트리거가 항상 `member`로 강제.

**Tech Stack:** Next.js 16 App Router(Route Handler·Server Action), `@supabase/ssr`, Supabase Auth OAuth(PKCE), Postgres 트리거, CSS Modules.

## Global Constraints

- 모든 사용자 응답·문서·커밋 본문·주석·UI 텍스트는 **한국어**, 코드 식별자는 영어.
- 커밋: Conventional Commits prefix + 한국어 본문, 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- 검증은 **테스트 러너 없음** → `npx tsc --noEmit` · `pnpm lint` · `pnpm build` + 타깃 로컬 확인.
- 로컬 Supabase만 사용(시크릿 하드코딩 금지). 실제 Google·Kakao 왕복은 운영 공급자 설정 후 스모크(로컬 e2e 범위 밖).
- 권한 상승 차단: 소셜 가입 role은 트리거가 항상 `member`. 공급자는 `{google, kakao}` 화이트리스트.
- 기존 패턴 준수: 서버 액션은 `server/actions/auth.ts`, supabase 서버 클라이언트는 `@/server/supabase/server`, 안전 리다이렉트는 `@/lib/safe-redirect`의 `safeNext(raw, fallback)`.

---

## File Structure

- `supabase/migrations/<new>_oauth_profile_name.sql` (Create) — `handle_new_user` 트리거 이름 도출 보강.
- `src/app/auth/callback/route.ts` (Create) — OAuth code→세션 교환 Route Handler.
- `src/server/actions/auth.ts` (Modify) — `signInWithProvider` 액션 추가.
- `src/app/(public)/_components/auth/KakaoMark.tsx` (Create) — Kakao 말풍선 로고.
- `src/app/(public)/_components/auth/auth.module.css` (Modify) — `.oauthKakao` 스타일.
- `src/app/(public)/login/LoginForm.tsx` (Modify) — Google 버튼 활성화 + Kakao 버튼(서버 액션 폼).
- `src/app/(public)/signup/SignupForm.tsx` (Modify) — 동일 소셜 버튼 블록.
- `supabase/config.toml` (Modify) — `[auth.external.google|kakao]` 블록.
- `deploy/` 런북(해당 파일) (Modify) — 공급자 등록 절차 문서.

---

### Task 1: handle_new_user 트리거 — OAuth 이름 도출 보강

**Files:**
- Create: `supabase/migrations/<timestamp>_oauth_profile_name.sql`

**Interfaces:**
- Produces: `auth.users` INSERT 시 `public.profiles(id, name, title, church, role='member')` 자동 생성. `name`은 `name → full_name → nickname → user_name → 이메일 local-part → '회원'` 순으로 도출.

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `npx supabase migration new oauth_profile_name`
(생성된 파일 경로를 확인한다.)

- [ ] **Step 2: 트리거 함수 재정의 작성**

생성된 SQL 파일에 작성(기존 함수 `create or replace`로 덮어쓰기 — role·보안 속성은 그대로 유지, 이름 도출만 보강):

```sql
-- OAuth(Google·Kakao) 가입 시 메타데이터 키가 달라 이름이 비는 문제를 보강한다.
-- 우선순위: name → full_name → nickname(Kakao) → user_name → 이메일 local-part → '회원'.
-- role은 어떤 메타데이터도 신뢰하지 않고 항상 'member'(기존 정책 유지).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, title, church, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'nickname', ''),
      nullif(new.raw_user_meta_data->>'user_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '회원'
    ),
    new.raw_user_meta_data->>'title',
    new.raw_user_meta_data->>'church',
    'member'
  );
  return new;
end;
$$;
```

- [ ] **Step 3: 로컬 DB 재적용**

Run: `npx supabase db reset`
Expected: 마이그레이션·시드가 오류 없이 끝난다(`Applying migration ... oauth_profile_name.sql`).

- [ ] **Step 4: OAuth 메타데이터 시뮬레이션으로 검증**

Run (DB 컨테이너에서 직접 — `name` 없이 `full_name`만 있는 OAuth 가입을 모사):
```bash
docker exec -i supabase_db_pedantic-gates-aba33a psql -U postgres -d postgres -c "
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        'oauthtest@example.com', '{\"full_name\":\"홍길동\"}'::jsonb, now(), now());
select p.name, p.role from public.profiles p
  join auth.users u on u.id = p.id where u.email='oauthtest@example.com';"
```
Expected: `홍길동 | member` 한 행. (이름이 `full_name`에서 도출되고 role=member)

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations
git commit -m "feat: handle_new_user 트리거 OAuth 이름 도출 보강

소셜 가입 메타데이터(full_name·nickname 등)에서 이름을 도출하도록 보강.
role은 항상 member 유지(권한 상승 차단).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: /auth/callback Route Handler

**Files:**
- Create: `src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: 쿼리 `code`(공급자가 부여), `next`(안전 경로). `createSupabaseServer()`, `safeNext(raw, fallback)`.
- Produces: 세션 쿠키 발급 후 `next`(기본 `/main`)로 302. 실패 시 `/login?notice=...`.

- [ ] **Step 1: 라우트 작성**

```ts
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/server/supabase/server";
import { safeNext } from "@/lib/safe-redirect";

// OAuth 공급자 인증 후 돌아오는 콜백. code를 세션으로 교환(PKCE 쿠키 사용)하고
// 안전한 next(기본 /main)로 이동한다. 실패 시 로그인 화면에 안내를 띄운다.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next") ?? "", "/main");
  const fail = (msg: string) =>
    NextResponse.redirect(
      new URL(`/login?notice=${encodeURIComponent(msg)}`, url.origin),
    );

  if (!code) return fail("로그인을 완료하지 못했습니다. 다시 시도해주세요.");

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("로그인을 완료하지 못했습니다. 다시 시도해주세요.");

  return NextResponse.redirect(new URL(next, url.origin));
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 오류 없음.

- [ ] **Step 3: 라우트 등록 확인(빌드 매니페스트)**

Run: `pnpm build 2>&1 | grep -E "auth/callback"`
Expected: `/auth/callback` 라우트가 출력에 포함.

- [ ] **Step 4: 커밋**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat: OAuth 콜백 라우트(/auth/callback) 추가

code를 세션으로 교환 후 안전한 next(기본 /main)로 이동, 실패 시 로그인 안내.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: signInWithProvider 서버 액션

**Files:**
- Modify: `src/server/actions/auth.ts`

**Interfaces:**
- Consumes: `formData`의 `provider`·`next`. `headers()`(origin 산출), `signInWithOAuth`, `safeNext`.
- Produces: `signInWithProvider(formData: FormData): Promise<void>` — 폼 액션. 성공 시 공급자 URL로 `redirect()`, 실패/비허용 provider는 `/login?notice=...`.

- [ ] **Step 1: import에 headers 추가**

`src/server/actions/auth.ts` 상단 import 블록에 추가:

```ts
import { headers } from "next/headers";
```

- [ ] **Step 2: 액션 추가**

파일 끝에 추가:

```ts
const ALLOWED_PROVIDERS = ["google", "kakao"] as const;
type OAuthProvider = (typeof ALLOWED_PROVIDERS)[number];

// 소셜 로그인 시작 — 폼 액션. provider 화이트리스트 검증 후 공급자 인증 URL로 보낸다.
// redirectTo는 현재 요청 origin 기준 /auth/callback(+next). 콜백이 세션을 발급한다.
export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "");
  const fail = (msg: string) =>
    redirect(`/login?notice=${encodeURIComponent(msg)}`);

  if (!ALLOWED_PROVIDERS.includes(provider as OAuthProvider)) {
    fail("지원하지 않는 로그인 방식입니다.");
  }

  const next = safeNext(String(formData.get("next") ?? ""), "/main");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "127.0.0.1:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const redirectTo = `${proto}://${host}/auth/callback?next=${encodeURIComponent(next)}`;

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: { redirectTo },
  });

  if (error || !data.url) {
    fail("로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  redirect(data!.url);
}
```

(`redirect()`는 내부적으로 throw하므로 `fail()` 이후 코드는 실행되지 않는다. `data!`는 그 직전 분기에서 `!data.url`을 걸러냈으므로 안전.)

- [ ] **Step 3: 타입체크·린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 오류 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/server/actions/auth.ts
git commit -m "feat: 소셜 로그인 시작 서버 액션(signInWithProvider) 추가

provider 화이트리스트(google·kakao) 검증 후 공급자 URL로 리다이렉트.
redirectTo는 요청 origin 기준 /auth/callback(+next).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 로그인·가입 화면 소셜 버튼

**Files:**
- Create: `src/app/(public)/_components/auth/KakaoMark.tsx`
- Modify: `src/app/(public)/_components/auth/auth.module.css`
- Modify: `src/app/(public)/login/LoginForm.tsx`
- Modify: `src/app/(public)/signup/SignupForm.tsx`

**Interfaces:**
- Consumes: `signInWithProvider`(Task 3), 기존 `.oauth` 스타일.
- Produces: 두 화면에 Google·Kakao 버튼(각각 `<form action={signInWithProvider}>` + hidden `provider`/`next`).

- [ ] **Step 1: KakaoMark 작성**

```tsx
// 카카오 말풍선 로고(단색). 버튼 텍스트 색에 맞춰 currentColor 사용.
export default function KakaoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 2C4.86 2 1.5 4.64 1.5 7.9c0 2.1 1.4 3.94 3.5 4.99-.15.54-.56 1.96-.64 2.27-.1.38.14.38.3.27.12-.08 1.95-1.32 2.74-1.86.36.05.72.08 1.1.08 4.14 0 7.5-2.64 7.5-5.9S13.14 2 9 2z"
      />
    </svg>
  );
}
```

- [ ] **Step 2: auth.module.css에 Kakao 스타일 추가**

`.oauth` 규칙 아래에 추가(카카오 브랜드 옐로 + 어두운 글자):

```css
.oauthKakao {
  background: #fee500;
  border-color: #fee500;
  color: #191600;
}
.oauthKakao:hover:not(:disabled) {
  background: #f4dc00;
  border-color: #f4dc00;
}
```

- [ ] **Step 3: LoginForm 버튼 교체**

`src/app/(public)/login/LoginForm.tsx`에서 import에 추가:

```tsx
import KakaoMark from "../_components/auth/KakaoMark";
import { login, signInWithProvider, type LoginState } from "@/server/actions/auth";
```

기존 비활성 Google 버튼 블록

```tsx
      <button type="button" className={styles.oauth} disabled aria-disabled="true">
        <GoogleMark /> Google로 계속하기
      </button>
```

을 아래로 교체:

```tsx
      <form action={signInWithProvider}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="provider" value="google" />
        <button type="submit" className={styles.oauth}>
          <GoogleMark /> Google로 계속하기
        </button>
      </form>
      <form action={signInWithProvider} style={{ marginTop: 8 }}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="provider" value="kakao" />
        <button type="submit" className={`${styles.oauth} ${styles.oauthKakao}`}>
          <KakaoMark /> 카카오로 계속하기
        </button>
      </form>
```

- [ ] **Step 4: SignupForm에도 동일 블록 추가**

`src/app/(public)/signup/SignupForm.tsx`를 열어 Google/소셜 영역을 확인한다. 로그인과 동일하게 import(`signInWithProvider`, `GoogleMark`, `KakaoMark`)를 추가하고, 이메일 폼 위(또는 기존 Google 버튼 자리)에 Step 3과 동일한 두 `<form action={signInWithProvider}>` 블록을 넣는다. `next` prop이 없으면 hidden next는 생략한다.

(SignupForm의 현재 소셜 버튼 유무·구조를 먼저 읽고, 로그인과 같은 모양으로 맞춘다. 디자인 클래스는 기존 `styles.oauth`/`styles.oauthKakao` 재사용.)

- [ ] **Step 5: 타입체크·린트·빌드**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: 오류 없음.

- [ ] **Step 6: 로컬 렌더 확인**

`pnpm dev` 후 `/login`·`/signup`에서 Google·카카오 버튼이 보이고(카카오는 옐로), 클릭 시 비활성 아님을 확인. (공급자 미설정 로컬에선 클릭 후 Supabase 오류 페이지로 갈 수 있음 — URL이 공급자/Supabase로 향하면 배선 정상. 실제 로그인은 운영 설정 후.)

- [ ] **Step 7: 커밋**

```bash
git add "src/app/(public)/_components/auth/KakaoMark.tsx" "src/app/(public)/_components/auth/auth.module.css" "src/app/(public)/login/LoginForm.tsx" "src/app/(public)/signup/SignupForm.tsx"
git commit -m "feat: 로그인·가입 화면 Google·카카오 소셜 버튼

비활성 Google 버튼 활성화 + 카카오 버튼 추가(서버 액션 폼·next 전달).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: 로컬 config + 운영 공급자 등록 런북

**Files:**
- Modify: `supabase/config.toml`
- Modify: `deploy/`의 운영 런북 문서(기존 배포 런북 파일 — 없으면 `deploy/oauth-providers.md` 생성)

**Interfaces:**
- Produces: 로컬 Supabase에 google·kakao external provider 블록(env 참조). 운영 등록 절차 문서.

- [ ] **Step 1: config.toml에 external 블록 추가**

`[auth.external.apple]` 블록 근처(또는 `[auth]` 섹션 뒤)에 추가:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"

[auth.external.kakao]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_KAKAO_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_KAKAO_SECRET)"
```

- [ ] **Step 2: 로컬 start가 깨지지 않는지 확인**

Run: `npx supabase stop && npx supabase start 2>&1 | tail -20`
Expected: 정상 기동. (env 미설정이면 client_id/secret이 빈 값으로 들어가나 기동 자체는 진행 — 실제 OAuth만 동작 안 함.)
만약 빈 client_id로 start가 실패하면, 두 블록의 `enabled = true`를 `enabled = false`로 바꾸고 "운영 대시보드에서만 활성화"로 런북에 명시(로컬 OAuth 왕복은 어차피 범위 밖).

- [ ] **Step 3: 운영 등록 런북 문서 작성**

`deploy/oauth-providers.md`에 작성(한국어):

```markdown
# 소셜 로그인 공급자 등록(Google·Kakao)

소셜 로그인은 코드 배선만으로는 동작하지 않으며, 아래 콘솔·대시보드 등록이 필요하다.
시크릿은 저장소에 커밋하지 않는다.

## 공통: 콜백(Redirect) URL
- Supabase 콜백: `https://<프로젝트ref>.supabase.co/auth/v1/callback`
- 앱 복귀 URL: `https://<운영도메인>/auth/callback` (Supabase 대시보드 Authentication → URL Configuration의 Redirect URLs에 추가)

## Google
1. Google Cloud Console → API 및 서비스 → OAuth 동의 화면 구성.
2. 사용자 인증 정보 → OAuth 클라이언트 ID(웹) 생성.
3. 승인된 리디렉션 URI에 위 Supabase 콜백 URL 추가.
4. 발급된 Client ID/Secret을 Supabase 대시보드 Authentication → Providers → Google에 입력하고 Enable.

## Kakao
1. Kakao Developers → 애플리케이션 추가.
2. 카카오 로그인 활성화, Redirect URI에 위 Supabase 콜백 URL 추가.
3. 동의 항목에서 닉네임(및 필요 시 이메일) 설정.
4. REST API 키(Client ID)와 Client Secret을 Supabase 대시보드 Authentication → Providers → Kakao에 입력하고 Enable.

## 검증(스모크)
- 운영 `/login`에서 Google·카카오 버튼 클릭 → 공급자 동의 → `/main` 복귀.
- Supabase Authentication → Users에 신규 사용자, `profiles`에 role=member 행 생성 확인.
```

- [ ] **Step 4: 커밋**

```bash
git add supabase/config.toml deploy/oauth-providers.md
git commit -m "chore: 로컬 OAuth provider 설정·운영 등록 런북

config.toml에 google·kakao external 블록(env 참조), deploy 런북에 콘솔 등록 절차.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: 통합 검증·정리

**Files:** (없음 — 검증·문서)

- [ ] **Step 1: 전체 검증**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: 모두 통과.

- [ ] **Step 2: 비허용 provider 가드 확인(코드 점검)**

`signInWithProvider`에 `provider=facebook` 같은 값이 오면 `ALLOWED_PROVIDERS` 검증에서 `/login?notice=...`로 빠지는지 코드로 재확인(폼 hidden은 google/kakao 고정이지만 서버 가드가 진실 원천).

- [ ] **Step 3: 로컬 e2e — 트리거·콜백·버튼**

- Task 1 Step 4의 트리거 검증 재확인(이미 통과).
- `pnpm dev`에서 `/login`·`/signup` 렌더, 콘솔 에러 0건.
- (실제 Google·Kakao 왕복은 운영 공급자 등록 후 스모크 — 런북 참조.)

- [ ] **Step 4: PR 본문에 운영 액션 명시**

PR 본문 `## 검증`에 "운영 공급자(Client ID/Secret·Redirect URL) 등록이 선행되어야 실제 로그인 동작" 명시(런북 링크).

---

## Self-Review

- **Spec 커버리지**: 계정 모델(member 강제·Task1) / Google·Kakao(Task3·4) / 트리거 보강(Task1) / 콜백(Task2) / 서버 액션 화이트리스트(Task3) / UI 버튼(Task4) / 공급자 설정·런북(Task5) / 테스트(Task6) — 모두 대응. PR 2·3(관리자 사이트 접근·"메인 배너" 용어)은 별도 plan.
- **Placeholder**: 없음(모든 코드 블록 실내용).
- **타입 일관성**: `signInWithProvider(formData)` 시그니처가 Task3 정의와 Task4 폼 사용에서 일치. `safeNext(raw, fallback)`·`createSupabaseServer()`·`readUserRole` 기존 시그니처 사용.
- **주의**: DB 컨테이너명 `supabase_db_pedantic-gates-aba33a`은 현 worktree 기준 — 실행 시점에 `docker ps`로 확인.
