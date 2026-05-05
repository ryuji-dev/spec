# 메인페이지 Phase 2 — 인터랙션 추가

## 배경

Phase 1(PR #2, `feat/main`)에서는 헌법 [7]에 따라 디자인 마크업·CSS를 100% 보존한 정적 레이아웃까지만 구현했다. 그 결과 다음 4가지 인터랙션이 의도적으로 비활성 상태로 남아 있다.

1. 히어로 슬라이드는 첫 장(`idx=0`)에 정지
2. 켄번스 모션이 작동하지 않음 (트랜지션은 정의되어 있으나 활성 슬라이드의 `transform` 미정의)
3. 바텀탭은 `active=0`으로 고정
4. 모바일 헤더는 디자인 원본의 `StickyHeader_DISABLED` 상태로 빠져 있음

Phase 2에서 이 4가지를 디자인 원본(`_design/.../app.jsx`, `desktop.jsx`)의 동작 그대로 복원한다. 마크업·여백·색상·타이포는 일절 변경하지 않고, 필요한 컴포넌트만 `'use client'`로 승격한다.

## 작업 항목

### 1. 히어로 자동슬라이드 (모바일/데스크톱)
원본: `app.jsx:276-283`, `desktop.jsx:5-9` — `useState(0)` + `setInterval 5500ms`.

- `frontend/src/app/main/_components/mobile/HeroMobile.tsx` — `'use client'`, `useState`/`useEffect`, 점 클릭 핸들러
- `frontend/src/app/main/_components/desktop/DesktopHero.tsx` — 동일 패턴
- 점 클릭 시 자동 루프 타이머는 그대로 유지 (디자인 원본 동작)

### 2. 켄번스 모션
원본: `app.jsx:299-308`(모바일 `scale(1.08)`, slide별 `transformOrigin` 분기), `desktop.jsx:18-19`(데스크톱 `scale(1.06)`).

- `HeroMobile.module.css` — `.slide[data-active="true"] { transform: scale(1.08); }` + `data-origin` 분기로 transform-origin 변동
- `DesktopHero.module.css` — `.slide[data-active="true"] { transform: scale(1.06); }`

### 3. 모바일 바텀탭 클릭
원본: `app.jsx:1211` — `onChange(i)`.

- `frontend/src/app/main/_components/mobile/BottomTabBar.tsx` — `'use client'`, `useState` + `onClick`. 라우팅은 v2.

### 4. 모바일 헤더 스크롤 효과
원본: `app.jsx:1238-1294` (`StickyHeader_DISABLED`).

- 신규: `frontend/src/app/main/_components/mobile/MobileStickyHeader.tsx` + `MobileStickyHeader.module.css`
- `'use client'`, `useEffect` 안에서 `window.scroll` 리스너 등록·정리, `scrollY > 80` 시 `data-scrolled="true"`
- `position: fixed; top: 0` (사용자 결정: viewport 고정), `z-index: 25` (BottomTabBar 30보다 낮게)
- `MobilePage.tsx` 상단에 1줄 추가하여 통합 (페이지 자체는 server 유지)

## 변경 파일 (요약)

| 파일 | 변경 |
|---|---|
| `frontend/src/app/main/_components/mobile/HeroMobile.tsx` | client 승격, useState/useEffect, dot onClick |
| `frontend/src/app/main/_components/mobile/HeroMobile.module.css` | 활성 슬라이드 scale, data-origin 분기 |
| `frontend/src/app/main/_components/desktop/DesktopHero.tsx` | client 승격, useState/useEffect, dot onClick |
| `frontend/src/app/main/_components/desktop/DesktopHero.module.css` | 활성 슬라이드 scale 한 줄 |
| `frontend/src/app/main/_components/mobile/BottomTabBar.tsx` | client 승격, active state + onClick |
| `frontend/src/app/main/_components/mobile/MobileStickyHeader.tsx` | 신규 |
| `frontend/src/app/main/_components/mobile/MobileStickyHeader.module.css` | 신규 |
| `frontend/src/app/main/_components/mobile/MobilePage.tsx` | StickyHeader 삽입 |

데이터 스키마 변경 없음.

## Next.js 16 확인

`frontend/node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md` — 16에서도 `'use client'` 의미·사용법 동일. server component 내부에 client component를 import하는 패턴은 그대로 유효.

## 헌법 준수

- 마크업·Tailwind 클래스·CSS 값은 보존하고 **추가**만 한다.
- `'use client'`는 인터랙션 필요한 4개 파일에만. `MainPage`·`MobilePage`·`DesktopPage`는 server 유지.
- mock 데이터(`main-page-data.ts`) 변경 없음.

## 검증

1. `pnpm dev` → `http://localhost:3000/main`
   - 히어로가 5.5초마다 자동 전환 + 활성 슬라이드 7초 켄번스 (모바일·데스크톱)
   - 점 클릭으로 즉시 전환
   - 바텀탭 클릭 시 활성 표시 이동
   - 80px 이상 스크롤 시 모바일 상단에 헤더 페이드인
2. `pnpm lint`, `pnpm build` 통과

## 완료 후

`superpowers:finishing-a-development-branch` 스킬로 PR → 머지 → 브랜치 정리.
