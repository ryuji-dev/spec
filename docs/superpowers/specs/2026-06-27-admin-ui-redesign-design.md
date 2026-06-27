# admin UI 리디자인 설계 (Phase 1: 기초 셋 + 대시보드)

> 작성일: 2026-06-27 · 브랜치: `feat/admin-ui-redesign`

## 배경·목표

admin 화면은 공유 레이아웃 없이 50여 개 파일이 모두 인라인 스타일로만 구성되어 투박하다. **정돈된 관리자 대시보드** 방향으로, 공통 레이아웃 셸과 재사용 UI 프리미티브를 세우고 대시보드에 적용한다. 셸 도입만으로 모든 admin 페이지가 즉시 일관된 틀을 갖게 하는 것이 핵심 레버리지다.

전체를 한 번에 바꾸지 않고 **Phase로 분할**한다. 이 spec은 Phase 1(기초 셋 + 대시보드)만 다룬다. 나머지 페이지의 속내용(목록 표·편집 폼) 리스타일은 후속 Phase.

## 디자인 토큰

- 배경 `#F7F6F2`(연한 크림그레이), 카드 표면 `#FFFFFF`, 경계선 `rgba(42,37,32,0.12)`
- 텍스트 잉크 `#2A2520`, 보조 `#6B5F52`
- 포인트: 그린 `#2D4A3E`(주요 버튼·활성 메뉴), 골드 `#C9A96E`(강조 소량)
- 폰트: 본문 Noto Sans KR(`--font-noto-sans-kr`), 일부 헤더 Serif(`--font-noto-serif-kr`)

(모두 기존 `globals.css`의 `--palette-*` 토큰과 정합. admin은 디자인 핸드오프 대상이 아니므로 자체 스타일 자유 — 헌법[7]의 공개 페이지 보존과 무관.)

## 구성요소

### A. 공통 셸 레이아웃 — `src/app/(admin)/layout.tsx` (신규)

route-group `(admin)` 레이아웃이라 `(admin)/admin/*` 전체를 감싼다. 로그인 페이지는 `(public)` 그룹이라 영향 없다.

- 서버 컴포넌트. 진입부 `requireAdmin()` 호출 → 헤더에 사용자명·역할 표시 + 방어층(각 페이지의 `requireAdmin()` 재확인은 유지).
- **사이드바**(`<Sidebar />`) + **본문 영역**(`{children}`)의 2단 레이아웃.
- 사이드바 구성:
  - 브랜드: "서경노회 교육위원회 · 관리"
  - **대시보드** (`/admin`)
  - **콘텐츠**: 공지(`/admin/notice`)·강습회(`/admin/training`)·위원회 소식(`/admin/committee`)·웹진(`/admin/webzine`)·자료실(`/admin/resources`)
  - **운영**: 문의 접수함(`/admin/inquiries`)·수련회 이벤트(`/admin/events`)·강의 시간표(`/admin/timetable`)·자료실 컬렉션(`/admin/collections`)·메인 히어로(`/admin/hero`)
  - 하단: 사용자명·역할 + 로그아웃(`logout` 서버 액션 폼)
- 모바일: 데스크톱 우선. 좁은 화면에서는 사이드바를 상단 바 + 접이식(토글) 메뉴로 전환.

### B. 공용 UI 모듈 (신규)

- `src/app/(admin)/admin/_components/admin-shell.module.css` — 셸·사이드바 레이아웃/네비 스타일.
- `src/app/(admin)/admin/_components/ui.module.css` — 재사용 프리미티브 클래스:
  - `.page`(본문 컨테이너 폭·여백), `.pageHeader`(제목+설명+우측 액션)
  - `.card`(흰 표면·라운드·그림자), `.cardTitle`
  - `.btn`, `.btnPrimary`(그린), `.btnGhost`
  - `.table`(헤더·행 구분선·패딩), `.input`, `.select`, `.textarea`
  - `.badge`(빨간 pill — 기존 미처리 배지 톤 흡수)
- `src/app/(admin)/admin/_components/Sidebar.tsx` (client) — `usePathname()`로 현재 경로에 해당하는 메뉴 활성 강조.

> Sidebar만 client(`usePathname` 필요). 나머지는 서버 컴포넌트 + CSS 모듈.

### C. 대시보드 적용 — `src/app/(admin)/admin/page.tsx` + `StatCard.tsx`

- 인라인 스타일을 공용 클래스로 교체.
- 셸이 사이드바·헤더(사용자/로그아웃)를 담당하므로, 대시보드 본문은 **콘텐츠 현황 카드 + 계정 생성 + 비밀번호 재설정**에 집중. 기존 헤더의 사용자 정보·로그아웃 줄은 셸로 이동.
- "기타 관리" 링크(문의 배지 포함)는 사이드바로 흡수되므로 대시보드 본문에서는 제거(중복 방지). 콘텐츠 현황 카드는 유지·리스타일.
- `StatCard.tsx`를 `ui.module.css` 클래스 기반으로 리스타일(현재 인라인 → 클래스). 미처리 문의 배지 정보는 사이드바 "문의 접수함" 항목 옆 배지로 이전(셸에서 `countUnansweredInquiries()` 호출).
- `CreateUserForm`·`AdminResetPasswordForm`은 카드로 감싸고 입력은 `.input` 클래스 적용(폼 로직 불변).

## 데이터 흐름

- 셸 레이아웃: `requireAdmin()`(사용자) + `countUnansweredInquiries()`(사이드바 배지) 직접 호출.
- 대시보드: `getAdminContentStats()` 유지.
- 모두 읽기 규약 1번(Server Component → 서비스 직접 호출). 쓰기 없음.

## 범위 밖 (후속 Phase)

- 콘텐츠 목록 5종·문의 목록 표 리스타일 (Phase 2)
- 편집/신규 폼 리스타일 (Phase 3)
- events·timetable·collections·hero·faculty 속내용 (Phase 4)

이 페이지들은 Phase 1에서 코드를 바꾸지 않지만, 새 셸 안에 들어가 즉시 틀이 잡힌다.

## 검증

- `npx tsc --noEmit` · `pnpm lint` · `pnpm build` 통과.
- 로컬 e2e:
  - admin 로그인 → `/admin` 데스크톱·모바일 스크린샷으로 셸·대시보드 정돈 확인.
  - 사이드바 활성 메뉴 강조·각 항목 이동 동작.
  - 다른 admin 페이지(예: `/admin/notice`, `/admin/inquiries`)가 새 셸 안에 정상 렌더.
  - 사이드바 미처리 문의 배지 노출(테스트 문의 삽입→확인→원복).
  - 브라우저 콘솔 오류 0.
