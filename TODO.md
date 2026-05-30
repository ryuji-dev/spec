# TODO — 서경노회 교육위원회 홈페이지

> 작업 큐 + Claude Code에 던질 후속 작업 프롬프트 보관소.
> 프로젝트 **헌법(원칙·통신 규약·보안·코드 컨벤션 등)** 은 `CLAUDE.md`가 진실의 원천이다.
> 본 파일은 *남은 작업과 그 프롬프트* 만 다룬다.

---

## 0. 아키텍처 (확정 — 2026-05 재설계)

✅ **Next.js 풀스택 단일 앱 + PostgreSQL/Drizzle + Oracle Cloud ARM VM 올인원(Docker Compose)**.
- 프론트·백엔드를 한 앱(`web/`)으로 통합. 별도 PHP 없음.
- 인증은 경량 커스텀 세션(httpOnly 쿠키 + jose JWT).
- 배포는 Oracle Always Free ARM VM 1대에 `web` + `postgres` + `caddy`(자동 HTTPS).
- 배경·근거·폴더 구조: `docs/superpowers/plans/2026-05-30-oracle-nextjs-fullstack.md`, 규약은 `CLAUDE.md`.

> ⚠️ **게이트**: 디자인 이식이 끝나기 전까지 백엔드 작업(Phase 2~4)은 시작하지 않는다. 인프라 골격(Phase 1)·문서까지는 선행 가능.

---

## 1. 디자인 이식 (Claude Design HTML → Next.js)

- [x] **랜딩페이지 이식** — `web/src/app/page.tsx`
  - 4개 폰트 self-host, 정중앙 정렬 보정, 휠 스크롤 → `/main` 진입, 배경 WebP 교체 포함
- [ ] 메인페이지 이식 — `web/_design/.../서경노회 교육위원회 메인페이지.html` + `app.jsx` 컴포넌트 활용
- [x] **신학원웹진 이식** — `web/src/app/webzine/`
  - SSR UA 판정으로 desktop/ios/android 분기, mock 데이터 기반 정적 화면
  - 후속: `/webzine/print` (A3 가로 2페이지 인쇄 라우트), 백엔드 연동
- [ ] 공통 레이아웃(헤더/푸터/네비게이션) 분리
- [ ] 모바일 반응형 검증

---

## 2. v1 페이지 골격

- [x] `/` 랜딩
- [ ] `/main` 메인 (게시물 카드·일정 위젯)
- [x] `/webzine` 신학원웹진 (mock 단계)
- [ ] `/about` 노회 교육부 소개
- [ ] `/notice` 공지사항
- [ ] `/schedule` 일정 (강습회·성경고사·찬양대회)
- [ ] `/resources` 자료실 (주일학교 교육 자료)
- [ ] `/contact` 연락처

---

## 3. 인프라 골격 (Phase 1 — 지금 가능, 게이트 무관)

> 헌법 "아키텍처 한눈에"·"기술 스택"을 따른다. 백엔드 로직은 만들지 않고, 컨테이너 스택만 세운다.

```
루트에 인프라 골격을 만든다.

1) docker-compose.yml : 세 서비스
   - web   : web/Dockerfile 빌드, env DATABASE_URL·JWT_SECRET 주입, expose 3000
   - postgres : 공식 이미지, named volume(pgdata)로 영속, healthcheck, 포트는 내부 네트워크만
   - caddy : 80/443 노출, deploy/Caddyfile 마운트, web:3000 프록시, 자동 TLS
   - uploads 디렉터리는 web 컨테이너에 named volume(uploads)로 마운트
2) web/Dockerfile : 멀티스테이지
   - deps(설치) → build(pnpm build, output:'standalone') → runner(.next/standalone 복사, 경량 node)
3) deploy/Caddyfile : <도메인> { reverse_proxy web:3000 }  — 도메인은 배포 시 확정, 로컬은 :80
4) deploy/README.md : OCI ARM VM 프로비저닝·Docker 설치·배포 절차 메모(스텁)
5) .gitignore : web/uploads/ 추가 (.env 이미 포함되어 있는지 확인)

확인:
- docker compose config 로 구성 검증
- docker compose up -d → postgres healthy + web :3000 응답 + caddy 경유 접속
- docker compose down -v 로 정리
```

- [ ] docker-compose.yml + web/Dockerfile + deploy/Caddyfile + deploy/README.md
- [ ] 로컬 docker compose 기동 확인

---

## 4. DB 스키마와 시드 (Phase 2 — 게이트 후, Drizzle)

```
백엔드 의존성 추가: pnpm add drizzle-orm postgres / pnpm add -D drizzle-kit

web/drizzle.config.ts : schema 경로 src/server/db/schema, out src/server/db/migrations, dialect postgresql, DATABASE_URL 사용.

web/src/server/db/index.ts : postgres.js 클라이언트 + drizzle 인스턴스 싱글톤. 'server-only'.

web/src/server/db/schema/ (테이블별 파일):
- users   : id, email(unique), passwordHash, name, role(enum: 'admin','member'), createdAt, updatedAt
- posts   : id, category(enum: 'notice','training','exam','choir','resource'),
            title, body(text), authorId(FK users), isPublished(bool),
            eventDate(nullable), createdAt, updatedAt
- attachments : id, postId(FK), originalName, storedName, mime, sizeBytes, createdAt

시드 스크립트 web/src/server/db/seed.ts : admin 1, 샘플 공지 2. 비밀번호는 해시 함수로 생성.

알려줄 것:
- drizzle-kit generate / migrate 실행 순서
- 시드 실행 명령
```

- [x] **핵심 스키마 + 파이프라인** — users·posts(통합)·attachments, drizzle.config, db 클라이언트, 마이그레이션 0000 생성. PGlite로 적용·FK·cascade·enum 검증 통과(`pnpm db:verify`).
- [ ] 시드(admin·샘플) — 비밀번호 해시가 필요해 **Phase 3(인증)** 으로 이관
- [ ] 콘텐츠별 추가 모델 — 교수(faculty)·자료 컬렉션 등은 해당 페이지 연동 시 증분 추가

> 권한은 admin / member 두 등급으로만 (헌법). 기존 'teacher','viewer' 3등급 안은 폐기.
> 통합 posts 설계: section(enum) + category(text) + meta(jsonb)로 게시판별 분기. 자세히는 `docs/superpowers/plans/2026-05-30-oracle-nextjs-fullstack.md`.

---

## 5. 인증 (Phase 3 — 게이트 후, 세션 쿠키)

```
백엔드 의존성: pnpm add jose zod / 비밀번호 해시(@node-rs/argon2 권장)

web/src/server/auth/password.ts : hashPassword / verifyPassword.
web/src/server/auth/session.ts  : jose로 JWT 발급·검증, httpOnly·Secure·SameSite=Lax 쿠키
  read/write, getCurrentUser(). 'server-only'. 만료 7일.

로그인/로그아웃:
- web/src/server/actions/auth.ts : login(email,password) Server Action — 검증 후 세션 쿠키 설정.
  logout() — 쿠키 삭제. zod로 입력 검증.
- web/src/app/(public)/login/page.tsx : 로그인 폼(클라이언트), Server Action 호출.

회원가입:
- admin 세션만 허용하는 createUser Server Action (admin 전용 가입 정책).

가드:
- web/src/middleware.ts : (admin) 라우트 그룹 보호 — 미로그인/비admin이면 /login 리다이렉트.
- Server Action·Route Handler 진입부에서도 세션·역할 재확인(서버 권한 체크).

확인:
- 로그인 → 쿠키 설정 → (admin) 진입 가능
- 미로그인으로 (admin) 접근 → /login 리다이렉트
- 로그아웃 → 쿠키 삭제
```

- [x] **3a 원시 함수** — password.ts(argon2)·session.ts(jose), `pnpm auth:verify` 9항목 통과
- [x] **3b 배선** — login/logout Server Action(zod·httpOnly 쿠키), proxy.ts(`/admin` 가드, Next16 middleware→proxy), 로그인·관리자 임시 페이지, db 지연 초기화. tsc·lint·build 통과
- [ ] admin 시드 + createUser(admin 전용) + **실제 로그인 e2e** — DB 기동(PGlite 로컬 or Docker) 후

---

## 6. 게시물 CRUD + 파일 업로드 (Phase 4 — 게이트 후)

```
읽기는 Server Component가 services 직접 호출. 쓰기는 Server Action. 클라이언트 fetch가 필요한
검색·무한스크롤만 Route Handler + lib/api.ts 래퍼.

services (web/src/server/services/posts.ts):
- listPosts({category,page,q})  공개 (isPublished=true)
- getPost(id)                   공개 (attachments 포함)
actions (web/src/server/actions/posts.ts):
- createPost / updatePost / deletePost  — admin 또는 작성자. zod 검증.
업로드:
- web/src/app/api/uploads/route.ts (또는 Server Action) : multipart, field=file
    * 확장자 화이트리스트: jpg,jpeg,png,webp,pdf,hwp,docx,xlsx,pptx
    * 실제 MIME 검사 + 최대 20MB
    * 저장: web/uploads/posts/{postId}/{uuid}.{ext}  (파일명 서버 재생성)
    * 다운로드는 원본 이름 Content-Disposition으로 스트리밍
    * 업로드 디렉터리에서 코드 실행 불가하도록 보관

웹:
- web/src/app/(public)/notice 등 카테고리별 라우트 그룹. 일단 notice만.
- 목록·상세 SSR. 작성/수정 폼은 클라이언트 컴포넌트 + Server Action.
- 디자인은 Claude Design export로 받아 컴포넌트 단위 이식 — 데이터 바인딩·폼 검증만, 마크업 임의 변경 금지.
- 이미지 표시는 next/image. 업로드는 same-origin이라 remotePatterns 불필요(또는 자체 도메인만).

확인:
- 글 작성 → 목록 노출 → 첨부 업로드 → 다운로드 → 삭제 시 파일도 같이 삭제
```

- [ ] posts services·actions + attachments 업로드/다운로드 + 이미지 표시

---

## 7. 운영자·일정·검색·페이지네이션 (Phase 4 후반)

```
- (admin) 라우트 그룹: role=admin 만. 사용자 목록·역할 변경, 게시물 일괄 관리.
- 메인에 다가오는 일정(eventDate 미래) 위젯.
- 검색은 ILIKE %q% (FULLTEXT/tsvector 전환 가능하도록 주석).
- 페이지네이션: page/perPage.
- 접근성: 폼 라벨, 키보드 포커스, 한국어 폰트(이미 layout 적용).

Lighthouse 점수 + 개선 가능 지점 짧게 보고.
```

- [ ] 관리자 페이지 + 일정 위젯 + 검색 + 페이지네이션

---

## 8. 배포 — Oracle ARM VM (Phase 5)

```
1) OCI 콘솔: Always Free ARM VM(VM.Standard.A1.Flex, 4 OCPU/24GB) 프로비저닝
   - Ubuntu LTS, 부팅 볼륨 + 블록 볼륨(업로드·DB용)
   - 보안 목록/방화벽: 80·443만 개방, postgres 포트는 비공개(컨테이너 내부 네트워크만)
2) 서버 셋업: Docker + docker compose plugin 설치, 저장소 clone
3) .env 작성(서버에서 직접, 저장소 X): DATABASE_URL·JWT_SECRET·POSTGRES_PASSWORD 등
4) docker compose up -d → drizzle 마이그레이션 적용 → 시드
5) 도메인 연결 + Caddy 자동 HTTPS 발급 확인
6) 운영 체크리스트(DB 백업 cron·로그 위치·JWT 시크릿 로테이션·업로드 볼륨 백업) → deploy/README

확인:
- 공개 도메인 HTTPS 접속, 로그인, 글 작성/업로드 end-to-end
```

- [ ] OCI VM 프로비저닝 + compose 배포 + 도메인·TLS + 운영 체크리스트

---

## v2 백로그 (네이버 카페형 — 단계적 도입)

- [ ] 회원가입 (admin 외 셀프 가입)
- [ ] 게시판 카테고리 다양화
- [ ] 댓글
- [ ] 알림 (이메일/카톡 등)

---

## 자주 어긋나는 지점 (체크리스트)

각 단계에서 점검:

- **서버 전용 코드는 `web/src/server/**` 에 두고 `import 'server-only'`.** DB 클라이언트·시크릿·해시가 클라이언트 번들에 새지 않게.
- **권한 체크는 서버에서.** middleware 가드만 믿지 말고 Server Action·Route Handler 진입부에서 세션·역할 재확인.
- **세션 쿠키는 httpOnly·Secure·SameSite=Lax.** 토큰을 localStorage에 두지 않는다(XSS).
- **파일 업로드 디렉터리는 코드 실행 불가 영역.** 저장 파일명 서버 재생성, 실제 MIME 검사, 용량 제한.
- **next/image**: 업로드가 same-origin이면 remotePatterns 불필요. 외부 이미지 쓸 때만 등록.
- **`.env`는 커밋 금지.** 시크릿은 서버에서 직접 작성.

---

## 메모

- 디자인 원본: `~/Downloads/Seogyeong Presbytery Education Committee-handoff.zip` → `web/_design/` (gitignore)
- 배포 대상: Oracle Cloud Always Free ARM VM (구 `recpc` 로컬 APM 대체)
- 헌법(원칙·규약·보안 등): **`CLAUDE.md`** 가 진실의 원천
