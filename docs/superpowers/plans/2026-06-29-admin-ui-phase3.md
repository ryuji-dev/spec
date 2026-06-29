# admin UI 리디자인 Phase 3 — 신규/편집 폼 다크 리스타일

**Goal:** 목록(Phase 2)에 이어, admin 신규·편집 폼 화면의 입력 요소를 셸 테마와 일관되게 다크 리스타일해 목록↔편집 사이 톤 단절을 없앤다.

**Architecture:** Phase 2에서 만든 `ui.module.css` 폼 키트를 확장(`field`/`checkLabel`/`fieldset`/`inputSm`/`btnAdd`/`btnRemove` 등)하고, 도메인별 폼 컴포넌트와 new/edit 페이지 래퍼의 인라인 라이트 스타일(`inputStyle`·`#ccc`·`#c00`·`#666`)을 클래스로 교체한다. 폼 maxWidth 등 구조적 인라인 스타일은 유지.

**Tech Stack:** Next.js 16 App Router(Server/Client Component), CSS Modules, useActionState, 기존 Server Action·zod 검증 유지.

---

## 범위

- **공용 스타일**: `_components/ui.module.css` 폼 키트 추가 — `inputSm`·`field`·`checkLabel`·`fieldset`·`legend`·`fieldsetTitle`·`subPanel`·`checkItem`·`hint`·`btnAdd`·`btnRemove`, 체크박스 `accent-color`
- **폼 컴포넌트 11**: notice·training·committee·webzine·resources(ResourceEditorForm)·events·faculty·timetable·collections(EditorForm) + hero(EditForm·NewForm)
- **new/edit 페이지 래퍼 22**: 11개 도메인 × (new + [id]/edit) — `<main maxWidth>`→`styles.page`, h1→`pageHeader/pageTitle`, 백링크→`backLink`, 삭제 버튼→`btnDanger`
- **AttachmentManager**(admin 편집 전용 3곳): 다크 fieldset·골드 링크·danger 삭제로 교체

## 작업 원칙

- 데이터 흐름·Server Action·zod 검증·필드 구성·동적 추가/삭제 로직은 그대로, **표현만** 교체.
- 폼별 maxWidth, grid 레이아웃 등 구조적 인라인 스타일은 유지(테마 색·테두리만 클래스화).

## 검증

- `npx tsc --noEmit` / `pnpm lint` / `pnpm build` 통과.
- 로컬 e2e: events 신규 폼(다크 입력·select·date·fieldset·골드 추가/danger 삭제 버튼), training 편집 폼(값 프리필·백링크·danger 삭제·AttachmentManager 다크), 콘솔 에러 0건.
