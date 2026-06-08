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

1. Supabase 대시보드에서 **Pro 조직/프로젝트 생성**(리전: Seoul). DB 비밀번호 보관.
2. **Authentication → 공개 가입 비활성화**(admin이 계정 발급).
3. **커스텀 액세스 토큰 훅 활성화** 확인 (`config.toml`의 `[auth.hook.custom_access_token]`이 `db push`로 함께 반영됨).
4. CLI 연결 후 마이그레이션 반영:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push          # supabase/migrations/* 적용
   ```
5. admin 계정 생성: 저장소 루트에 `.env.production.local`(gitignore) 작성 —
   `NEXT_PUBLIC_SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`·`ADMIN_EMAIL`·`ADMIN_PASSWORD`(8자+).
   그 뒤 `pnpm seed:admin` (관리자 1명만, 데모 콘텐츠 없음). 실제 콘텐츠는 관리자 화면에서 입력.

---

## 2. Vercel 연결

1. Vercel에 GitHub 저장소 연결, 프레임워크 **Next.js**, **Root Directory = `./`(저장소 루트)** — 앱이 루트에 있으므로 기본값 그대로.
2. 환경변수(Project Settings → Environment Variables):
   | 변수 | 출처 | 공개 |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | 운영 프로젝트 Project URL | 공개 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable(anon) 키 | 공개(RLS가 보호) |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret(service_role) 키 | **서버 전용·노출 금지** |
3. 푸시 → 자동 빌드·배포. PR마다 프리뷰 배포 제공.
4. 도메인 연결·TLS는 Vercel이 자동 처리.

---

## 3. 운영 스모크 테스트

- 공개 6섹션(`/committee`·`/training`·`/webzine`·`/faculty`·`/resources`·`/board`) 렌더
- `/login` → admin 로그인 → `/admin` 접근, 글 작성·파일 업로드/다운로드
- member 로그인 → `/board` 작성·댓글·좋아요, `/admin` 차단

---

## 4. 운영 메모

- **스키마 변경**: `supabase migration new <name>` → 로컬 검증(`supabase db reset`) → `supabase db push` → `pnpm db:types`로 타입 재생성.
- **백업**: Supabase Pro는 일일 백업 제공(대시보드). 추가로 `supabase db dump` 가능.
- **RLS가 1차 보안 경계**다. service_role 키는 서버(Server Action·Route Handler·업로드)에서만 사용.
