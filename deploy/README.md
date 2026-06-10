# 배포 — Vercel + Supabase

Next.js 앱은 **Vercel**에, DB·인증·파일저장은 **Supabase**에 둔다.
설계 배경은 `docs/superpowers/specs/2026-06-07-supabase-migration-design.md` 참조.

> **비용**: 운영은 Supabase **Pro($25/월)** 한 줄. Vercel은 비영리 Hobby 무료.
> Pro 결제는 **운영 프로젝트를 생성하는 순간**부터 시작된다. 로컬 개발(`supabase start`)은 무료.

---

## 0. 로컬 개발 (무료, 결제 불필요)

```bash
colima start                 # Docker 런타임 (최초 1회 설치: brew install colima docker)
npx supabase start           # 로컬 스택(Postgres·Auth·Storage·Studio) — analytics 비활성
pnpm dev                     # http://localhost:3000 (저장소 루트에서 실행)
pnpm seed                    # admin·member 계정 + 콘텐츠 시드 (멱등)
```
`.env.local`(저장소 루트)에는 `supabase status`가 출력한 로컬 키를 넣는다(공용 기본값, 비밀 아님).
정지: `npx supabase stop && colima stop`.

---

## 1. Supabase 운영 프로젝트 (★유료 시작점)

> 인증 정책(2026-06 변경): **공개 회원가입 허용 + 이메일 인증 필수**. "admin 발급 전용" 정책은 폐기됨.
> 배경: `docs/superpowers/specs/2026-06-09-signup-functionality-design.md` · `2026-06-10-password-reset-design.md`.

1. Supabase 대시보드에서 **Pro 조직/프로젝트 생성**(리전: Seoul). DB 비밀번호 보관.
2. CLI 연결 후 마이그레이션 반영:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push          # supabase/migrations/* 적용 (훅 함수·트리거 포함)
   ```
3. admin 계정 생성: 저장소 루트에 `.env.production.local`(gitignore) 작성 —
   `NEXT_PUBLIC_SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`·`ADMIN_EMAIL`·`ADMIN_PASSWORD`(8자+).
   그 뒤 `pnpm seed:admin` (관리자 1명만, 데모 콘텐츠 없음). 실제 콘텐츠는 관리자 화면에서 입력.

### 1-b. 인증(가입·메일) 운영 설정

로컬 `config.toml`의 auth 설정은 운영에 **자동 반영되지 않는다**. 아래를 대시보드 또는 `supabase config push`로 반영한다.

1. **공개 가입 허용 + 이메일 인증(Confirm email) 활성화** — `config.toml` 기준 `enable_signup=true` · `enable_confirmations=true`.
2. **메일 템플릿 반영** — 가입 확인(`supabase/templates/confirmation.html`)·비밀번호 재설정(`recovery.html`).
   링크는 `/auth/confirm?token_hash=…&type=…&next=…` 형식(앱 Route Handler가 `verifyOtp` 처리).
3. **SMTP 등록(필수)** — 미등록 시 내장 메일(시간당 ~2통, 테스트 전용)뿐이라 가입·재설정 메일이 사실상 동작하지 않는다.
   권장: **Resend**(무료 3,000통/월) 가입 → API 키 발급 → 대시보드 Authentication → SMTP 설정 + 발송 도메인 DNS 인증.
4. **Site URL·Redirect URLs** — 운영 도메인과 `<도메인>/auth/confirm`을 허용 목록에 등록(Vercel 도메인 확정 후).
5. **커스텀 액세스 토큰 훅 활성화 확인** — 훅 **함수**는 마이그레이션(`db push`)으로 생성되지만, 훅 **활성화**는 auth 설정이다
   (대시보드 Authentication → Hooks 또는 `config.toml`의 `[auth.hook.custom_access_token]`을 config push).
   확인법: admin 로그인 후 JWT에 `user_role` 클레임이 있어야 한다. 없으면 `/admin` 가드가 동작하지 않는다.

---

## 2. Vercel 연결

1. Vercel에 GitHub 저장소 연결, 프레임워크 **Next.js**, **Root Directory = `./`(저장소 루트)** — 앱이 루트에 있으므로 기본값 그대로.
2. 환경변수(Project Settings → Environment Variables):
   | 변수 | 출처 | 공개 |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | 운영 프로젝트 Project URL | 공개 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable(anon) 키 | 공개(RLS가 보호) |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret(service_role) 키 | **서버 전용·노출 금지** |
   | `NEXT_PUBLIC_SITE_URL` | 운영 도메인(`https://…`) | 공개 — 확인·복구 메일의 콜백 origin과 OG 메타데이터에 사용 |
3. 푸시 → 자동 빌드·배포. PR마다 프리뷰 배포 제공.
4. 도메인 연결·TLS는 Vercel이 자동 처리.

---

## 3. 운영 스모크 테스트

- 공개 6섹션(`/committee`·`/training`·`/webzine`·`/faculty`·`/resources`·`/board`) 렌더
- `/login` → admin 로그인 → `/admin` 도착·접근, 글 작성·파일 업로드/다운로드
- member 로그인 → `/main` 도착, `/board` 작성·댓글·좋아요, `/admin` 차단
- **회원가입**: `/signup` 제출 → 확인 메일 수신 → 링크 클릭 → `/main` 진입(세션), `profiles`에 `role=member` 생성
- **비밀번호 재설정**: `/login`의 "비밀번호를 잊으셨나요?" → `/forgot-password` 요청 → 복구 메일 → 새 비밀번호 설정 → `/main`, 새 비밀번호로 재로그인 확인
- 보호 라우트 우회 확인: 비로그인 `/board` 접근 → `/login?next=/board` → 로그인 후 복귀

---

## 4. 운영 메모

- **스키마 변경**: `supabase migration new <name>` → 로컬 검증(`supabase db reset`) → `supabase db push` → `pnpm db:types`로 타입 재생성.
- **백업**: Supabase Pro는 일일 백업 제공(대시보드). 추가로 `supabase db dump` 가능.
- **RLS가 1차 보안 경계**다. service_role 키는 서버(Server Action·Route Handler·업로드)에서만 사용.
