# "메인 히어로" → "메인 배너" 용어 변경 (PR3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development 또는 superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** 불명확한 "메인 히어로" 표현을 admin UI에서 "메인 배너"로 통일한다.

**Architecture:** 사용자 가시 텍스트만 변경한다. 라우트(`/admin/hero`)·코드 식별자(`hero`)·DB 테이블명·함수명·코드 주석은 모두 유지(비노출이라 변경 리스크만 큼).

**Tech Stack:** Next.js 16 App Router, TypeScript.

---

## 변경 대상(admin 가시 텍스트만)

- `src/app/(admin)/admin/_components/Sidebar.tsx` — 사이드바 라벨 `메인 히어로` → `메인 배너`
- `src/app/(admin)/admin/hero/page.tsx` — 제목 `메인 히어로 관리` → `메인 배너 관리`, 안내 `메인 히어로는` → `메인 배너는`
- `src/app/(admin)/admin/hero/new/page.tsx` — 제목 `새 히어로 슬라이드` → `새 배너 슬라이드`
- `src/app/(admin)/admin/hero/[id]/edit/page.tsx` — 제목 `히어로 슬라이드 수정` → `배너 슬라이드 수정`

## 유지(변경 금지)

- 라우트 `/admin/hero`, 식별자 `hero`, 테이블 `hero_slides`, 함수/컴포넌트명(`HeroSlides`, `listHeroForAdmin` 등)
- 공개측·lib의 코드 주석 내 "히어로"(디자인 개념 용어, 비노출)

### Task 1: 가시 텍스트 치환

- [ ] **Step 1: 4개 파일의 가시 텍스트만 치환**(위 목록대로)
- [ ] **Step 2: 잔여 확인** — `grep -rn "히어로" src/app/(admin)` 결과가 없어야 함
- [ ] **Step 3: 검증** — `npx tsc --noEmit && pnpm lint && pnpm build` 통과
- [ ] **Step 4: 커밋** — `refactor: 관리자 UI "메인 히어로" → "메인 배너" 용어 통일`
