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

## 로컬 개발 참고

`config.toml`의 `[auth.external.google]`·`[auth.external.kakao]` 블록은 `enabled = true`로 설정되어 있으나,
로컬에서 `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` 등 환경변수가 없으면 경고만 출력되고 기동은 정상적으로 진행된다.
로컬 OAuth 왕복 테스트(실제 Google·Kakao 동의 화면 → 콜백)는 운영 환경에서 검증한다.

## 검증(스모크)

- 운영 `/login`에서 Google·카카오 버튼 클릭 → 공급자 동의 → `/main` 복귀.
- Supabase Authentication → Users에 신규 사용자, `profiles`에 role=member 행 생성 확인.
