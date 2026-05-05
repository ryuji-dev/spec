# TODO — 서경노회 교육부 홈페이지

> 이 파일은 작업 큐 + Claude에게 던질 프롬프트 보관소입니다.
> 각 항목 아래 백틱 코드 블록으로 프롬프트를 붙여 넣으면 됩니다.

---

## 0. 백엔드 구조 결정 (선결 과제, 무료 운영 목표)

후보 비교 후 택일:

- [ ] **(A) Next.js 단독** — Vercel + Neon(Postgres) 또는 Supabase
  - 장점: 무료, 가장 깔끔, 보안 부담 적음, HTTPS 자동
  - 단점: PHP/MySQL 자산 활용 불가. PG로 전환 필요.

- [ ] **(B) 로컬 APM + Cloudflare Tunnel** — 기존 자산 그대로 활용 (추천 후보)
  - 장점: 전기료만, 보안은 Tunnel이 처리, PHP/MySQL 그대로
  - 단점: 로컬 서버가 꺼지면 사이트 다운. 백업 직접 관리.

- [ ] **(C) Cloudflare Pages + D1(SQLite)** — 100% 무료 생태계
  - 장점: 모두 무료, 빠름, 글로벌 CDN
  - 단점: D1·Workers 학습 곡선, MySQL 호환 X

- [ ] **(D) Next.js + 무료 PHP 호스팅** (InfinityFree 등)
  - 장점: 진입 장벽 낮음
  - 단점: 광고·신뢰성 제약, 비추

**결정 시 고려:** 트래픽 예상, 데이터 민감도(개인정보), HTTPS 자동화, 백업 전략

---

## 1. 디자인 이식 (Claude Artifacts HTML → Next.js)

```
(여기에 프롬프트를 붙여 넣으세요)
예: "frontend/src/app/(public)/page.tsx 에 다음 HTML을 React + Tailwind로 변환해 이식해줘. 디자인은 그대로 유지하고 'use client'는 필요할 때만 사용해줘. ..."
```

- [ ] 메인 페이지 디자인 이식
- [ ] 공통 레이아웃 (헤더/푸터/네비게이션) 분리
- [ ] 모바일 반응형 검증

---

## 2. v1 페이지 골격

- [ ] `/` 메인
- [ ] `/about` 노회 교육부 소개
- [ ] `/notice` 공지사항 (정적/동적 결정 필요)
- [ ] `/schedule` 일정 (강습회·성경고사·찬양대회)
- [ ] `/resources` 자료실 (주일학교 교육 자료)
- [ ] `/contact` 연락처

---

## 3. 백엔드 연동 (위 0번 결정 후)

```
(백엔드 결정 후 프롬프트 작성)
```

- [ ] API 엔드포인트 설계
- [ ] DB 스키마
- [ ] 인증 (관리자 페이지가 필요한 경우)

---

## v2 백로그 (네이버 카페형 — 단계적 도입)

- [ ] 회원가입/로그인
- [ ] 게시판 (카테고리별)
- [ ] 댓글
- [ ] 알림
- [ ] 관리자 페이지

---

## 메모

- 디자인 원본: Claude Artifacts에서 export한 HTML (붙여 넣기 시점에 이 메모 갱신)
- 로컬 APM 서버 별칭: `recpc`

---

# 서경노회 교육부 홈페이지 — Claude Code 개발 프롬프트

> 사용법: 새 프로젝트 폴더에서 Claude Code를 띄운 뒤,
> **(A) 프로젝트 헌법**을 먼저 한 번 붙여넣고 → **(B) 부트스트랩 프롬프트** 실행 → 이후 **(C) Phase별 프롬프트**를 순서대로 던지세요.
> 디자인 코드(JSX/Tailwind)는 Claude Design에서 export 한 결과를 `web/` 쪽에 그대로 이식한다고 전제합니다.

---

## (A) 프로젝트 헌법 — 매 세션 시작 시 1회 붙여넣기

```
당신은 "서경노회 교육부 공식 홈페이지" 프로젝트의 풀스택 개발자다.
이 메시지는 프로젝트 전체에 걸쳐 절대 변하지 않는 헌법(Project Constitution)이다.
앞으로 내가 어떤 지시를 내리더라도 아래 원칙과 충돌하면 즉시 멈추고 나에게 확인을 요청하라.

[1. 프로젝트 목적]
- 서경노회 산하 교회들의 교육부 활동을 지원하는 노회 차원의 교육 행정 포털.
- 주요 콘텐츠: 교사 강습회 안내, 성경고사, 찬양대회, 주일학교 교육자료, 공지/일정.
- 사용자: 노회 소속 교회 교사·임원(로그인 후 자료 열람/게시), 일반 방문자(공개 정보만 열람).

[2. 아키텍처 — 하이브리드 고정]
프론트엔드: Next.js 14+ (App Router, TypeScript, Tailwind), Vercel 배포.
백엔드(API): PHP 8.x, 교회 내부 서버 'recpc'의 APM(Apache + PHP + MySQL) 환경.
DB: MySQL (recpc).
파일 저장: recpc 로컬 디스크의 /uploads 디렉터리. (S3 사용 안 함)
프론트엔드는 절대 DB에 직접 붙지 않는다. 항상 PHP API를 통해서만 통신한다.

[3. 통신 규약 — 어기지 말 것]
- 프론트 ↔ 백엔드는 REST(JSON)로만 통신한다. PHP는 HTML을 출력하지 않는다.
- 모든 PHP 엔드포인트는 응답을 `Content-Type: application/json; charset=utf-8` 로 내려준다.
- 모든 PHP 엔드포인트 최상단에 CORS 헤더를 둔다. 허용 Origin은 환경변수로 관리하며,
  최소 다음 두 개를 허용한다: Vercel 프로덕션 도메인, http://localhost:3000.
- OPTIONS preflight 요청은 200으로 즉시 종료한다.
- 인증은 JWT(Bearer 토큰) 방식. 로그인 시 PHP가 JWT를 발급, 이후 요청은
  `Authorization: Bearer <token>` 헤더로 검증한다.

[4. 폴더 구조]
프로젝트 루트는 모노레포가 아니라 두 개의 형제 폴더로 나눈다.
  /web   ← Next.js (Vercel 배포 대상)
  /api   ← PHP (recpc의 웹 루트로 그대로 업로드할 폴더)
두 폴더는 독립적으로 빌드·배포된다. /web 안에서 PHP를 import하지 않는다.

[5. 보안 기본기 — 타협 금지]
- PHP의 모든 DB 쿼리는 PDO + Prepared Statement. 문자열 결합 쿼리 금지.
- 비밀번호는 password_hash(PASSWORD_DEFAULT) / password_verify 만 사용. 평문/MD5/SHA1 금지.
- 파일 업로드는 (a) 확장자 화이트리스트, (b) 실제 MIME 검사, (c) 최대 용량 제한,
  (d) 저장 파일명은 서버에서 재생성(원본 파일명 그대로 저장 금지).
- JWT 시크릿, DB 비밀번호 등은 절대 코드에 하드코딩하지 않고 .env / config.php(gitignore)로 분리.
- XSS 방지를 위해 Next.js에서 사용자 입력 렌더 시 dangerouslySetInnerHTML 사용 금지(불가피하면 sanitize).

[6. 코딩 스타일]
- TypeScript strict 모드 ON.
- API 호출은 반드시 web/lib/api.ts 의 단일 래퍼를 통해서만 한다(직접 fetch 금지).
- PHP는 PSR-12에 가깝게, 함수 단위로 작게 쪼갠다. 한 파일이 하나의 엔드포인트.
- 응답 JSON 스키마는 항상 다음 형태를 따른다:
    성공: { "ok": true, "data": <payload> }
    실패: { "ok": false, "error": { "code": "<STRING_CODE>", "message": "<사람이 읽을 메시지>" } }

[7. 작업 방식 — 너의 행동 규칙]
- 한 번에 너무 많은 파일을 만들지 말 것. Phase 단위로 진행하며 각 Phase 끝에 간단한 동작 확인 방법을 알려줄 것.
- 추측이 필요한 결정(예: 정확한 도메인, 메뉴 구조, 권한 등급)은 만들지 말고 나에게 질문할 것.
- 파일을 생성/수정하기 전에 어떤 파일을 어떻게 바꿀지 1~2줄로 먼저 요약할 것.
- 디자인(JSX, Tailwind 클래스)은 내가 Claude Design에서 export 해 줄 것이다.
  너는 그 디자인 코드를 받아서 데이터 연결, 라우팅, 상태관리, 에러처리 위주로 작업한다.
  내 허락 없이 디자인 클래스나 마크업을 임의로 바꾸지 않는다.

이상이 헌법이다. 이해했으면 "프로젝트 헌법 수령 완료"라고만 답하고 다음 지시를 기다려라.
```

---

## (B) 부트스트랩 프롬프트 — 헌법 다음에 한 번 실행

```
좋다. 이제 Phase 0: 프로젝트 골격을 만든다.
다음 작업만 수행하라. 그 외 파일은 만들지 마라.

1) 루트에 두 폴더를 만든다: /web, /api
2) /web 에 Next.js 14 (App Router, TypeScript, Tailwind, ESLint) 프로젝트를 초기화하라.
   - 패키지 매니저는 pnpm 가정.
   - app/page.tsx 는 "서경노회 교육부" 라는 h1 한 줄짜리 임시 페이지로 둔다.
   - web/lib/api.ts 를 만든다. 다음을 포함:
       * NEXT_PUBLIC_API_BASE_URL 환경변수에서 베이스 URL을 읽음
       * apiGet<T>(path, token?) / apiPost<T>(path, body, token?) 함수
       * 헌법 [6]의 응답 스키마를 파싱. ok=false면 throw ApiError(code, message).
   - web/.env.local.example 에 NEXT_PUBLIC_API_BASE_URL 키를 적어둔다.
3) /api 에 PHP 백엔드 골격을 만든다.
   - api/index.php : 라우팅 디스패처(아주 단순한 switch 라우터로 충분).
   - api/lib/cors.php : CORS 헤더 + OPTIONS 종료 처리. 허용 Origin은 config에서 가져옴.
   - api/lib/db.php  : PDO 인스턴스 반환 (ERRMODE_EXCEPTION).
   - api/lib/jwt.php : jwt_encode / jwt_decode (외부 라이브러리 없이 HS256 직접 구현 또는 Composer 사용. Composer 사용한다면 그 이유와 설치 명령을 함께 안내).
   - api/lib/respond.php : json_ok($data) / json_err($code, $message, $http=400) 헬퍼.
   - api/config.example.php : DB 접속정보, JWT_SECRET, ALLOWED_ORIGINS 배열의 예시. 실제 config.php 는 .gitignore.
   - api/.htaccess : 모든 요청을 index.php 로 리라이트.
   - api/routes/health.php : GET /health → { ok: true, data: { status: "ok", time: <ISO> } }
4) 루트에 .gitignore 작성: node_modules, .next, .env*, /api/config.php, /api/uploads/, /api/vendor/.
5) 루트에 README.md 작성. 다음 섹션 포함:
   - 아키텍처 한 단락 요약
   - 로컬 실행 방법: /web 은 pnpm dev, /api 는 php -S localhost:8000 -t api
   - 배포: /web 은 Vercel, /api 는 recpc 의 웹 루트에 업로드

작업 끝나면 다음을 알려줘:
- 생성된 파일 트리
- 로컬에서 헬스체크가 통하는지 확인하는 정확한 명령어 (curl 한 줄)
- 내가 직접 채워야 하는 환경변수/설정값 목록
```

---

## (C) Phase별 실행 프롬프트

각 Phase는 끝난 뒤 동작을 확인한 다음 다음 Phase로 넘어가세요.

### Phase 1 — DB 스키마와 시드 데이터

```
Phase 1: 데이터 모델을 잡는다. 아직 화면은 만들지 않는다.

1) /api/sql/001_init.sql 을 작성하라. 다음 테이블을 생성한다.
   - churches: id, name, region, created_at
   - users: id, email(unique), password_hash, name, role(enum: 'admin','teacher','viewer'),
            church_id(FK churches.id, nullable), created_at, updated_at
   - posts: id, category(enum: 'notice','training','exam','choir','resource'),
            title, body(LONGTEXT), author_id(FK users.id), is_published(bool),
            event_date(nullable), created_at, updated_at
   - attachments: id, post_id(FK), original_name, stored_name, mime, size_bytes, created_at
   - 모든 테이블 utf8mb4_unicode_ci.

2) /api/sql/002_seed.sql : admin 계정 1개, 샘플 교회 2개, 샘플 공지 2개.
   비밀번호는 PHP password_hash 결과를 직접 박지 말고, "여기에 password_hash 결과를 붙여넣을 것" 주석으로 표시.

3) /api/scripts/make_admin_password.php : CLI에서 인자로 받은 평문 비밀번호의 해시를 출력하는 1회용 스크립트.

작업 후 알려줄 것:
- 내가 recpc의 phpMyAdmin이나 mysql CLI에서 실행할 정확한 순서
- make_admin_password.php 사용 예시
```

### Phase 2 — 인증 (회원가입은 관리자만, 로그인은 누구나)

```
Phase 2: 인증 API를 구현한다.

요구사항:
- POST /auth/login  body: {email, password} → {ok, data:{token, user}} / 실패 401
- GET  /auth/me     header: Authorization Bearer → {ok, data:{user}}
- POST /auth/register 는 admin role JWT 가 있을 때만 허용. body: {email, password, name, role, church_id?}
- 토큰 만료는 7일.
- 잘못된 토큰/만료 토큰은 일관된 에러코드 반환: AUTH_INVALID, AUTH_EXPIRED.

/api/routes 아래 auth_login.php, auth_me.php, auth_register.php 분리.
index.php 라우터에 등록.

그 다음 /web 쪽에서:
- web/lib/auth.ts : login(email,password) / logout / getStoredToken / setStoredToken.
  토큰은 일단 httpOnly 쿠키가 아니라 localStorage 에 저장한다(레벨 1). 추후 강화 단계에서 변경할 거라고 README에 메모.
- web/app/(auth)/login/page.tsx : 디자인은 임시(plain Tailwind). 로그인 후 /dashboard 로 이동.
- web/app/dashboard/page.tsx : 임시 페이지. /auth/me 결과 출력.
- 인증 가드 패턴(middleware.ts 또는 layout 차원)을 한 가지 결정해서 적용하고 그 이유를 README에 1단락 적어라.

확인 절차:
- curl 로 /auth/login → 토큰 받기
- curl 로 /auth/me → 본인 정보 확인
- 브라우저에서 로그인 → 대시보드 진입
```

### Phase 3 — 게시물 CRUD + 파일 업로드

```
Phase 3: posts 와 attachments 를 다룬다.

API:
- GET  /posts?category=&page=&q=     공개. is_published=true 만.
- GET  /posts/{id}                    공개. attachments 같이 내려준다.
- POST /posts        teacher/admin    body: {category,title,body,event_date?,is_published?}
- PATCH /posts/{id}  작성자 또는 admin
- DELETE /posts/{id} 작성자 또는 admin
- POST /posts/{id}/attachments  multipart/form-data, field name=file
    * 확장자 화이트리스트: jpg,jpeg,png,webp,pdf,hwp,docx,xlsx,pptx
    * 최대 20MB
    * 저장 경로: /api/uploads/posts/{post_id}/{uuid}.{ext}
    * 응답에는 다운로드 URL 포함. 다운로드는 별도 GET /attachments/{id}/download (스트리밍, 원본 이름으로 Content-Disposition).

웹:
- web/app/(public)/notice 등 카테고리별 라우트 그룹은 일단 notice 한 개만.
- 목록(SSR) → 상세(SSR). 작성/수정 폼은 클라이언트 컴포넌트.
- 디자인은 내가 Claude Design 에서 export 해서 컴포넌트 단위로 줄 거니, 너는 데이터 바인딩과 폼 검증만 채운다. 임의로 마크업 바꾸지 마라.
- 이미지 표시는 next/image 사용. next.config 의 remotePatterns 에 recpc 도메인 추가하는 코드를 보여줘라.

확인 절차:
- 글 작성 → 목록에 노출 → 첨부파일 업로드 → 다운로드 → 삭제 시 파일도 삭제되는지 확인.
```

### Phase 4 — 운영자 페이지·일정·검색·페이지네이션

```
Phase 4: 관리 기능과 UX 다듬기.

- /admin 라우트 그룹: role=admin 만 접근. 사용자 목록·역할 변경, 게시물 일괄 관리.
- 메인 페이지에 다가오는 일정(event_date 미래) 위젯.
- 검색은 일단 LIKE %q% 로 충분. 나중에 FULLTEXT 인덱스 전환 가능하도록 SQL 주석으로 표시.
- 목록 페이지네이션: cursor 말고 page/perPage 로 단순하게.
- 접근성: 폼 라벨, 키보드 포커스, 한국어 폰트(Pretendard 권장)는 web/app/layout.tsx 에서 한 번에 처리.

이 Phase 끝에 Lighthouse 점수와 개선 가능 지점을 짧게 보고하라.
```

### Phase 5 — 배포

```
Phase 5: 두 갈래로 배포.

1) /web → Vercel
   - 환경변수 NEXT_PUBLIC_API_BASE_URL = https://<recpc 공개 도메인>/api
   - 프리뷰 도메인도 PHP 의 ALLOWED_ORIGINS 에 추가하는 방법을 안내.

2) /api → recpc
   - 업로드 절차(FTP/SFTP/scp 중 가능한 것)를 README 에 정리.
   - config.php 는 서버에서 직접 작성하도록 안내(저장소에 올리지 않음).
   - /api/uploads 디렉터리 권한(쓰기 가능) 안내.
   - .htaccess 가 동작하는지 확인하는 헬스체크 절차.

3) 도메인이 다른 경우 CORS, 같은 도메인 서브패스로 묶는 경우 리버스 프록시 옵션을 비교해 짧게 추천.

4) 운영 체크리스트(백업, 로그 위치, JWT 시크릿 로테이션 방법)를 README 의 "운영" 섹션으로 추가.
```

---

## (D) 자주 어긋나는 지점 — 미리 못 박아둘 것

- **CORS는 코드 한 줄이 아니라 "Origin 화이트리스트 + Vary: Origin + OPTIONS 200"** 세 가지가 같이 가야 합니다. Claude Code가 한 줄짜리 `Access-Control-Allow-Origin: *` 으로 끝내려 하면 거부하세요. JWT를 쓰는 순간 와일드카드는 안 됩니다.
- **PHP가 어쩌다 HTML 한 글자라도 출력하면 JSON 파싱이 깨집니다.** `<?php` 앞 공백, BOM, `?>` 뒤 줄바꿈을 모두 제거하라고 헌법에 박혀 있는지 확인하세요.
- **이미지 next/image 사용 시 `next.config.js`의 `images.remotePatterns`** 에 recpc 도메인을 등록하지 않으면 프로덕션에서 깨집니다. Phase 3에서 반드시 챙기세요.
- **JWT를 localStorage에 두는 건 1단계 타협입니다.** XSS 위험이 있으니 운영 단계에서는 httpOnly 쿠키 + SameSite=Lax + CSRF 토큰 패턴으로 바꾸는 걸 README에 todo로 남기게 했습니다.
- **파일 업로드 디렉터리는 절대 PHP 실행 가능 영역과 겹치면 안 됩니다.** `/api/uploads/.htaccess` 에 `php_flag engine off` 한 줄을 넣게 Phase 3 끝에 추가 지시하시면 좋습니다.

---

## 사용 순서 요약

1. Claude Code 새 세션 → **(A) 헌법** 붙여넣기
2. **(B) 부트스트랩** → 폴더/스켈레톤 생성, 헬스체크 통과 확인
3. **Phase 1** SQL 실행, 관리자 비번 해시 생성
4. **Phase 2** 로그인 동작 확인 (curl + 브라우저)
5. **Phase 3** 디자인 export 받아서 화면 붙이고 게시물·첨부 동작 확인
6. **Phase 4** 관리자/검색/일정
7. **Phase 5** Vercel + recpc 배포

각 Phase가 끝날 때마다 "다음 Phase로 가도 될까요?" 라고 물어보게 헌법에 적어 뒀으니, 한 번에 너무 많이 만들어서 디버깅이 늘어지는 일은 줄어들 겁니다.