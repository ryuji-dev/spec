# board 사이드바 "활발한 멤버" 실데이터화 설계

작성일: 2026-06-20

## 배경·목적

`/board`(자유게시판) 데스크톱 사이드바의 "활발한 멤버"(ACTIVE THIS MONTH) 블록이 mock 상수(`CM_MEMBERS`, `lib/board-data.ts`)로 고정돼 있다. committee 사이드바 "활발한 작성자"를 실집계로 전환한 작업의 board 버전으로, 같은 패턴을 적용해 실데이터로 전환한다.

같은 사이드바의 태그(`CM_TAGS`)·인기 스레드(`CM_HOT`)·통계(`BOARD_STATS`)는 이번 범위에서 제외한다(아래 사유).

## 범위 (확정 결정)

- **대상**: 데스크톱 board 사이드바 "활발한 멤버"(`SideMembers`)만. 모바일(`BoardMobile`)은 이 블록을 렌더하지 않음.
- **집계 범위**: board 섹션의 게시된 글 작성자별 글 수, **전체 기간**(이번 달 필터 없음). 라벨 "ACTIVE THIS MONTH"는 장식 키커로 그대로 둔다(글 수가 적어 당월 한정은 빈 목록이 되기 쉬움 — 사용자 확정).
- **상위 N**: 5명(기존 `CM_MEMBERS` 슬롯 수와 동일).
- **디자인**: 마크업·스타일 100% 보존(헌법 [7]). 데이터 소스만 mock → 실집계로 교체.

비범위:
- **태그(`CM_TAGS`)**: 태그 시스템 미구현 → 정적 유지(committee `BD_TAGS`와 동일 결정).
- **인기 스레드(`CM_HOT`)**: `heat`·이모지 `reactions`·`lastReply`(마지막 답글) 등 DB 스키마에 없는 필드가 많아 실데이터화 고비용 → 제외.
- **통계(`BOARD_STATS`)**: 이번 범위 밖(원하면 후속).

## 아키텍처

### 1) 서비스 집계 — `server/services/board.ts`

`getBoardListData`는 이미 게시된 board 글 **전체**(`rows`, limit 없음)를 조회한다. 현재 select는 `author:profiles(name, church)`만 가져오므로, 작성자를 id로 안정 그룹핑하기 위해 **`author_id`를 select에 추가**한다. 그런 다음 `rows`를 재사용해 JS로 집계한다 — 기존 카테고리 집계(`byCat`)와 동일 패턴, 추가 쿼리·RPC 없음.

집계 로직:
- `author_id`가 `null`인 행 제외.
- `author_id`별로 글 수 누적. 표시명(`name`)·교회(`church`)는 행의 `author` 임베드에서 취득.
- 정렬: 글 수 내림차순, 동수는 이름 오름차순.
- 상위 5명.

매핑(`ActiveMember`):
- `name` = 프로필 이름
- `church` = 프로필 교회(없으면 빈 문자열)
- `posts` = 집계 글 수
- `init` = 이름 첫 글자(`name.charAt(0)`)

`BoardListData` 반환 타입에 `members: ActiveMember[]`를 추가하고 `return`에 포함한다.

### 2) 타입·mock 정리 — `lib/board-data.ts`

- `CM_MEMBERS` **상수 제거**.
- `ActiveMember` **타입은 유지** — 서비스·컴포넌트가 공유.
- `CM_TAGS`·`CM_HOT`·`BOARD_STATS`는 그대로 둔다(정적/비범위).

### 3) prop 스레딩 — 데스크톱 경로만

`page.tsx`(desktop 분기) → `BoardDesktop` → `SideMembers`로 `members`를 전달한다. `SideMembers`는 `CM_MEMBERS` import 대신 `members` prop을 받아 렌더(map 내부 로직·스타일 불변). 모바일 분기는 변경 없음.

### 서버 코드 외 변경 없음

`SideMembers`의 아바타 이니셜·레이아웃은 실 데이터로 그대로 동작한다.

## 엣지·보안

- 멤버 5명 미만이면 있는 만큼만 표시.
- `/board`는 `proxy.ts`가 회원 가드 → 항상 로그인 컨텍스트. 작성자 프로필은 공개 작성자 RLS(`profiles_select_public_author`, 이미 머지)로도 resolve되며, 로그인 회원 본인/타인 모두 노출에 문제없다.
- `church`는 자유 입력이라 `null` 가능 → 빈 문자열 폴백.

## 검증 (로컬 Supabase)

- `npx supabase db reset`로 적용(스키마 불변 — `db:types` 영향 없음).
- 로그인 회원으로 `/board` 데스크톱을 열어 "활발한 멤버"에 **실제 이름·교회·글 수**가 글 수 내림차순 상위 5명으로 표시되는지 확인(이전 고정 mock 사라짐).
- 서로 다른 작성자·글 수로 순위 변화 확인.
- `pnpm lint && pnpm build` 통과.

## 구현 단계(개요)

1. `board.ts`: select에 `author_id` 추가, 멤버 집계, `BoardListData.members` 반환.
2. `lib/board-data.ts`: `CM_MEMBERS` 제거, `ActiveMember` 타입 유지.
3. prop 스레딩: `page.tsx`(desktop) → `BoardDesktop` → `SideMembers`.
4. 로컬 e2e + `pnpm lint && pnpm build`.
5. 문서·코드 커밋.
