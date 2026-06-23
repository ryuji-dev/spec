# 게시판 인기글(HOT) 사이드바 실데이터화 — 설계

작성일: 2026-06-23

## 목표

`/board` 자유게시판의 **인기글(HOT) 섹션**을 mock(`CM_HOT`)에서 실데이터로 전환한다.
DB 근거가 없는 **트렌딩 태그(`CM_TAGS`)**·**오늘의 말씀(`CM_VERSE`)** 은 정적 상수로 그대로 유지한다(태그·말씀 테이블 없음).

비범위:
- 태그 시스템 신설, 말씀 관리 기능 — 하지 않음(정적 유지)
- 신규 마이그레이션 — 없음(기존 `posts`·`comments`·`post_likes` 재사용)

## 데이터 소스

`getBoardListData`가 이미 조회하는 게시글 전체(`rows`)에는 `view_count`, `comments(count)`, `post_likes(count)`, 작성자(`name`, `church`)가 포함된다. 인기글은 이 결과를 **재사용**해 파생하므로 추가 본문 쿼리가 없다.

- **참여 점수** = `views + comments × W_c + likes × W_l` (가중치 상수: `W_c = 10`, `W_l = 5`).
- 점수 내림차순 정렬 후 **상위 2개** 선정(동점 시 최신 글 우선).
- `heat` = `최고 점수` 대비 0~100 정규화: `Math.round(score / maxScore × 100)`(최고 점수 글 = 100, `maxScore`가 0이면 0).
- **lastReply(마지막 답글)**: 선정된 2개 글의 `id`로 `comments`를 1회 조회(작성자 임베드, `created_at` 내림차순), JS에서 글별 최신 1건만 추림. 댓글이 없으면 생략(카드가 `lastReply &&`로 선택 렌더).

## 타입 변경 (`src/lib/board-data.ts`)

- `HotThread`에서 **`reactions` 필드 제거** — 데스크톱 `HotThreadCard`·모바일 어디에서도 렌더되지 않는 죽은 필드.
- `HotThread.lastReply`를 선택(`lastReply?`)으로 변경 — 댓글 없는 글 대응.
- `CM_HOT` 상수 **삭제**.
- 유지: `HotThread` 타입, `CM_TAGS`, `CM_VERSE`, `BOARD_SORTS`, 기타 타입.

## 매핑·서비스

### `src/lib/board.ts` (클라이언트 안전 순수 유틸)
- `HotRow` 평면 타입(id, category, title, excerpt, viewCount, createdAt, authorName, authorChurch, commentCount, likeCount) 정의.
- `toHotThreadView(row, score, maxScore, lastReply?)` → `HotThread` 뷰모델 변환:
  - `cat` = category(없으면 기본값 "나눔"), `heat` = 정규화 점수, `avatar` = 작성자 이름 첫 글자, `author` = 이름, `church`, `date` = `formatDate(createdAt)`(기존 `toFeedPostView`와 동일 유틸로 통일), 숫자 필드 그대로. `lastReply.when`도 `formatDate`로 포맷.

### `src/server/services/board.ts`
- `BoardListData`에 `hot: HotThread[]` 추가.
- `getBoardListData`에서: `rows`로 점수 계산 → 상위 2개 선정 → 해당 2개 글의 최신 댓글 조회 → `toHotThreadView` 매핑 → `hot` 반환.

## 배선 (디자인 보존 — 마크업·클래스 변경 없음, 데이터 출처만 교체)

- `src/app/board/page.tsx`: `hot={data.hot}`를 `BoardDesktop`·`BoardMobile`에 전달.
- `src/app/board/_components/desktop/BoardDesktop.tsx`: `hot`을 받아 `HotSection`에 전달.
- `src/app/board/_components/desktop/HotSection.tsx`: `CM_HOT` import 제거 → `hot` prop 사용.
- `src/app/board/_components/mobile/BoardMobile.tsx`: `CM_HOT` import 제거 → `hot` prop 사용(`CM_VERSE`는 계속 import).

## 보안

- 읽기 전용. 기존 board RLS(공개글 SELECT) 범위 내. 추가 정책 불필요.
- 댓글 작성자 표시는 기존 board 상세와 동일한 공개 범위.

## 검증 계획

로컬 Supabase(127.0.0.1 확인 후) 시드 데이터로:
1. `/board` 데스크톱 — 인기글 2개가 실제 조회/댓글/좋아요 상위 글로 표시, heat 게이지·카테고리·작성자·교회·상대시간 정상.
2. lastReply가 해당 글의 최신 댓글(작성자·내용·시간)로 표시, 댓글 없는 글은 답글 영역 생략.
3. `/board` 모바일 — 인기글 가로 카드 정상.
4. `CM_TAGS`(트렌딩 태그)·`CM_VERSE`(말씀)는 기존과 동일하게 표시.
5. `pnpm lint`·`pnpm build` 통과.
