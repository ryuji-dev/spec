# 교역자수련회(`/training`) 페이지 디자인 이식 계획

## Context

서경노회 교육부 홈페이지에 **교역자수련회 게시판**(`/training`) 페이지를 새로 추가한다.
디자인 원본은 Claude Design 핸드오프 번들 (`~/Downloads/seogyeong-presbytery-education-committee/`)이고, 게시판 디자인의 진입점은 `서경노회 교역자수련회 게시판.html` → `training.jsx`(2,193줄, `TrainingDesktop` / `TrainingMobile` 컴포넌트 포함).

현재 작업 브랜치는 이미 생성된 `feat/clergy-retreat`. 직전 작업(`feat/committee-board`, 머지됨)에서 만든 `/committee` 페이지의 구조를 그대로 미러링한다 — 이 패턴이 사용자가 검증한 표준이고, 헌법 [7] "디자인 100% 보존"을 가장 안전하게 지킬 수 있다.

추가로:
- 글로벌 네비(`NAV_ITEMS`)에 `교역자수련회` 항목이 이미 존재하지만 `href`가 없다 → `/training` 라우팅 추가.
- `frontend/_design/` 안의 기존 핸드오프 번들에는 `training.jsx`와 `서경노회 교역자수련회 게시판.html`이 빠져 있음 → 새 번들로 갱신해야 이식 작업의 원본 보존이 가능.

## Approach (요약)

`/committee`와 동일한 디렉터리/파일 패턴을 그대로 따라가며, 디자인 원본의 마크업·스타일·인터랙션을 100% 그대로 옮긴다. 데이터는 mock 상수로 시작(백엔드 연동은 별도 PR). PR 1개로 마무리.

## Phase 1 — 디자인 원본 갱신

`frontend/_design/seogyeong-presbytery-education-committee/`를 `~/Downloads/seogyeong-presbytery-education-committee/` 최신 번들로 덮어쓰기.

```bash
rsync -a --delete "/Users/noah/Downloads/seogyeong-presbytery-education-committee/" \
  "/Users/noah/Documents/projects/spec/frontend/_design/seogyeong-presbytery-education-committee/"
```

`_design/`는 `.gitignore` 대상이므로 커밋되지 않음. 핸드오프 README의 "Read in full" 지시를 따라 `training.jsx` 전체를 이식 작업 기준 원본으로 사용.

## Phase 2 — Mock 데이터 추가

새 파일: `frontend/src/lib/training-data.ts`.

`training.jsx` 안에 하드코딩된 데이터를 그대로 옮긴다.

| 데이터 | 출처 (training.jsx) | 비고 |
|---|---|---|
| `UPCOMING_TRAINING` | 카운트다운/장소/회비 카드 | D-day는 정적 |
| `SPEAKERS[]` | TrSpeakersSection 카드 | 사진은 placeholder(이니셜) |
| `SCHEDULE_DAYS[]` | 3일 타임라인 | day1/2/3 + 슬롯 배열 |
| `NEXT_TRAININGS[]` | 다가오는 일정 (가을·청년) | |
| `PAST_TRAININGS[]` | Bento 4장 (이미 본 56라인 등) | `cover: 'pine' | 'desert' …` |
| `TRAINING_POSTS[]` + `TRAINING_CATEGORIES[]` | 6개 카테고리 + 게시물 목록 | committee-data.ts와 형태 유사 |
| `FILTER_TABS[]` | 6 탭 + 카운트 | |

타입은 `committee-data.ts`(`Post`, `Category`, …) 정의를 살펴보고 가능한 한 재사용하되, training 고유 필드(스피커 역할, 일자별 슬롯)는 새 타입으로 분리.

## Phase 3 — `/training` 라우트 + 컴포넌트 생성

`/committee`와 1:1 미러. 모든 신규 파일.

```
frontend/src/app/training/
├── page.tsx                              # 서버 컴포넌트, UA 분기
└── _components/
    ├── desktop/
    │   ├── TrainingDesktop.tsx           # "use client", 카테고리 필터 state
    │   ├── TrainingNav.tsx               # 글로벌 DesktopNav를 그대로 쓰면 생략
    │   ├── HeroSection.tsx               # TrHeroSection
    │   ├── UpcomingHero.tsx              # 카운트다운 + 진행 바 + 신청 CTA
    │   ├── SpeakerCard.tsx               # 스피커 카드 (가로 스크롤)
    │   ├── ScheduleSection.tsx           # 3일 타임라인 (day별 컴포넌트 분리 가능)
    │   ├── NextTrainings.tsx             # 다가오는 2-3건
    │   ├── PastBento.tsx                 # 4-up bento + CoverArt
    │   ├── CoverArt.tsx                  # SVG 일러스트 ('mountain-dawn'|'autumn'|'youth'|'pine'|'desert'|'lake'|'field')
    │   ├── FilterBar.tsx                 # 6 카테고리
    │   ├── PostCard.tsx, PostListRow.tsx # 게시판 (committee 재활용 검토)
    │   ├── Sidebar.tsx                   # TrSideRegister + TrSideArchive + TrSideContact
    │   ├── Pagination.tsx
    │   └── TrainingFooter.tsx
    ├── mobile/
    │   ├── TrainingMobile.tsx            # "use client", sticky 헤더 + 본문
    │   ├── MobileHero.tsx
    │   ├── MobileCountdown.tsx
    │   ├── MobileSchedule.tsx            # day1만 펼침, 2·3 접힘
    │   ├── MobilePostCard.tsx, MobilePostListItem.tsx
    │   └── BottomTabBar.tsx              # 80px 하단 패딩 sticky
    └── shared/
        └── CoverArt.tsx                  # training 전용 SVG 일러스트 (desktop/mobile 공용)
                                          # palette/AuthorChip/StatRow/CatLabel/catTone은
                                          # @/app/_components/shared/에서 import
```

**구조 원칙:**
- `page.tsx`는 `headers()` → `getDeviceType()` 분기. desktop 분기는 `<DesktopNav variant="solid" />` + `<TrainingDesktop />`, mobile은 `<TrainingMobile />` 단일.
- 인터랙션 상태(`activeCat`, 스케줄 펼침)는 `"use client"` 경계인 `TrainingDesktop`/`TrainingMobile`에 둠.
- 스타일은 committee와 동일하게 **인라인 스타일 + 팔레트 prop** (CSS Modules는 글로벌 nav만 사용).
- `CoverArt`는 SVG 그대로 옮김(이미지 파일 의존 X).
- **공유 컴포넌트 승격**: `committee/_components/shared/`의 `AuthorChip`, `StatRow`, `CatLabel`, `catTone`, `palette`(FOREST_PALETTE + Palette 타입)를 `frontend/src/app/_components/shared/`로 이동. committee 측 import 경로(상대경로 `./shared/...`)도 `@/app/_components/shared/...`로 함께 갱신. training은 처음부터 승격된 위치를 import.
- 외부 폰트: 이미 `app/layout.tsx`에서 `next/font/google`로 Noto Serif KR / Noto Sans KR / Inter / Cormorant Garamond 로딩됨 → 추가 작업 불필요.

## Phase 4 — 글로벌 네비 라우팅

`frontend/src/lib/main-page-data.ts:121` 수정:

```ts
{ label: "교역자수련회" },         // 변경 전
{ label: "교역자수련회", href: "/training" },  // 변경 후
```

`DesktopNav`는 이미 `usePathname()` 기반 active 처리를 하므로 별도 수정 불필요(committee 진행 시 검증됨).

## Phase 5 — 검증 (`superpowers:verification-before-completion`)

```bash
cd frontend
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm dev   # http://localhost:3000/training
```

수동 확인 항목:
- [ ] 데스크톱(1440px): 글로벌 nav → 히어로 → 카운트다운 → 스피커 가로 스크롤 → 3일 타임라인 → 다가오는 일정 → Bento 4장 → 카테고리 6탭 → 게시물 목록 + 사이드바 → 푸터, 모두 시각적으로 원본 일치
- [ ] 모바일(iPhone 402px / Galaxy 412px): 자체 sticky 헤더, day1 펼침 / day2·3 접힘, 카테고리 가로 스크롤, 하단 80px 여유(BottomTabBar)
- [ ] 글로벌 네비 "교역자수련회" 클릭 → `/training` 이동, active 표시
- [ ] 카테고리 필터 클릭 시 게시물 리스트 변경 (`activeCat` 동작)
- [ ] `/committee` 회귀 없음
- [ ] Lighthouse / 콘솔 에러 없음

## 작업 단위 / 커밋

PR 1개. 커밋은 단계 단위로 분할(헌법 작업 흐름 §6 — Conventional Commits + 한국어 본문):

1. `refactor: 공통 게시판 컴포넌트를 app/_components/shared/로 승격` — palette/AuthorChip/StatRow/CatLabel/catTone 이동 + committee import 경로 갱신
2. `feat: 교역자수련회 mock 데이터 추가` — `lib/training-data.ts`
3. `feat: 교역자수련회(/training) 데스크톱 디자인 이식`
4. `feat: 교역자수련회(/training) 모바일 디자인 이식`
5. `feat: 글로벌 네비 교역자수련회 항목에 /training 링크 연결`

(`_design/` 갱신은 gitignore 대상이라 커밋 없음.)

마무리는 `superpowers:finishing-a-development-branch` 가이드(PR 작성 → 머지 → 브랜치 삭제) 그대로.

## 핵심 파일 (수정/신규)

**신규**
- `frontend/src/app/training/page.tsx`
- `frontend/src/app/training/_components/**/*.tsx` (위 트리)
- `frontend/src/lib/training-data.ts`
- `frontend/src/app/_components/shared/{palette.ts,AuthorChip.tsx,CatLabel.tsx,StatRow.tsx,catTone.ts}` (이동)

**수정**
- `frontend/src/lib/main-page-data.ts` (`NAV_ITEMS`의 교역자수련회 항목 1줄)
- `frontend/src/app/committee/_components/**/*.tsx` (shared 승격에 따른 import 경로만 갱신)

**삭제**
- `frontend/src/app/committee/_components/shared/` (승격 후 비어있으면 폴더 제거)

**참조 / 패턴 출처 (수정 X)**
- `frontend/src/app/committee/page.tsx`
- `frontend/src/app/committee/_components/**/*`
- `frontend/src/app/_components/DesktopNav.tsx`
- `frontend/src/lib/device.ts`
- `frontend/src/lib/committee-data.ts`
- `frontend/_design/seogyeong-presbytery-education-committee/project/training.jsx` (원본)
- `frontend/_design/seogyeong-presbytery-education-committee/project/서경노회 교역자수련회 게시판.html` (진입 HTML)

## 헌법·규칙 체크포인트

- [x] 새 브랜치(`feat/clergy-retreat`) — 이미 생성/체크아웃 완료
- [ ] Plan 문서: 이 파일 + 작업 시작 시 `docs/superpowers/plans/2026-05-07-clergy-retreat.md` 복사
- [ ] 디자인 100% 보존 (마크업/Tailwind/CSS 임의 변경 금지)
- [ ] 한국어 UI 텍스트, 영어 식별자, 한국어 주석/커밋 본문
- [ ] `'use client'`는 상태/이벤트 필요 컴포넌트에만
- [ ] 데이터는 mock 상수, 백엔드는 별도 PR
- [ ] TypeScript strict, `any` 회피
