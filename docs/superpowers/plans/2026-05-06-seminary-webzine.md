# 신학원웹진 페이지(/webzine) 이식 실행 plan

## Context

서경노회 교육부 홈페이지에 **신학원웹진** 페이지를 추가한다. 디자인 원본(`frontend/_design/.../webzine.jsx`, 870줄)을 Next.js 16 App Router 위에 100% 보존 이식. 이번 PR 범위는 mock 데이터 기반 정적 화면까지. 인쇄 전용 라우트와 백엔드 연동은 후속.

설계 산출물(spec): `docs/superpowers/specs/2026-05-06-seminary-webzine-design.md` (커밋 `8ac8172`)

**spec과의 차이 한 가지**: 원본 코드 충실성을 위해 `palette` prop을 유지한다(spec엔 prop 제거로 적혔으나 인라인 style 마크업 변경 폭이 커서 헌법 [7] 위반). `WEBZINE_PALETTE` 상수를 export해 `page.tsx`가 주입.

**브랜치**: `feat/seminary-webzine` (이미 생성·체크아웃 완료)

## 디렉터리 최종 형태

```
frontend/
├── _design/seogyeong-presbytery-education-committee/project/   ← 작업 시작 시 동기화
│   ├── 서경노회 신학원웹진.html
│   ├── 서경노회 신학원웹진-print.html
│   └── webzine.jsx
└── src/
    ├── app/
    │   └── webzine/
    │       ├── page.tsx                          ← Server Component
    │       ├── webzine.module.css
    │       └── _components/
    │           ├── desktop/
    │           │   ├── WebzineDesktop.tsx
    │           │   └── WebzineDesktop.module.css (필요 시)
    │           ├── mobile/
    │           │   ├── WebzineMobile.tsx          ← 'use client'
    │           │   └── WebzineMobile.module.css (필요 시)
    │           └── illustrations/
    │               ├── CoverWilderness.tsx
    │               └── CoverArt.tsx
    └── lib/
        ├── device.ts                              ← 신규
        └── webzine-data.ts                        ← 신규
```

## 단계별 실행 순서

각 단계 끝마다 동작 확인. Phase 단위 커밋(`feat:` prefix + 한국어 본문, Conventional Commits).

### 0단계 — plan 동기화
- `/Users/noah/.claude/plans/mellow-whistling-lagoon.md`(이 파일) 내용을 `docs/superpowers/plans/2026-05-06-seminary-webzine.md`로 복사 (CLAUDE.md 표준 경로). 이후 작업은 그쪽 파일 기준.
- 디자인 번들 동기화: `cp /Users/noah/Downloads/seogyeong-presbytery-education-committee/project/{서경노회\ 신학원웹진.html,서경노회\ 신학원웹진-print.html,webzine.jsx} frontend/_design/seogyeong-presbytery-education-committee/project/`
- `frontend/_design/`은 gitignore이므로 커밋되지 않음. 동기화만.

### 1단계 — 유틸·데이터 파일
**새 파일**:
- `frontend/src/lib/device.ts` — `getDeviceType(userAgent: string | null): 'desktop' | 'ios' | 'android'`
- `frontend/src/lib/webzine-data.ts` — 다음을 export:
  - 타입: `WebzinePalette`, `WebzineFeatured`, `WebzineArticle`, `WebzineCategory`, `WebzineBackIssue`
  - 상수: `WEBZINE_PALETTE`, `WZ_FEATURED`, `WZ_ARTICLES`, `WZ_CATEGORIES`, `WZ_BACK_ISSUES` — `webzine.jsx` 870줄에서 그대로 이식

**필드 명세** (이미 확인됨):
- `WebzinePalette`: `{ bg, surface, primary, secondary, accent, ink, muted, line }` 모두 string
- `WebzineFeatured`: `{ issue, category, title, subtitle, author, authorRole, date, read, cover }`
- `WebzineArticle`: `{ id, cat, tag, title, excerpt, author, date, read, cover }`
- `WebzineCategory`: `{ en, ko, count }`
- `WebzineBackIssue`: `{ vol, issue, date, theme }`

**검증**: `cd frontend && pnpm tsc --noEmit` → 0 에러

**커밋**: `feat: 신학원웹진 데이터·디바이스 판정 유틸 추가`

### 2단계 — 일러스트 컴포넌트
**새 파일**:
- `frontend/src/app/webzine/_components/illustrations/CoverWilderness.tsx`
  - `({ palette }: { palette: WebzinePalette })` props
  - `webzine.jsx`의 `CoverWilderness` SVG 그대로 이식
- `frontend/src/app/webzine/_components/illustrations/CoverArt.tsx`
  - `({ type, palette }: { type: 'book' | 'rural' | 'book2' | 'child' | 'history' | 'dialogue'; palette: WebzinePalette })` props
  - `webzine.jsx`의 `CoverArt` SVG 그대로 이식

**규칙**: SVG 마크업·`fill`/`stroke` 색 처리 모두 원본과 동일. JSX 변환은 `class→className`, self-closing 같은 기계적 변환만.

**커밋**: `feat: 신학원웹진 SVG 커버 일러스트 컴포넌트`

### 3단계 — 데스크탑 컴포넌트
**새 파일**:
- `frontend/src/app/webzine/_components/desktop/WebzineDesktop.tsx`
  - `({ palette }: { palette: WebzinePalette })` props
  - `webzine.jsx::WebzineDesktop` 본체를 그대로 옮김
  - 데이터는 `WZ_FEATURED`, `WZ_ARTICLES`, `WZ_CATEGORIES`, `WZ_BACK_ISSUES`를 `@/lib/webzine-data`에서 import
  - 일러스트는 `../illustrations/{CoverWilderness,CoverArt}` import
  - Server Component (상태 없음, `'use client'` 금지)
- `WebzineDesktop.module.css` — 필요 시. 원본이 인라인 style 위주면 이 파일 불필요

**검증 (이 단계 후)**: 4단계 page.tsx와 함께 동작 확인

**커밋**: `feat: 신학원웹진 데스크탑 컴포넌트 이식`

### 4단계 — 모바일 컴포넌트
**새 파일**:
- `frontend/src/app/webzine/_components/mobile/WebzineMobile.tsx`
  - 최상단 `'use client'`
  - `({ palette, deviceType }: { palette: WebzinePalette; deviceType: 'ios' | 'android' })` props
  - `useState`: `tab` 초기값 `0`, `cat` 초기값 `'전체'` (원본 그대로)
  - `webzine.jsx::WebzineMobile` 본체 그대로 이식 — 상단바·패딩의 `deviceType` 분기 로직 보존
  - 일러스트 import 동일

**커밋**: `feat: 신학원웹진 모바일 컴포넌트 이식`

### 5단계 — 페이지 라우트
**새 파일**:
- `frontend/src/app/webzine/page.tsx`
  ```tsx
  import { headers } from 'next/headers';
  import { getDeviceType } from '@/lib/device';
  import { WEBZINE_PALETTE } from '@/lib/webzine-data';
  import WebzineDesktop from './_components/desktop/WebzineDesktop';
  import WebzineMobile from './_components/mobile/WebzineMobile';

  export default async function WebzinePage() {
    const h = await headers();
    const device = getDeviceType(h.get('user-agent'));
    return device === 'desktop'
      ? <WebzineDesktop palette={WEBZINE_PALETTE} />
      : <WebzineMobile palette={WEBZINE_PALETTE} deviceType={device} />;
  }
  ```
- `frontend/src/app/webzine/webzine.module.css` — 필요 시 페이지 루트 배경·중앙정렬 보조

**검증**:
1. `cd frontend && pnpm dev` → `http://localhost:3000/webzine` 데스크탑 레이아웃 표시
2. Chrome DevTools → 디바이스 모드 → iPhone(iOS UA)로 새로고침 → iOS 모바일 변형
3. Pixel(Android UA)로 새로고침 → Android 모바일 변형
4. 모바일에서 카테고리/탭 클릭 동작 확인
5. 6종 SVG 커버(`book`, `rural`, `book2`, `child`, `history`, `dialogue`)가 기사 카드에 정상 매핑
6. `pnpm lint` 0 에러
7. `pnpm build && pnpm start` 프로덕션 빌드도 동일 동작

**커밋**: `feat: 신학원웹진 라우트(/webzine) + UA 기반 디바이스 분기`

### 6단계 — TODO·README 정리 (선택)
- `TODO.md`의 v1 페이지 목록에 `/webzine` 추가, 후속 항목(인쇄 전용·백엔드 연동) 적기
- 디자인 이식 섹션에 신학원웹진 체크박스 추가

**커밋**: `docs: TODO에 /webzine 이식 결과 반영`

### 7단계 — PR
- `git push -u origin feat/seminary-webzine`
- `gh pr create` (한국어 본문, summary + test plan 체크리스트)
- `superpowers:finishing-a-development-branch` 스킬 가이드 활용 가능

## 참고할 기존 코드

| 위치 | 참고 사항 |
|---|---|
| `frontend/src/app/main/page.tsx` | `_components/{desktop,mobile}/` 분리 패턴 |
| `frontend/src/app/main/_components/desktop/DesktopPage.tsx` | 섹션 컴포넌트 컴포지션 (이번엔 단일 컴포넌트라 더 단순) |
| `frontend/src/app/main/main.module.css` | CSS 변수로 팔레트 노출하는 패턴 (참고만) |
| `frontend/src/lib/main-page-data.ts` | mock 데이터 + 타입 정의 패턴 |
| `frontend/src/app/layout.tsx` | Noto Serif KR / Noto Sans KR / Inter 모두 등록됨 → 추가 불필요 |

## 핵심 검증 체크리스트

```bash
cd frontend
pnpm tsc --noEmit          # TypeScript strict 0 에러
pnpm lint                  # ESLint 0 에러
pnpm dev                   # 데스크탑 + 모바일 UA로 수동 확인
pnpm build && pnpm start   # 프로덕션 빌드 확인
```

수동 확인 사항:
- `/webzine` 데스크탑 → 매스트헤드·커버 피처·기사 그리드·아카이브
- iPhone UA → iOS 모바일 변형 (상단바 iOS 스펙)
- Pixel UA → Android 변형 (상단바 Android 스펙)
- 모바일 `tab`(0/1)·`cat`(전체/카테고리명) 클릭 시 필터 반영
- SVG 커버 6종 모두 정상 렌더링
- 화면 깜빡임·하이드레이션 mismatch 경고 없음

## 범위 외 (후속 PR)

- `/webzine/print` 인쇄 전용 라우트 (A3 가로 2페이지)
- 기사 상세·실제 본문 콘텐츠
- 백엔드 API 연동(현재 mock → fetch 교체)
- 사이트 공통 헤더/푸터 통합
