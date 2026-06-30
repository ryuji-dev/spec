-- public 스키마 테이블·시퀀스 권한 보정.
--
-- 배경: 마이그레이션은 postgres 역할로 테이블을 생성한다. 그런데 전체 DML 기본권한은
-- supabase_admin grantor에만 설정돼 있고, postgres grantor 기본권한은 구조 권한
-- (REFERENCES/TRIGGER/TRUNCATE/MAINTAIN)만 부여한다. 그 결과 PostgREST 역할
-- (anon/authenticated/service_role)이 테이블 DML 권한을 받지 못해 "permission denied"가 난다.
--
-- 보안 모델: 행 단위 접근은 RLS가 통제한다(모든 테이블 RLS 활성 + 정책 보유). 테이블 권한은
-- Supabase 표준대로 넓게 부여하고 실제 접근은 RLS가 막는다 — 권한 부여 자체는 안전하다.
-- (함수 권한은 손대지 않는다: init이 custom_access_token_hook의 anon/authenticated 실행을
--  의도적으로 revoke했으므로 일괄 grant는 금지.)

-- 1) 기존 테이블·시퀀스 권한 보정
grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

-- 2) 향후 postgres가 생성하는 테이블·시퀀스에도 자동 적용(재발 방지)
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
