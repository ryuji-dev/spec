# board 통계(BOARD_STATS) 실데이터화 plan

## 배경
자유게시판 헤더의 통계 3종(전체 글·오늘 새 글·활동 멤버)이 고정 mock(`BOARD_STATS`, `BOARD_STATS_MOBILE`)으로 박혀 있다. 사이드바 "활발한 멤버"와 동일하게, 이미 조회한 `rows`를 재사용해 실데이터로 전환한다. 추가 쿼리·RPC 없음.

## 산출 정의
- **전체 글** = `rows.length` (게시·필터된 board 글 전체)
- **오늘 새 글** = `formatDate(createdAt) === formatDate(now)` 인 글 수 — 기존 날짜 표기와 동일한 일(日) 경계(local) 사용
- **활동 멤버** = 작성자(`author_id`) distinct 수 = 멤버 집계 Map `memberAgg.size`

## 설계
- 데스크톱·모바일 라벨이 달라(전체 글/오늘 새 글/활동 멤버 vs 전체/오늘/활동), 서비스는 숫자 객체만 내려주고 각 컴포넌트가 자신의 라벨로 `{k,l}` 배열을 구성한다(디자인 마크업·라벨 보존).
- 타입 `BoardStats = { total: number; today: number; activeMembers: number }`.

## 변경 파일
1. `src/lib/board-data.ts` — `BOARD_STATS`·`BOARD_STATS_MOBILE` mock 상수 제거, `BoardStats` 타입 추가, `BoardStat`(`{k,l}`) 유지.
2. `src/server/services/board.ts` — `stats: BoardStats` 계산·반환. `today`는 `formatDate` 재사용, `activeMembers`는 `memberAgg.size`.
3. `src/app/board/page.tsx` — `stats`를 데스크톱·모바일 양쪽에 prop 전달.
4. `src/app/board/_components/desktop/BoardDesktop.tsx` — `stats` 수신 → `BoardHeader`로 전달.
5. `src/app/board/_components/desktop/BoardHeader.tsx` — `stats` prop으로 기존 라벨 배열 구성(.map 마크업 그대로).
6. `src/app/board/_components/mobile/BoardMobile.tsx` — `stats` prop으로 모바일 라벨 배열 구성(.map 마크업 그대로).

## 검증
- `pnpm lint && pnpm build`
- 로컬 Supabase에서 작성자·작성일 분포 시드 후 데스크톱/모바일 통계 e2e 확인.

## 범위 제외
- 인기 태그(`CM_TAGS`)·HOT(`CM_HOT`)·말씀 카드(`CM_VERSE`)는 정적 유지.
