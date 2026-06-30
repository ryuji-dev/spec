# public 테이블 권한 보정 (DB grants) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** PostgREST 역할(anon/authenticated/service_role)이 public 테이블에 DML 권한이 없어 공개 페이지가 500(`permission denied`)·시드가 실패하는 문제를 마이그레이션으로 해소한다.

**Architecture:** 행 단위 접근은 RLS가 통제(모든 테이블 RLS+정책). 테이블 권한은 Supabase 표준대로 넓게 부여하고 실제 접근은 RLS가 막는다. 함수 권한은 손대지 않는다(`custom_access_token_hook`의 anon 실행은 init이 의도적으로 revoke).

**Tech Stack:** Supabase CLI 마이그레이션(SQL).

---

## 원인

- 마이그레이션은 `postgres` 역할로 테이블을 생성한다.
- 전체 DML 기본권한(`pg_default_acl`)은 `supabase_admin` grantor에만 설정돼 있고, `postgres` grantor 기본권한은 구조 권한(REFERENCES/TRIGGER/TRUNCATE/MAINTAIN)만 부여한다.
- 따라서 `postgres`가 만든 테이블은 anon/authenticated/service_role에 `SELECT/INSERT/UPDATE/DELETE`가 없다 → `permission denied`.

## 해결

`supabase/migrations/20260629130928_public_table_grants.sql`:
1. 기존 테이블·시퀀스에 `SELECT/INSERT/UPDATE/DELETE`(+시퀀스 usage/select)를 anon/authenticated/service_role에 부여.
2. `alter default privileges in schema public ...`로 향후 `postgres` 생성 객체에도 자동 적용(재발 방지).

### Task 1: 마이그레이션 + 검증

- [x] **Step 1:** grants 마이그레이션 작성
- [x] **Step 2:** `npx supabase db reset`(임시 grant 없는 깨끗한 상태)로 적용 → anon/authenticated/service_role이 `SELECT…DELETE` 보유 확인
- [x] **Step 3:** `pnpm seed`·`pnpm build` 성공, 익명 `/main` HTTP 200(이전 500 해소)·히어로 이미지 렌더 확인
- [x] **Step 4:** 커밋

## 운영 적용 주의

- 운영(Supabase 클라우드)이 동일 증상인지 먼저 확인 권장. 이 마이그레이션은 멱등(이미 권한이 있으면 no-op)이라 `db push` 시 안전하다.
