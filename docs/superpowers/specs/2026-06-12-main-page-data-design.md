# 메인 페이지 실데이터 연동 (설계)

> 작성일 2026-06-12 · 범위: `/main`의 mock 3개 섹션(공지·일정·사진타일)을 실제 DB(posts)로 연동. 디자인 마크업·CSS는 불변(헌법 [7]).

## 배경

- 디자인 이식은 완료된 상태(랜딩·메인·6개 콘텐츠 페이지 모두 라우트 존재).
- 남은 것은 `/main`이 `lib/main-page-data.ts`의 **하드코딩 mock**을 쓰는 점. 실제 콘텐츠(공지·다가오는 일정·최근 활동)를 반영하도록 연동한다.
- 랜딩(`/`)은 데이터 mock이 없는 정적 인트로이므로 대상 아님.

## 현재 상태 (확인됨)

- `/main` page는 `DesktopPage`/`MobilePage`를 렌더하고, 하위 섹션 컴포넌트가 `lib/main-page-data.ts` 상수를 **직접 import**한다.
- `posts` 테이블 컬럼: `section`(enum: notice·board·committee·training·webzine·resource), `category`, `title`, `excerpt`, `is_published`, `is_pinned`, `event_date timestamptz`, `meta jsonb`, `created_at`, `view_count`. `attachments`(post_id FK, mime, stored_name) 별도 테이블, **비공개 버킷**.
- posts 읽기 RLS는 공개(`posts_select`). 기존 서비스 패턴: `server/services/*.ts`(`import 'server-only'`) → page에서 호출.
- `formatDate(date: Date)` 존재.

## 연동 대상 / 비대상

| 섹션 | 처리 |
|------|------|
| 공지 한 줄(`ANNOUNCEMENT_TEXT`) | **DB** — `section='notice'` 최신/고정 |
| 일정(`SCHEDULE_ITEMS`) | **DB** — `event_date` 미래 글 |
| 사진타일(`PHOTO_TILES`) | **DB(메타만)** — 최신 글 제목·날짜·태그 + 기존 그라데이션 type 유지(실이미지는 후속) |
| 히어로(`HERO_SLIDES`)·메뉴(`MENU_ITEMS`)·네비(`NAV_ITEMS`)·푸터(`FOOTER_COLUMNS`)·하단탭(`BOTTOM_TABS`) | **정적 유지** (브랜드 비주얼·사이트 구조) |

## 구성 요소

### 1) 서비스 — `src/server/services/home.ts`
`getHomeData()` → `{ announcement: string | null, schedule: HomeScheduleItem[], photos: HomePhotoItem[] }`

- **announcement**: `posts`에서 `section='notice'` 이고 `is_published=true`, 정렬 `is_pinned desc, created_at desc`, limit 1 → 제목. 없으면 `null`.
- **schedule** (`HomeScheduleItem { date, day, title, loc, tag }`): `event_date >= now()` 이고 `is_published=true`, 정렬 `event_date asc`, limit 4.
  - `date` = `MM.DD`(event_date), `day` = 한글 요일(일·월…), `title`, `loc` = `meta->>'location'` ?? `""`, `tag` = `category` ?? 섹션 라벨.
- **photos** (`HomePhotoItem { id, title, date, tag, type, href }`): `is_published=true`, 정렬 `created_at desc`, limit 7.
  - `date` = `MM.DD`(created_at), `tag` = `category` ?? 섹션 라벨, `type` = 섹션→그라데이션 타입 매핑(고정 규칙), `href` = 해당 섹션 상세 경로(`/training/{id}` 등).
- 날짜·요일 포맷은 서비스에서 계산(KST 기준 문자열).

### 2) 타입 이동 — `src/lib/main-page-data.ts`
- 동적 3개 상수 제거: `ANNOUNCEMENT_TEXT`, `SCHEDULE_ITEMS`, `PHOTO_TILES`.
- 관련 타입(`ScheduleItem`, `PhotoTile`, `PhotoTileType`)은 서비스/공용으로 이동하거나 서비스에서 재정의. `PhotoTileType`은 그라데이션 매핑에 계속 필요하므로 유지(서비스가 import).
- 정적 상수(`HERO_SLIDES`·`MENU_ITEMS`·`NAV_ITEMS`·`FOOTER_COLUMNS`·`BOTTOM_TABS`)와 그 타입은 **유지**.

### 3) 페이지·컴포넌트 props화
- `/main/page.tsx`: `getHomeData()` 호출 → `DesktopPage`/`MobilePage`에 `home` props 주입.
- `DesktopPage`/`MobilePage`: props를 하위 동적 섹션에 전달.
- 동적 섹션 컴포넌트(상수 직접 import 제거 → props 수신):
  - 데스크톱: `DesktopSchedule`(schedule), `DesktopPhotoSection`(photos), `AnnouncementStrip`(announcement) — 존재하는 것 기준(데스크톱 공지 위치 확인 후 연결).
  - 모바일: `ScheduleList`(schedule), `AnnouncementStrip`(announcement), 모바일 사진 섹션(photos).
- **마크업·className·CSS는 일절 변경하지 않는다.** 데이터 소스만 props로 교체.

### 4) 빈 상태 (신규 사이트 — 콘텐츠 적음)
- announcement `null` → 공지 strip 미표시(또는 기존 마크업에서 조건부 렌더).
- schedule `[]` → 일정 영역에 "예정된 일정이 없습니다" 한 줄(기존 행 마크업 톤 유지).
- photos `[]` → 사진 섹션 미표시.
- 디자인 깨짐 없이 자연스럽게 비도록 처리.

## 보안
- posts 공개 읽기는 기존 RLS 그대로. 비공개 첨부는 이번 범위에서 노출하지 않음(메타만).
- service-role 미사용(`createSupabaseServer` anon 컨텍스트로 공개 글만 조회).

## 검증 (lint/build + 로컬)
- 시드/수동 입력으로: notice 글 1건, `event_date` 미래 글 2~3건(일부 `meta.location`), 일반 글 여러 건 생성.
- `/main` 렌더: 공지·일정·사진타일이 실데이터 반영, 링크 이동(`href`) 정상.
- 빈 상태: 해당 글 없을 때 그레이스풀 처리 확인.
- 데스크톱/모바일 모두 확인, 디자인 동일(스크린샷 비교). `pnpm lint`/`build`.

## 범위 밖 (후속)
- 사진타일 실이미지(공개 이미지 전략·서명 URL), 히어로 슬라이드 admin 관리, 랜딩 변경.
- admin에서 `event_date`·`meta.location`·notice 작성 UI 보강(현재 글 작성 폼이 이 필드를 받는지는 구현 시 확인 — 없으면 후속).
