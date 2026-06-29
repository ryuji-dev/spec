# admin UI 리디자인 Phase 2 — 목록 표 다크 리스타일

**Goal:** Phase 1에서 도입한 웜 다크+골드 셸 위에서, 각 admin 목록 페이지의 속내용(표·아코디언·행 액션)을 셸 테마와 일관되게 다크 리스타일한다.

**Architecture:** Phase 1 셸이 정의한 `--admin-*` CSS 변수를 그대로 소비하는 공용 클래스를 `ui.module.css`에 추가하고, 각 목록 페이지의 라이트 인라인 스타일(`#ccc`·`#06c`·`#888` 등)과 `<main maxWidth>` 래퍼를 제거해 클래스 기반으로 교체한다. 레이아웃은 셸 `.content`가 제공하므로 페이지는 `styles.page`로 단순화.

**Tech Stack:** Next.js 16 App Router(Server Component), CSS Modules, 기존 Server Action 바인딩 유지.

---

## 범위

- **공용 스타일**: `_components/ui.module.css` — 표(`tableWrap`/`table`/`cellTitle`/`cellMuted`/`emptyCell`), 헤더(`headerRow`/`btnGhost`), 행 액션(`rowActions`/`rowLink`/`rowDanger`), 공개 토글(`toggleBtn`/`toggleOn`/`toggleOff`), 핀(`pin`), 문의 아코디언(`backLink`/`inquiryItem`/`inquirySummary`/`statusDone`/`statusNew`/`inquiryBody`), 폼(`fieldLabel`/`textarea`/`btnDanger`)
- **공용 버튼 2**: `DeletePostButton`, `PublishToggle` — 인라인 색상 → 공용 클래스
- **표 목록 10**: notice·training·committee·webzine·resources·events·hero·faculty·timetable·collections
- **아코디언 1 + 폼 2**: inquiries/page·AnswerForm·DeleteInquiryButton

## 작업 원칙

- 데이터 경로·Server Action·권한 재확인(`requireAdmin`)·컬럼 구성은 그대로 두고 **표현만** 교체.
- 표는 `tableWrap`으로 감싸 모바일에서 가로 스크롤(`overflow-x:auto` + `min-width`), 페이지 가로 넘침 없음.

## 검증

- `npx tsc --noEmit` / `pnpm lint` / `pnpm build` 통과.
- 로컬 e2e: 데이터 있는 목록(강습회 4행) 다크 표·골드 링크/토글, 사이드바 active 전환, 콘솔 에러 0건, 모바일 375px 가로 스크롤 동작.
