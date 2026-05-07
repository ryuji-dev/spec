# 자료공유(/resources) 페이지 이식

## 배경

글로벌 네비 항목 중 자료공유(`main-page-data.ts:123`, `key: "library"`)가 라우트 미연결 상태였다. 디자인 핸드오프(`서경노회 자료공유.html` + `library.jsx` 1289줄)가 도착했고, 직전에 동일 흐름으로 완료된 `/training`·`/board` 이식과 같은 패턴으로 진행한다.

## 결정 사항

- **라우트**: `/resources` — 기존 단일 단어 컨벤션(`/webzine`·`/committee`·`/training`·`/board`) 준수. 디자인 원본의 `/library`보다 한국어 라벨("자료공유")의 의미를 더 직접적으로 반영.
- **브랜치**: `feat/resources`
- **분기 기준**: `main` (clean, 최신 `2eac8e2`)
- **팔레트**: forest 단일 적용 (`@/app/_components/shared/palette` 의 `FOREST_PALETTE` 재사용). 원본 코드 주석에 "메인 forest 팔레트 그대로 계승" 명시.
- **디바이스 분기**: `getDeviceType` 기반 SSR 분기 (desktop / ios / android) — `/board`와 동일.
- **컴포넌트 분리**: 데스크톱은 섹션별 파일, 모바일은 단일 파일.

## 컴포넌트 재사용 매핑

### 전역 `app/_components/shared/`에서 import (재사용)
- `FOREST_PALETTE` (palette.ts)
- `Palette` 타입 (palette.ts)

### 라우트 로컬 신규 작성 (디자인 보존 원칙상 통합 안 함)
- `_components/fileTone.ts` — 파일타입(ppt/pdf/score/doc/video/image)→`{label, color, soft, ext}` 매핑
- `_components/shared/FileIcon.tsx` — 파일타입별 인라인 SVG 아이콘 6종
- `_components/shared/CollectionCover.tsx` — spring/easter/teacher 그래디언트 SVG
- `_components/shared/LbCatLabel.tsx` — 카테고리 칩 + `LbCatSolid` + `lbCatTone()`
- `_components/shared/DownloadStat.tsx` — 다운로드 카운트 표시
- `_components/shared/DownloadBtn.tsx` — primary/ghost 다운로드 버튼

### 의식적으로 재사용 안 함
- `AuthorChip` — 자료공유는 업로더를 단순 텍스트로만 표시(아바타 없음)
- `StatRow` — views/comments/attach 형식 (자료공유는 다운로드 카운트만)
- `CatLabel` — board용 디자인 그대로라 자료공유 칩과 형태 다름

### 향후 통합 후보 (이번 PR 범위 밖)
카테고리 칩 3종(board `CmCatChip` + 자료공유 `LbCatLabel` + 전역 `CatLabel`), 카드 커버 그래디언트(training `CoverArt` + webzine `CoverArt` + 자료공유 `CollectionCover`) — 별도 리팩터 PR로 검토.

## 파일 구조

### 신규
- `frontend/src/lib/resources-data.ts` — `LB_FILES`/`LB_COLLECTIONS`/`LB_CATEGORIES`/`LB_TOP` + `RESOURCES_SORTS` + 타입
- `frontend/src/app/resources/page.tsx` — SSR UA 분기
- `frontend/src/app/resources/_components/fileTone.ts`
- `frontend/src/app/resources/_components/shared/{FileIcon, CollectionCover, LbCatLabel, DownloadStat, DownloadBtn}.tsx`
- `frontend/src/app/resources/_components/desktop/{ResourcesDesktop, ResourcesHeader, CollectionsSection, FilterStrip, FileGrid, FileList, ResourcesSidebar, ResourcesFooter}.tsx`
- `frontend/src/app/resources/_components/mobile/ResourcesMobile.tsx`

### 변경
- `frontend/src/lib/main-page-data.ts` — `자료공유` NavItem 에 `href: "/resources"` 추가

### `'use client'` 부착 기준
상태/이벤트 필요한 곳만:
- `ResourcesDesktop.tsx` — `activeCat`/`view`/`sort` 보유
- `FilterStrip.tsx` — 카테고리 클릭·정렬 변경·뷰 토글
- `ResourcesMobile.tsx` — `activeCat` 보유

`page.tsx`·`shared/*`·정적 데스크톱 섹션 컴포넌트는 Server Component 유지.

### BottomTabBar 재사용
모바일 하단 탭바는 `@/app/main/_components/mobile/BottomTabBar` 재사용 (`/board` 와 동일 패턴). 자체 상태 보유 컴포넌트라 prop 전달 없음.

### 글로벌 DesktopNav
`/board`·`/training`과 동일하게 page 단에서 `<DesktopNav variant="solid" />` 노출. 원본 `library.jsx` 의 `LbDesktopNav` 는 글로벌 DesktopNav 와 역할이 같아 별도 이식하지 않음. 메뉴 강조는 `usePathname` 으로 자동.

## 디자인 보존 규칙 (재확인)

- 마크업·클래스·인라인 스타일 변경 금지. 데이터 바인딩·라우팅·상태만 추가.
- HTML→JSX 기계적 변환만 (`class`→`className`, self-closing, 인라인 `style` 객체화).
- `dangerouslySetInnerHTML` 금지.
- 모든 외부 폰트는 글로벌 layout 의 `next/font` self-host 그대로 사용.

## 작업 단계 (커밋 단위)

1. **mock 데이터 추가** — `feat: 자료공유 mock 데이터 추가` (`c88c4f1`)
2. **페이지 디자인 이식** — `feat: 자료공유(/resources) 페이지 디자인 이식` (`354e328`)
3. **글로벌 네비 연결** — `feat: 글로벌 네비 자료공유 항목에 /resources 링크 연결` (`24d05bb`)
4. **plan 문서 보관** — 본 문서

## 검증

각 커밋 후, 그리고 PR 생성 전:

```bash
cd frontend
pnpm lint
pnpm tsc --noEmit
pnpm build           # /resources 가 동적 라우트로 등록되는지 확인
pnpm dev             # http://localhost:3000/resources 시각 확인
```

확인 체크리스트:
- [x] `pnpm lint`·`pnpm tsc --noEmit`·`pnpm build` 통과
- [x] curl 로 데스크톱·iPhone UA 모두 SSR 200 응답, 핵심 마커 검출
- [ ] 데스크톱 (1440px): 헤더(타이틀+통계+검색), 컬렉션 3종, sticky 필터 스트립, 그리드/리스트 토글, 사이드바(TOP5/업로드 가이드/파일타입 범례), 푸터
- [ ] 모바일 (402px): 스택 레이아웃, 수평 스크롤 컬렉션, sticky 카테고리 칩, 하단 BottomTabBar
- [ ] 카테고리 칩 클릭 시 필터링 동작
- [ ] 그리드 ↔ 리스트 토글 동작
- [ ] 정렬 select(최신/다운로드/이름) 동작
- [ ] 메인페이지 글로벌 네비에서 "자료공유" 클릭 시 `/resources` 이동, 현재 페이지 강조

체크되지 않은 항목은 사용자 시각 검증.

## 범위 외 (이번 PR에서 안 함)

- 백엔드 연동 (PHP API). 모든 데이터는 mock.
- 실제 파일 업로드/다운로드 기능. 버튼은 디자인만 보존.
- 검색 입력 동작 — 원본도 시각 요소 위주, 추후 별도 작업.
- 인증/권한 분기.

## 마무리

작업 완료 후 `superpowers:finishing-a-development-branch` 스킬로 PR 생성 → 머지 → 브랜치 삭제 한 큐 처리.
