# 고객지원(문의) + 약관·개인정보 페이지 (설계)

> 작성일 2026-06-11 · 선행: 이메일 미사용 인증 전환(merged·운영 반영)
> 범위: ① 고객지원 문의 접수·관리·답변, ② 이용약관·개인정보 처리방침 페이지. 실행은 2단계(A: 고객지원, B: 약관)로 나눈다.

## 배경 / 동기

- 이메일 발송을 안 쓰므로 **비밀번호 분실 사용자는 인앱 답변도 받을 수 없다**(로그인 불가). 따라서 분실 문의는 오프라인 연락처가 필수.
- 회원가입 약관 동의 링크가 현재 placeholder(`#`). 개인정보 수집(가입: 이메일·성함·소속교회 / 문의: 이름·이메일·연락처)이 실제로 일어나므로 약관·처리방침 페이지가 필요.
- 로그인 화면 "분실 시 관리자에게 문의" 안내를 실제 고객지원 페이지로 연결.

## 현재 상태 (확인됨)

- admin 페이지(`src/app/(admin)/admin/page.tsx`)에 계정 생성·비밀번호 재설정 폼 존재. `requireAdmin()` + `proxy.ts`의 `/admin/:path*` 가드.
- 콘텐츠 페이지는 `server/services`(읽기)·`server/actions`(쓰기) + zod, RLS 1차 경계 패턴. 마이그레이션은 `supabase/migrations/*.sql`, 타입은 `pnpm db:types`.
- 디자인 원본이 없는 신규 페이지 → `DesktopNav(variant="solid")` + 팔레트 토큰 기반 문서형 레이아웃으로 구성(기존 콘텐츠 페이지 헤더 패턴 재사용).
- 인증: 공개 가입 + 이메일 미사용. 비밀번호 분실은 admin이 임시 비밀번호 발급(`adminResetPassword`) 후 연락처로 전달.

---

## A. 고객지원 (문의 접수·관리·답변)

### A1) DB — `inquiries` 테이블 (신규 마이그레이션)

```
id           uuid pk default gen_random_uuid()
user_id      uuid null references profiles(id) on delete set null   -- 로그인 작성 시 연결
category     text not null check (category in ('general','password'))
name         text not null check (char_length(name) between 1 and 50)
email        text not null check (char_length(email) <= 254)
contact      text null check (contact is null or char_length(contact) <= 100)  -- password 유형 필수(앱·아래 RLS 외 zod로 강제)
body         text not null check (char_length(body) between 1 and 2000)
answer       text null check (answer is null or char_length(answer) <= 2000)
answered_at  timestamptz null
created_at   timestamptz not null default now()
```
- 인덱스: `created_at desc`.
- **RLS** (모든 테이블 RLS on):
  - `insert`: anon·authenticated 허용. **단 `user_id`는 null 이거나 `auth.uid()`와 일치**해야 함(타인 명의 위조 차단) — `with check`.
  - `select`: admin 전체(`auth_is_admin()`) **또는** 본인(`user_id = auth.uid()`).
  - `update`·`delete`: admin만.
- `pnpm db:types`로 `database.types.ts` 재생성.

### A2) 사용자 `/support` (공개 페이지)

- 상단 안내: 일반 문의는 로그인 후 답변 열람 / 비밀번호 분실은 연락처로 회신.
- **문의 폼** (client + `submitInquiry` Server Action):
  - 유형 선택(라디오/셀렉트): `일반 문의` | `비밀번호 분실`.
  - 공통: 이름·이메일·내용. 로그인 시 이름·이메일 자동 채움(수정 가능).
  - **연락처(전화·카톡 등 자유 입력) 필드**: 인앱 답변을 받을 수 없는 경우 — 즉 **비로그인 작성 또는 `비밀번호 분실` 유형** — 노출 + 필수. "로그인이 안 되므로 답변은 입력하신 연락처로 드립니다" 안내. 로그인 일반 문의는 연락처 불필요(인앱 답변).
  - honeypot 숨김 필드(`company` 등)로 단순 봇 차단.
- `submitInquiry`: zod 검증(`inquirySchema` — `category` enum), `user_id`는 **서버가 세션에서 결정**(폼 입력 무시). **연락처 필수 판정은 서버에서**: 세션이 없거나(`user_id` null) `category='password'`이면 `contact` 필수. 성공 시 "접수되었습니다" 상태.
- **내 문의 내역**(로그인 시): 본인 문의 목록(유형·작성일·답변상태), 답변완료면 답변 펼쳐보기. RLS select(본인)로 안전.

### A3) 관리자 `/admin/inquiries`

- 별도 라우트(`(admin)` 그룹, `/admin/:path*` 가드에 포함) — page에서 `requireAdmin()` 재확인.
- 목록(최신순): **이름 · 이메일 · 유형 · 작성일 · 답변상태**. 행 펼침 → 본문·연락처 표시.
- 처리:
  - 일반: **답변 작성**(`answerInquiry` 액션 → `answer`·`answered_at` 저장).
  - 비밀번호 분실: `/admin`에서 임시 비밀번호 발급(기존 `adminResetPassword`) → 연락처로 전달 → **완료 처리**(답변에 "처리 완료" 등 기록, 같은 `answerInquiry` 사용).
- 단순 유지: 검색·페이지네이션 없음(소규모). admin 메인에 `/admin/inquiries` 링크 추가.
- 서비스 함수 `server/services/inquiry.ts`(목록·상세 조회), 액션 `server/actions/inquiry.ts`(`submitInquiry`·`answerInquiry`).

### A4) 연결

- 로그인 화면 "분실 시 관리자에게 문의" → `/support` Link.
- (선택) 전역 헤더/푸터에 고객지원 링크 — 기존 네비 구조 확인 후 최소 침습.

---

## B. 약관·개인정보 페이지

### B1) `/terms`·`/privacy` (정적 공개 페이지)

- A2/A3와 공유하는 **문서형 레이아웃 컴포넌트**(`_components`에 `LegalLayout` 또는 단순 page 내 스타일) — DesktopNav(solid) + 본문 컨테이너.
- 본문은 **표준 초안을 작성**(비영리 교육 커뮤니티 기준):
  - 이용약관: 서비스 목적·회원 의무·게시물 책임·면책·문의처(고객지원).
  - 개인정보 처리방침: 수집 항목(가입 — 이메일·성함·소속교회 / 문의 — 이름·이메일·연락처), 이용 목적, 보유·파기, **처리위탁·국외이전 고지(Supabase=AWS Seoul, Vercel)**, 정보주체 권리, 문의처.
- **사용자 검토 필수**(법적 문구라 초안 → 확정).

### B2) 연결

- `SignupForm`의 약관 링크(`<a href="#">이용약관</a>`·`개인정보 처리방침`) → `/terms`·`/privacy` Link로 교체.

---

## 보안

- RLS가 1차 경계(insert user_id 위조 차단, select 본인/admin, 변경 admin만). 액션 진입부 권한 재확인(`answerInquiry`는 `requireAdmin`).
- 입력은 zod + DB check 이중. honeypot로 봇 1차 차단(메일 미사용이라 rate-limit은 Supabase 기본 의존).
- `proxy.ts`: `/support`·`/terms`·`/privacy` 공개(가드 불필요), `/admin/inquiries`는 기존 `/admin/:path*` 매처에 포함됨.

## 검증 (lint/build + 로컬 e2e)

- 마이그레이션: `supabase db reset` 후 RLS 동작 — anon insert 가능, 타 user_id 위조 insert 거부, 비로그인 select 차단(본인/ admin만).
- `/support`: 일반·분실 유형 제출 → DB 적재, 분실은 연락처 필수 검증. 로그인 시 내 내역 열람, 타인 문의 비열람.
- `/admin/inquiries`: 목록(이름·이메일·작성일·상태) 표시, 답변 작성 → 사용자측 답변완료 반영. 비admin 접근 차단.
- `/terms`·`/privacy` 렌더, 회원가입·로그인 링크 연결.
- `pnpm lint`/`build`, `pnpm db:types` 최신.

## 실행 분리 (plan 단계)

- **A 단계(고객지원)**: 마이그레이션·RLS → services/actions → `/support` → `/admin/inquiries` → 링크 → e2e.
- **B 단계(약관)**: 문서형 레이아웃 → `/terms`·`/privacy` 초안 → 회원가입 링크 연결 → 사용자 검토.
- 두 PR로 머지(고객지원 먼저). 약관 본문은 사용자 확정 게이트.

## 범위 밖 (후속)
- 문의 답변 알림(이메일/푸시 — 메일 미사용), 첨부파일, 문의 검색·페이지네이션.
- Google OAuth, 디자인 이식 잔여 페이지.
