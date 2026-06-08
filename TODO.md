# TODO — 서경노회 교육위원회 홈페이지

> 작업 큐 + Claude Code에 던질 후속 작업 프롬프트 보관소.
> 프로젝트 **헌법(원칙·통신 규약·보안·코드 컨벤션 등)** 은 `CLAUDE.md`가 진실의 원천이다.
> 본 파일은 *남은 작업과 그 프롬프트* 만 다룬다.

---

## 0. 아키텍처 (확정 — 2026-06 Supabase 전환)

✅ **Next.js 16 풀스택 단일 앱(루트 `src/`) + Supabase(PostgreSQL·Auth·Storage) + Vercel**.
- 프론트·백엔드를 한 앱으로 통합. 별도 PHP 없음. 앱은 저장소 루트에 위치(`web/` 래퍼 없음).
- 데이터 접근은 **supabase-js + RLS**, 마이그레이션은 **Supabase CLI**(`supabase/migrations/`).
- 인증은 **Supabase Auth**(이메일+비밀번호), 세션은 @supabase/ssr 쿠키. 역할은 `profiles.role` → JWT `user_role`. 셀프 가입 없음(admin이 발급).
- 파일은 **Supabase Storage**(`attachments` 비공개 버킷).
- 배포는 **Vercel**(Next.js) + **Supabase Pro**($25/월). 로컬은 Supabase CLI 스택(Docker 런타임 colima).
- 변천·근거: `docs/superpowers/specs/2026-06-07-supabase-migration-design.md`, 규약은 `CLAUDE.md`.

---

## 1. 디자인 이식 (Claude Design HTML → Next.js)

- [x] **랜딩페이지 이식** — `src/app/page.tsx`
  - 4개 폰트 self-host, 정중앙 정렬 보정, 휠 스크롤 → `/main` 진입, 배경 WebP 교체 포함
- [ ] 메인페이지 이식 — `_design/.../서경노회 교육위원회 메인페이지.html` + `app.jsx` 컴포넌트 활용
- [x] **신학원웹진 이식** — `src/app/webzine/`
  - SSR UA 판정으로 desktop/ios/android 분기
  - 후속: `/webzine/print` (A3 가로 2페이지 인쇄 라우트)
- [ ] 공통 레이아웃(헤더/푸터/네비게이션) 분리
- [ ] 모바일 반응형 검증

---

## 2. v1 페이지 골격

- [x] `/` 랜딩
- [ ] `/main` 메인 (게시물 카드·일정 위젯) — 디자인 이식 진행 중
- [x] `/webzine` 신학원웹진
- [x] `/committee` 교육위원회
- [x] `/training` 교사강습회
- [x] `/faculty` 교수진 디렉터리
- [x] `/resources` 자료실
- [x] `/board` 자유게시판 (회원 글·댓글·좋아요)
- [ ] `/about` 노회 교육부 소개
- [ ] `/contact` 연락처

---

## 3. 백엔드 — Supabase 마이그레이션 (완료)

✅ 기존 Oracle/Drizzle/jose 계획을 폐기하고 **Supabase**로 전환 완료. 로컬 CLI 스택에서 e2e 검증.

- [x] **스키마·RLS** — `supabase/migrations/` (profiles·posts·attachments·comments·post_likes·faculty + enum). 모든 테이블 RLS, 섹션별 쓰기 정책.
- [x] **인증** — Supabase Auth + `custom_access_token_hook`(role→`user_role` 클레임) + `handle_new_user`/`guard_profile_role` 트리거. 권한 상승 차단 검증.
- [x] **데이터 접근** — 6섹션 services(읽기)·actions(쓰기) supabase-js 전환, `proxy.ts` 세션·역할 가드.
- [x] **파일** — Supabase Storage 업로드/다운로드(service-role 스트리밍, 비공개 버킷).
- [x] **시드** — `pnpm seed` (admin·member + 콘텐츠, 멱등).

> 상세: `docs/superpowers/plans/2026-06-07-supabase-migration.md`.

---

## 4. 배포 — Vercel + Supabase Pro (대기: 유료 결제)

```
1) Supabase Pro 조직/프로젝트 생성(리전 Seoul), DB 비밀번호 보관.
2) 대시보드: 공개 가입 비활성화, 커스텀 액세스 토큰 훅 활성 확인.
3) CLI: supabase login → link --project-ref <ref> → db push (마이그레이션 반영).
4) admin 시드: 운영 키 환경에서 scripts/seed-supabase.mjs (운영 비밀번호로 교체).
5) Vercel: GitHub 연결, Root `./`, env 3개
   (NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY).
6) 도메인·TLS(Vercel 자동) → 스모크 테스트.

확인:
- 공개 6섹션 렌더, admin 로그인→글 작성·파일 업로드/다운로드,
  member 로그인→게시판·댓글·좋아요, /admin 차단.
```

- [ ] Supabase Pro 프로젝트 + `db push` + admin 시드
- [ ] Vercel 연결 + env 3개 + 도메인 + 스모크 테스트

> 런북: `deploy/README.md`.

---

## v2 백로그 (네이버 카페형 — 단계적 도입)

- [ ] 회원가입 (admin 외 셀프 가입)
- [ ] 게시판 카테고리 다양화
- [x] 댓글 (board)
- [x] 좋아요 (board)
- [ ] 알림 (이메일/카톡 등)

---

## 자주 어긋나는 지점 (체크리스트)

- **RLS가 1차 경계.** 새 테이블·기능은 RLS 정책을 함께 추가. 서버 코드는 그 위 방어층.
- **서버 전용 코드는 `src/server/**` 에 두고 `import 'server-only'`.** service-role 키·시크릿이 클라이언트 번들에 새지 않게.
- **권한 체크는 서버에서.** proxy 가드만 믿지 말고 Server Action·Route Handler 진입부에서 세션·역할 재확인.
- **세션 쿠키는 @supabase/ssr이 관리(httpOnly).** 토큰을 localStorage에 두지 않는다(XSS).
- **파일 업로드**: 저장 파일명 서버 재생성, 실제 MIME 검사, 용량 제한. Storage 버킷 비공개, 다운로드는 service-role 경유.
- **service-role 키는 서버 전용.** 클라이언트에는 anon(publishable) 키만(RLS가 보호).
- **`.env`는 커밋 금지.** 시크릿은 환경변수로만.

---

## 메모

- 디자인 원본: `~/Downloads/Seogyeong Presbytery Education Committee-handoff.zip` → `_design/` (gitignore)
- 백엔드: Supabase(관리형) — 구 Oracle ARM VM / Drizzle / PGlite / jose 계획은 폐기
- 헌법(원칙·규약·보안 등): **`CLAUDE.md`** 가 진실의 원천
