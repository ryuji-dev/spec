# 신학원웹진 페이지 설계 (`/webzine`)

> 작성일: 2026-05-06
> 브랜치: `feat/seminary-webzine`
> 디자인 원본: `frontend/_design/seogyeong-presbytery-education-committee/project/서경노회 신학원웹진.html` + `webzine.jsx`

## Context

서경노회 교육부 홈페이지에 **신학원웹진** 페이지를 추가한다. Claude Design에서 export한 핸드오프 번들(`webzine.jsx`)에는 데스크탑 1440px, iPhone 402px, Galaxy 412px 세 디바이스 변형이 정의되어 있고, 본 작업은 그 디자인을 Next.js App Router 위에 **100% 보존**하여 이식한다.

이번 PR 범위는 **mock 데이터 기반 정적 화면**까지. 백엔드 연동·실제 콘텐츠·인쇄 전용 라우트는 후속 PR.

## 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 라우트 | `/webzine` |
| 인쇄 전용 버전 | 본 PR 제외 (후속) |
| 데이터 소스 | `webzine.jsx` mock 그대로 복사, 타입만 추가 |
| 디바이스 분기 | 서버에서 `headers()`로 UA 판정 → `desktop` / `ios` / `android` |
| 공통 헤더·푸터 | 적용 안 함, 디자인 원본의 매스트헤드만 사용 |
| 모바일 두 변형 | iOS·Android 둘 다 제공 (deviceType prop) |

## 디렉터리·파일 구조

```
frontend/src/
├── app/
│   └── webzine/
│       ├── page.tsx                     ← Server Component, UA 판정
│       ├── webzine.module.css           ← 페이지 루트 스타일
│       └── _components/
│           ├── desktop/
│           │   ├── WebzineDesktop.tsx
│           │   └── WebzineDesktop.module.css
│           ├── mobile/
│           │   ├── WebzineMobile.tsx    ← 'use client', 카테고리/탭 상태 보유
│           │   └── WebzineMobile.module.css
│           └── illustrations/
│               ├── CoverWilderness.tsx
│               └── CoverArt.tsx          ← type prop으로 6종 분기
└── lib/
    ├── device.ts                         ← UA → DeviceType 판정 (재사용 가능)
    └── webzine-data.ts                   ← mock 데이터 + 타입
```

## 라우팅·렌더링 흐름

`page.tsx`는 Server Component로, `next/headers`의 `headers()`로 `User-Agent`를 읽어 `getDeviceType()` 호출. 결과에 따라 한쪽 트리만 렌더한다 — 메인페이지처럼 두 트리를 함께 SSR하고 CSS로 토글하지 않는다 (DOM·번들 절감).

```tsx
// frontend/src/app/webzine/page.tsx
import { headers } from 'next/headers';
import { getDeviceType } from '@/lib/device';
import WebzineDesktop from './_components/desktop/WebzineDesktop';
import WebzineMobile from './_components/mobile/WebzineMobile';

export default async function WebzinePage() {
  const h = await headers();
  const device = getDeviceType(h.get('user-agent'));
  return device === 'desktop'
    ? <WebzineDesktop />
    : <WebzineMobile deviceType={device} />;
}
```

`headers()`를 사용하므로 Next.js가 자동으로 dynamic 렌더링으로 전환한다. CDN 캐싱은 `Vary: User-Agent` 헤더와 함께 자연스럽게 동작.

## 디바이스 판정 (`src/lib/device.ts`)

```ts
export type DeviceType = 'desktop' | 'ios' | 'android';

export function getDeviceType(userAgent: string | null): DeviceType {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}
```

- UA 미존재·unknown → `desktop` fallback (가장 안전)
- 태블릿은 iOS로 분류
- 단순 정규식; UA 라이브러리 도입 안 함 (다른 용도 없음)

## 컴포넌트 분해

| 컴포넌트 | 분류 | 원본 매핑 |
|---|---|---|
| `WebzineDesktop` | Server Component (상태 없음) | `webzine.jsx::WebzineDesktop` |
| `WebzineMobile` | `'use client'`, `useState` (`tab`, `cat`) | `webzine.jsx::WebzineMobile` |
| `CoverWilderness` | 인라인 SVG, props 없음 | 동명 SVG 그대로 |
| `CoverArt` | 인라인 SVG, `type: 'book' \| 'rural' \| 'book2' \| 'child' \| 'history' \| 'dialogue'` | 동명 SVG 그대로 |

**원본의 `palette` prop**: 본 이식에선 기본 팔레트만 쓰므로 prop을 떼고 `WebzineDesktop.module.css`의 CSS 변수로 고정한다. 추후 팔레트 옵션 필요 시 prop 복구.

**HTML→JSX 변환 규칙** (헌법 [7]):
- `class` → `className`, self-closing 등 기계적 변환만
- Tailwind 클래스·CSS·마크업 변경 금지
- CSS Modules로 스타일 캡슐화

## 데이터 (`src/lib/webzine-data.ts`)

`webzine.jsx`의 mock 객체 4종을 그대로 복사하되 TypeScript strict 타입을 정의:

- `WZ_FEATURED: WebzineFeatured` — 이번 호 커버 특집
- `WZ_ARTICLES: WebzineArticle[]` — 6개 기사
- `WZ_CATEGORIES: WebzineCategory[]` — 6개 카테고리
- `WZ_BACK_ISSUES: WebzineBackIssue[]` — 지난 호 4개

필드명·내용 변경 금지. 백엔드 연동 시점에 fetch로 교체하기 쉬운 형태로 export.

## 자산·폰트

- **이미지**: 외부 자산 0개. 모든 일러스트가 인라인 SVG.
- **폰트**: `Noto Serif KR` (300–700), `Noto Sans KR` (300–700), `Inter` (400–700) — `frontend/src/app/layout.tsx`에 누락분만 `next/font/google`로 추가.
- **`_design/` 동기화**: 작업 시작 단계에서 Downloads 번들의 `서경노회 신학원웹진.html`, `-print.html`, `webzine.jsx`를 `frontend/_design/seogyeong-presbytery-education-committee/project/`로 복사 (gitignore라 커밋되진 않음).

## 상태·인터랙션

- `WebzineDesktop`: 상태 없음, 순수 렌더링
- `WebzineMobile`:
  - `tab`: '현재 호' / '지난 호' 전환
  - `cat`: 카테고리 필터링
  - 두 상태 모두 원본 `webzine.jsx`의 `useState` 그대로 이식
- 외부 링크·기사 상세 페이지는 본 PR 범위 외. 카드 클릭은 시각적 hover까지만.

## 에러 처리

정적 mock 데이터만 다루므로 런타임 에러 가능성이 사실상 없다. try/catch·fallback UI 추가하지 않는다. 라우트 누락은 Next.js 기본 404가 처리.

## 보안·접근성·성능

- **보안**: 사용자 입력 렌더 없음 → 별도 sanitize 불필요. `dangerouslySetInnerHTML` 사용 안 함.
- **접근성**: 원본 디자인의 시맨틱 마크업(`<article>`, `<nav>`, heading 계층)을 그대로 보존. SVG에는 적절한 `<title>` 또는 `aria-hidden`.
- **성능**: 한쪽 디바이스 트리만 SSR하므로 모바일 사용자가 데스크탑 DOM을 다운로드하지 않음.

## 검증 (수동)

```bash
cd frontend && pnpm dev
```

1. 데스크탑 브라우저 → `http://localhost:3000/webzine` → 데스크탑 매거진 레이아웃
2. Chrome DevTools 디바이스 모드 → iPhone UA → iOS 모바일 변형 (상단바·패딩 iOS 스펙)
3. Pixel UA → Android 모바일 변형 (상단바·패딩 Android 스펙)
4. 모바일에서 카테고리 탭 클릭 → 필터 동작 확인
5. 6종 SVG 커버(`book`, `rural`, `book2`, `child`, `history`, `dialogue`)가 기사 카드에 올바르게 매핑
6. `pnpm build && pnpm start` → 프로덕션 빌드에서도 동일 동작
7. `pnpm lint` 통과, TypeScript strict 빌드 0 에러

## 범위 외 (후속 PR)

- `/webzine/print` — A3 가로 2페이지 인쇄 라우트
- 기사 상세 페이지·실제 본문 콘텐츠
- 백엔드 API 연동 (현재 mock → fetch 교체)
- 사이트 공통 헤더/푸터 통합 (전체 사이트 차원의 결정 후)
