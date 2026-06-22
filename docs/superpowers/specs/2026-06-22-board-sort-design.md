# board 정렬(인기·댓글많은) 실동작화 설계

## 배경
자유게시판 헤더의 정렬 탭(`BOARD_SORTS`: 최신·인기·댓글많은)이 UI와 상태(`sort`)만 존재하고 실제 목록 정렬에 반영되지 않는다. 현재는 항상 최신순(서비스 쿼리의 `created_at` 내림차순)으로 고정 렌더된다. 이미 조회된 글의 좋아요·댓글·조회수 필드를 활용해 클라이언트에서 정렬을 적용한다.

## 정렬 규칙 (`BoardSort`)
- **최신(recent)**: 서비스가 `created_at` 내림차순으로 내려주므로 원배열 순서 유지(재정렬 없음).
- **인기(hot)**: `likes` 내림차순 → 동률 시 `views` 내림차순.
- **댓글많은(comments)**: `comments` 내림차순 → 동률 시 `likes` 내림차순.
- JS `Array.prototype.sort`는 안정 정렬이므로 동점 항목은 입력 순서(=최신순)를 유지한다.

> "인기" 기준은 **좋아요 수**로 확정(사용자 결정). 조회수는 동률 보조 기준으로만 사용.

## 구현
- **`src/lib/board.ts`** (클라이언트 안전 순수 유틸)에 `sortFeedPosts(posts: FeedPost[], sort: BoardSort): FeedPost[]` 추가.
  - `recent`는 입력 배열을 그대로 반환, `hot`·`comments`는 복사본을 정렬해 반환(입력 불변).
- **`src/app/board/_components/desktop/BoardDesktop.tsx`**·**`mobile/BoardMobile.tsx`**: 카테고리 필터 결과 `filtered` 뒤에 `const sorted = sortFeedPosts(filtered, sort)`를 두고, 기존 `filtered.map(...)`을 `sorted.map(...)`으로 교체.
  - 모바일 "총 N건" 카운트는 `filtered.length` 유지(정렬은 개수를 바꾸지 않음).

## 설계 보존
- 마크업·Tailwind·인라인 스타일·정렬 버튼 UI는 변경하지 않는다. 데이터 흐름(정렬 적용)만 추가한다.

## 범위 제외
- HOT THREADS 섹션(`CM_HOT`)은 정적 유지.
- 서버측 정렬·정렬 상태 URL 동기화는 범위 밖(클라이언트 정렬로 충분).

## 검증
- `pnpm lint && pnpm build`
- 로컬 Supabase에 좋아요·댓글 분포가 다른 board 글을 시드한 뒤, `/board`에서 최신→인기→댓글많은 탭 전환 시 순서가 규칙대로 바뀌는지 e2e 확인.
