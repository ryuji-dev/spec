# 전체 사진첩(`/gallery`) 페이지 설계

- 날짜: 2026-06-17
- 상태: 설계 확정
- 관련: Feature C(메인 사진타일 실이미지, PR #36) 후속

## 1. 배경·목표

메인 페이지 사진 섹션은 업로드된 실이미지를 보여주지만(Feature C), "**전체 사진첩 →**" 버튼([DesktopPhotoSection.tsx](../../../src/app/main/_components/desktop/DesktopPhotoSection.tsx))을 비롯한 사진 진입점들이 **목적지가 없는 죽은 컨트롤**이다. 업로드된 활동 사진을 한곳에서 둘러보는 공개 **사진첩 페이지(`/gallery`)** 를 신설하고, 흩어진 진입점을 연결한다.

`_design/` 핸드오프에는 사진첩 페이지가 없다. 따라서 `/notice`와 동일하게 **기존 사진 섹션의 디자인 언어를 재사용하는 lean 신규 페이지**로 만든다.

## 2. 결정사항 (브레인스토밍 결과)

1. **사진 단위 = 글(활동) 단위.** 이미지가 있는 글마다 대표 이미지 1장(글당 첫 이미지)을 타일로. 메인 사진 섹션과 동일한 방식의 전체 확장. (대안: 이미지 단위 "사진 벽" → 캡션 반복·쿼리 복잡으로 기각)
2. **타일 클릭 = 글 상세로 이동.** 사진이 속한 글의 섹션별 상세 페이지로. 기존 상세 페이지 재사용(새 컴포넌트 없음), 활동 맥락 제공. (대안: 라이트박스 → 글 단위라 효용 작고 클라이언트 컴포넌트 비용 / 클릭 없음 → 둘러보기 흐름 단절, 모두 기각)
3. **볼륨 = 전체를 최신순으로 렌더(이미지 lazy-load).** 기존 committee·notice 목록과 동일한 "전부 렌더" 패턴. 썸네일은 `loading="lazy"`라 보이는 것만 로드. (대안: 페이지네이션/무한스크롤 → 현재 앱에 없는 패턴·클라이언트 fetch 비용, 양 증가 시 추후 도입)
4. **라우트 = `/gallery`.**

## 3. 데이터

신규 `src/server/services/gallery.ts` — `getGalleryData(): Promise<GalleryTile[]>`

- 쿼리: `posts` 중 **이미지 첨부가 있는 공개 글 전체**, 최신순.
  - `select("id, title, category, section, created_at, attachments!inner(id, mime, created_at)")`
  - `.eq("is_published", true).like("attachments.mime", "image/%").order("created_at", { ascending: false })` — **limit 없음**
- 매핑: 글당 **첫 이미지**(업로드 순) 사용. 이미지 첨부가 없으면 제외(`!inner`로 보장되나 strict 대비 가드).
- 반환 타입:
  ```ts
  type GalleryTile = {
    postId: string;
    imageId: string;   // 첫 이미지 첨부 id → /api/files/{imageId}
    title: string;
    date: string;      // formatDate(created_at) — 예: "2026.04.20"
    tag: string;       // category ?? 섹션 라벨
    type: PhotoTileType; // 이미지 로드 실패 시 그라데이션 폴백
    href: string;      // 섹션→경로 매핑 + /{postId}
  };
  ```
- **섹션→상세경로 매핑**(서비스 내부 상수):
  ```ts
  const SECTION_ROUTE = {
    committee: "/committee", training: "/training", webzine: "/webzine",
    resource: "/resources", board: "/board", notice: "/notice",
  };
  ```
  `href = ${SECTION_ROUTE[section]}/${postId}`. (notice는 첨부가 없어 실제로는 등장하지 않으나 완전성 위해 포함.)
- `tag`(섹션 라벨)·`type`(섹션→그라데이션) 매핑은 [home.ts](../../../src/server/services/home.ts)의 `SECTION_LABEL`·`SECTION_PHOTO_TYPE`와 동일 규칙. 날짜는 [format.ts](../../../src/lib/format.ts)의 `formatDate` 사용(메인의 하드코딩 "2026." 표기는 건드리지 않음).

## 4. 페이지·컴포넌트

- `src/app/gallery/page.tsx` — `getDeviceType(user-agent)`로 분기(notice와 동일 패턴).
  - 데스크톱: `<DesktopNav variant="solid" />` + `<GalleryDesktop tiles={...} />`
  - 모바일: `<GalleryMobile tiles={...} />` (하단 `<BottomTabBar />`)
- `src/app/gallery/_components/desktop/GalleryDesktop.tsx` + `GalleryDesktop.module.css`
- `src/app/gallery/_components/mobile/GalleryMobile.tsx` + `GalleryMobile.module.css`
  - 공통: `PageHero`(kicker `PHOTOS`, title `사진첩`) + **균일 반응형 그리드**
  - 타일: `<Link href={tile.href}>` 안에 **`PhotoTileThumb`**(실이미지+그라데이션 폴백, 기존 컴포넌트 재사용) + 캡션(제목·날짜·태그)
  - 빈 상태: "등록된 사진이 없습니다."
  - 색상은 Forest 팔레트 CSS 변수(`var(--palette-*)`) 사용.

## 5. 진입점 연결

| 위치 | 처리 |
|---|---|
| 데스크톱 메인 "전체 사진첩 →" 버튼 | `<button>` → `<Link href="/gallery">` (디자인 클래스 보존, 밑줄만 제거) |
| 데스크톱 푸터 "사진첩" | [main-page-data.ts](../../../src/lib/main-page-data.ts) `FOOTER_COLUMNS`의 해당 항목에 `href:"/gallery"` 추가 (`DesktopFooter`가 이미 href를 Link로 렌더) |
| 모바일 메인 사진 "사진첩" 액션 | `SectionHeader`에 `actionHref?` 옵션 추가 → 있으면 `action`을 `<Link>`로 렌더(없으면 기존 `<button>` 유지, 하위호환). `MobilePage`에서 사진 헤더에 `actionHref="/gallery"` 전달 |

## 6. 범위 밖 (이번에 하지 않음)

- **BottomTabBar `photo` 탭**: 디자인 원본상 라우팅은 v2 범위(시각 토글만)이며, 한 탭만 라우팅하면 일관성이 깨짐 → 손대지 않음.
- **모바일 푸터**: `FooterMobile`은 컬럼 링크가 없음(서명·주소만) → 해당 없음.
- **데스크톱 검색 버튼**·**모바일 로그인 진입점**: 별건(기존 발견 사항).
- 페이지네이션·무한스크롤·라이트박스·이미지 단위 갤러리: 추후 양·요구가 생기면.
- DB 스키마·RLS 변경: **없음**(기존 `attachments` 공개 읽기 정책·`/api/files/[id]` 재사용).

## 7. 테스트 플랜

- `pnpm lint` / `pnpm build` 통과.
- 로컬 브라우저(데스크톱·모바일 UA):
  - `/gallery` 렌더 — 이미지 타일 그리드, 캡션, 빈 상태.
  - 타일 클릭 → 올바른 섹션 상세로 이동(섹션→경로 매핑 검증).
  - 이미지 로드 실패 시 그라데이션 폴백.
  - 진입점: 데스크톱 "전체 사진첩 →"·푸터 "사진첩"·모바일 "사진첩" 액션 → `/gallery` 이동.
- 비로그인으로 전체 열람 가능(공개 페이지) 확인.
