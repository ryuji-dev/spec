# TODO — 서경노회 교육부 홈페이지

> 작업 큐 + Claude Code에 던질 후속 작업 프롬프트 보관소.
> 프로젝트 **헌법(원칙·통신 규약·보안·코드 컨벤션 등)** 은 `CLAUDE.md`가 진실의 원천이다.
> 본 파일은 *남은 작업과 그 프롬프트* 만 다룬다.

---

## 0. 백엔드 구조 (확정)

✅ **(B) 로컬 APM + Cloudflare Tunnel** — PHP 8.x + MySQL on `recpc`. 자세한 통신 규약·보안 기본기는 `CLAUDE.md` 참조.

> 무료 운영 + 기존 자산 활용을 동시에 만족하는 (B)로 결정. Cloudflare Tunnel 셋업은 배포 시점에.

---

## 1. 디자인 이식 (Claude Design HTML → Next.js)

- [x] **랜딩페이지 이식** — `frontend/src/app/page.tsx` (PR #1)
  - 4개 폰트 self-host, 정중앙 정렬 보정, 휠 스크롤 → `/main` 진입, 배경 WebP 교체 포함
- [ ] 메인페이지 이식 — `frontend/_design/.../서경노회 교육위원회 메인페이지.html` + `app.jsx` 컴포넌트 활용
- [ ] 공통 레이아웃(헤더/푸터/네비게이션) 분리
- [ ] 모바일 반응형 검증

---

## 2. v1 페이지 골격

- [x] `/` 랜딩
- [ ] `/main` 메인 (게시물 카드·일정 위젯)
- [ ] `/about` 노회 교육부 소개
- [ ] `/notice` 공지사항
- [ ] `/schedule` 일정 (강습회·성경고사·찬양대회)
- [ ] `/resources` 자료실 (주일학교 교육 자료)
- [ ] `/contact` 연락처

---

## 3. 백엔드 골격 (Phase 0 후반부)

> 헌법 [3][4][6] 통신 규약·폴더 구조·응답 스키마를 따른다.

```
backend/ 폴더에 PHP 백엔드 골격을 만든다.

1) backend/index.php : 라우팅 디스패처 (단순 switch 라우터)
2) backend/lib/cors.php : CORS 헤더 + OPTIONS 200 종료. 허용 Origin은 config에서 가져옴.
3) backend/lib/db.php  : PDO 인스턴스 반환 (ERRMODE_EXCEPTION).
4) backend/lib/jwt.php : jwt_encode / jwt_decode (HS256). 외부 라이브러리 사용한다면 이유와 설치 명령 안내.
5) backend/lib/respond.php : json_ok($data) / json_err($code, $message, $http=400) 헬퍼.
6) backend/config.example.php : DB 접속·JWT_SECRET·ALLOWED_ORIGINS 예시. 실제 config.php는 .gitignore.
7) backend/.htaccess : 모든 요청을 index.php로 리라이트.
8) backend/routes/health.php : GET /health → { ok: true, data: { status: "ok", time: <ISO> } }

동시에 frontend/ 쪽:
9) frontend/src/lib/api.ts : apiGet<T>/apiPost<T> 단일 래퍼. 응답 스키마 파싱, 실패 시 ApiError(code, message) throw. 베이스 URL은 NEXT_PUBLIC_API_BASE_URL.
10) frontend/.env.local.example : NEXT_PUBLIC_API_BASE_URL 키 예시.

작업 후 알려줄 것:
- 헬스체크 curl 한 줄
- 채워야 하는 환경변수/설정값 목록
```

- [ ] backend/ 골격 + frontend API 래퍼
- [ ] 로컬 APM에서 health 엔드포인트 동작 확인

---

## 4. DB 스키마와 시드 (헌법 Phase 1)

```
backend/sql/001_init.sql 작성:
- churches: id, name, region, created_at
- users: id, email(unique), password_hash, name, role(enum: 'admin','teacher','viewer'),
         church_id(FK churches.id, nullable), created_at, updated_at
- posts: id, category(enum: 'notice','training','exam','choir','resource'),
         title, body(LONGTEXT), author_id(FK users.id), is_published(bool),
         event_date(nullable), created_at, updated_at
- attachments: id, post_id(FK), original_name, stored_name, mime, size_bytes, created_at
- 모든 테이블 utf8mb4_unicode_ci.

backend/sql/002_seed.sql : admin 1, 샘플 교회 2, 샘플 공지 2.
비밀번호는 password_hash 결과를 직접 박지 말고 "여기에 password_hash 결과를 붙여넣을 것" 주석.

backend/scripts/make_admin_password.php : CLI 인자로 평문 받아 해시 출력하는 1회용 스크립트.

알려줄 것:
- recpc phpMyAdmin/mysql CLI에서 실행할 정확한 순서
- make_admin_password.php 사용 예시
```

- [ ] 001_init.sql, 002_seed.sql, make_admin_password.php

---

## 5. 인증 (헌법 Phase 2)

```
인증 API:
- POST /auth/login   body: {email, password} → {ok, data:{token, user}} / 실패 401
- GET  /auth/me      header: Authorization Bearer → {ok, data:{user}}
- POST /auth/register : admin role JWT만 허용. body: {email, password, name, role, church_id?}
- 토큰 만료 7일.
- 잘못된/만료 토큰 에러코드: AUTH_INVALID, AUTH_EXPIRED.

backend/routes/ 아래 auth_login.php, auth_me.php, auth_register.php 분리.
backend/index.php 라우터에 등록.

frontend:
- frontend/src/lib/auth.ts : login(email,password) / logout / getStoredToken / setStoredToken.
  토큰은 localStorage(레벨 1). README에 "추후 httpOnly 쿠키로 강화" 메모.
- frontend/src/app/(auth)/login/page.tsx : 임시 디자인. 로그인 후 /dashboard 이동.
- frontend/src/app/dashboard/page.tsx : 임시. /auth/me 결과 출력.
- 인증 가드 패턴(middleware.ts vs layout) 한 가지 결정 + 이유를 README 1단락.

확인:
- curl /auth/login → 토큰
- curl /auth/me → 본인 정보
- 브라우저 로그인 → 대시보드 진입
```

- [ ] 인증 API + 클라이언트 + 가드

---

## 6. 게시물 CRUD + 파일 업로드 (헌법 Phase 3)

```
API:
- GET  /posts?category=&page=&q=     공개 (is_published=true 만)
- GET  /posts/{id}                    공개 (attachments 포함)
- POST /posts        teacher/admin    body: {category,title,body,event_date?,is_published?}
- PATCH /posts/{id}  작성자 또는 admin
- DELETE /posts/{id} 작성자 또는 admin
- POST /posts/{id}/attachments  multipart/form-data, field=file
    * 확장자 화이트리스트: jpg,jpeg,png,webp,pdf,hwp,docx,xlsx,pptx
    * 최대 20MB
    * 저장: /backend/uploads/posts/{post_id}/{uuid}.{ext}
    * 응답에 다운로드 URL 포함. 다운로드는 GET /attachments/{id}/download (스트리밍, 원본 이름 Content-Disposition).
    * /backend/uploads/.htaccess 에 php_flag engine off 추가 (PHP 실행 차단).

웹:
- frontend/src/app/(public)/notice 등 카테고리별 라우트 그룹. 일단 notice만.
- 목록(SSR) → 상세(SSR). 작성/수정 폼은 클라이언트 컴포넌트.
- 디자인은 Claude Design export로 받아 컴포넌트 단위 이식 — 데이터 바인딩·폼 검증만 추가, 마크업 임의 변경 금지.
- 이미지 표시는 next/image. next.config의 remotePatterns에 recpc 도메인 등록.

확인:
- 글 작성 → 목록 노출 → 첨부 업로드 → 다운로드 → 삭제 시 파일도 같이 삭제
```

- [ ] posts CRUD + attachments + 이미지 표시

---

## 7. 운영자·일정·검색·페이지네이션 (헌법 Phase 4)

```
- /admin 라우트 그룹: role=admin 만. 사용자 목록·역할 변경, 게시물 일괄 관리.
- 메인에 다가오는 일정(event_date 미래) 위젯.
- 검색은 LIKE %q% (FULLTEXT 전환 가능하도록 SQL 주석).
- 페이지네이션: page/perPage.
- 접근성: 폼 라벨, 키보드 포커스, 한국어 폰트(Noto Sans KR — 이미 layout에 적용).

Lighthouse 점수 + 개선 가능 지점 짧게 보고.
```

- [ ] 관리자 페이지 + 일정 위젯 + 검색 + 페이지네이션

---

## 8. 배포 (헌법 Phase 5)

```
1) frontend → Vercel
   - NEXT_PUBLIC_API_BASE_URL = https://<recpc 공개 도메인>/api (Cloudflare Tunnel 후 결정)
   - 프리뷰 도메인을 PHP ALLOWED_ORIGINS에 추가하는 절차 안내

2) backend → recpc
   - 업로드 절차(SFTP/scp) README 정리
   - config.php는 서버에서 직접 작성 (저장소 X)
   - /backend/uploads 권한 설정
   - .htaccess 동작 헬스체크

3) 도메인 다른 경우 CORS, 같은 도메인 서브패스(리버스 프록시) 비교 권장안

4) 운영 체크리스트(백업·로그 위치·JWT 시크릿 로테이션) → README "운영" 섹션
```

- [ ] Vercel + recpc 배포 + Cloudflare Tunnel 셋업

---

## v2 백로그 (네이버 카페형 — 단계적 도입)

- [ ] 회원가입 (admin 외 셀프 가입)
- [ ] 게시판 카테고리 다양화
- [ ] 댓글
- [ ] 알림 (이메일/카톡 등)

---

## 자주 어긋나는 지점 (체크리스트)

각 단계에서 점검:

- **CORS**는 한 줄이 아니라 "Origin 화이트리스트 + Vary: Origin + OPTIONS 200" 세 가지 같이. 와일드카드 `*`는 JWT 쓰는 순간 안 됨.
- **PHP가 어쩌다 HTML 한 글자라도 출력하면 JSON 파싱 깨짐.** `<?php` 앞 공백·BOM·`?>` 뒤 줄바꿈 모두 제거.
- **next/image 사용 시** `next.config.ts`의 `images.remotePatterns`에 recpc 도메인 등록.
- **JWT는 localStorage = 1단계 타협** (XSS 위험). 운영 단계에서 httpOnly 쿠키 + SameSite=Lax + CSRF 토큰으로 전환.
- **파일 업로드 디렉터리는 PHP 실행 가능 영역과 분리.** `/backend/uploads/.htaccess`에 `php_flag engine off`.

---

## 메모

- 디자인 원본: `~/Downloads/Seogyeong Presbytery Education Committee-handoff.zip` → `frontend/_design/` (gitignore)
- 로컬 APM 서버 별칭: `recpc`
- 헌법(원칙·규약·보안 등): **`CLAUDE.md`** 가 진실의 원천
