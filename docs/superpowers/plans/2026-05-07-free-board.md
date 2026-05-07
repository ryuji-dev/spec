# 자유게시판(/board) 페이지 이식

## 배경

글로벌 네비 항목 중 자유게시판(`main-page-data.ts:122`, `key: "board"`)이 라우트 미연결 상태였다. 디자인 핸드오프 번들이 도착(`서경노회 자유게시판.html` + `community.jsx` 1481줄)했고, `/training` 작업과 동일한 흐름으로 이식한다.

## 결정 사항

- **라우트**: `/board` — `main-page-data.ts` `key: "board"`와 일치, 기존 단일 단어 컨벤션(`/webzine`·`/committee`·`/training`) 준수
- **브랜치**: `feat/free-board`
- **분기 기준**: `main` (clean, 최신 `d2efaf1`)
- **팔레트**: forest 단일 적용 (`@/app/_components/shared/palette` 의 `FOREST_PALETTE` 재사용)
- **디바이스 분기**: `/training`과 동일하게 `getDeviceType` 기반 SSR 분기 (desktop / ios / android)
- **컴포넌트 분리**: 데스크톱은 섹션별 파일, 모바일은 단일 파일

## 파일 구조

### 신규
- `frontend/src/lib/board-data.ts` — `CM_HOT`/`CM_FEED`/`CM_CATEGORIES`/`CM_MEMBERS`/`CM_TAGS`/`CM_VERSE` + 타입
- `frontend/src/app/board/page.tsx` — SSR UA 분기
- `frontend/src/app/board/_components/catTone.ts` — 카테고리별 색·아이콘
- `frontend/src/app/board/_components/shared/`
  - `CmAvatar.tsx`, `CmCatChip.tsx`, `HeatGauge.tsx`, `FeedCover.tsx`
- `frontend/src/app/board/_components/desktop/`
  - `BoardDesktop.tsx` (조합 + 상태)
  - `BoardHeader.tsx` (히어로 + 오늘의 한 줄 + 통계)
  - `HotSection.tsx`, `HotThreadCard.tsx`
  - `CategoryStickyBar.tsx` (카테고리 + 정렬, sticky)
  - `Composer.tsx`, `FeedCard.tsx`, `BoardPagination.tsx`
  - `Sidebar.tsx` (Members/Tags/Guide/Categories 4종 export)
  - `BoardFooter.tsx`
- `frontend/src/app/board/_components/mobile/BoardMobile.tsx` — 단일 파일

### 수정
- `frontend/src/lib/main-page-data.ts:122` — 자유게시판 항목에 `href: "/board"` 추가

## 디자인 보존

- 모든 inline style·SVG·문구는 `community.jsx` 원본 그대로
- `class → className` 등 기계적 변환만 수행
- 디자인 원본의 `position: 'absolute'` FAB은 실제 뷰포트 기준 동작을 위해 `fixed`로 변환 (디자인 캔버스의 iPhone 프레임 안 vs 실제 모바일 뷰포트의 차이를 수용한 기계적 변환)

## 검증

- ✅ `pnpm lint` 통과
- ✅ `pnpm exec tsc --noEmit` 통과
- ✅ `pnpm build` 통과 — `/board` 동적 라우트 등록 확인
- 다음: 로컬 `pnpm dev` 후 데스크톱/모바일 분기 시각 확인

## 범위 외

- 백엔드 연동, 글 작성, 댓글, 좋아요/기도 카운트 인터랙션 — TODO.md Phase 3
- 정렬·필터 결과 실제 정렬 로직 — 시각 토글까지만 (mock 데이터는 `recent` 순서로 정렬됨)
