# committee 사이드바 "활발한 작성자" 실데이터화 설계

작성일: 2026-06-19

## 배경·목적

`/committee` 데스크톱 사이드바의 "활발한 작성자"(CONTRIBUTORS) 블록이 mock 상수(`SIDE_AUTHORS`, `lib/committee-data.ts`)로 고정돼 있다. 같은 사이드바의 "많이 읽힌 글"(POPULAR)과 좌측 카테고리 카운트는 이미 실데이터(`view_count`·집계)로 동작 중이므로, 마지막으로 남은 작성자 블록을 실데이터로 전환한다.

"주요 태그"(`BD_TAGS`) 블록은 글에 태그 시스템이 없어(글은 `category`만 보유) 실데이터화가 불가능하므로 **정적 유지(범위 제외)**한다.

## 범위 (확정 결정)

- **대상**: 데스크톱 사이드바 "활발한 작성자"만. (모바일 `CommitteeMobile`은 이 블록을 렌더하지 않음)
- **집계 범위**: **교육위원회(committee) 섹션의 게시된 글만** 작성자별로 집계. (Q1=교육위원회 섹션만)
- **주요 태그**: 정적 유지. 이번 작업에서 손대지 않음. (Q2=정적 유지)
- **디자인**: 마크업·스타일 100% 보존(헌법 [7]). 데이터 소스만 mock → 실집계로 교체.

비범위: 태그 시스템 도입, 전 섹션 합산 집계, 모바일 작성자 블록 신설, 노출 필드 변경.

## 아키텍처

### 1) 서비스 집계 — `server/services/committee.ts`

`getCommitteeListData`는 이미 게시된 committee 글 **전체**(`rows`, limit 없음)를 `author_id, author:profiles(name, title)` 포함해 조회한다. 이 `rows`를 재사용해 작성자를 JS로 집계한다 — 기존 `byCat`(카테고리), `attachCountMap`(첨부)과 **동일 패턴, 추가 쿼리·RPC 없음**.

집계 로직:
- `author_id`가 `null`인 행(작성자 삭제, `on delete set null`)은 제외.
- `author_id`별로 글 수를 누적. 표시명(`name`)·직함(`title`)은 행의 `author` 임베드에서 취득.
- 정렬: 글 수 내림차순, 동수는 이름 오름차순(안정적 표시).
- 상위 4명.

매핑(`SideAuthor`):
- `name` = 프로필 이름
- `role` = 프로필 `title`(없으면 빈 문자열)
- `init` = 이름 첫 글자(`name.charAt(0)`)
- `posts` = 집계 글 수

`CommitteeListData` 반환 타입에 `authors: SideAuthor[]`를 추가하고 `return`에 포함한다.

### 2) 타입·mock 정리 — `lib/committee-data.ts`

- `SIDE_AUTHORS` **상수 제거**(mock 제거).
- `SideAuthor` **타입은 유지** — `PopularPost`와 동일하게 서비스·컴포넌트가 공유한다.
- `BD_TAGS`는 그대로 둔다(정적 유지).

### 3) prop 스레딩 — 데스크톱 경로만

`page.tsx`(desktop 분기) → `CommitteeDesktop` → `Sidebar` → `SideAuthorsBlock`로 `authors`를 전달한다. `SideAuthorsBlock`은 `SIDE_AUTHORS` import 대신 `authors` prop을 받아 렌더한다(map 내부 로직·스타일 불변). 모바일 분기는 `authors`를 사용하지 않으므로 prop 추가 불필요.

### 서버 코드 외 변경 없음

`SideAuthorsBlock`의 색상 시드(`a.init.charCodeAt(0)`)·아바타·레이아웃은 그대로 동작한다(실 `init`로 자연 계산).

## 엣지·보안

- 작성자 4명 미만이면 있는 만큼만 표시(header + 적은 행). 0명이면 header만 렌더 — committee에 글이 있으면 발생하지 않음.
- 공개 작성자 이름 노출은 `profiles_select_public_author` RLS(이미 origin/main 머지·로컬 적용)에 의존. 따라서 비로그인(anon) 컨텍스트에서도 게시 글 작성자 이름이 resolve된다.
- `title`은 자유 입력이라 `null` 가능 → 빈 문자열 폴백(role 줄은 빈 칸으로 렌더, 레이아웃 영향 미미).

## 검증 (로컬 Supabase)

- `npx supabase db reset`로 마이그레이션 적용(스키마 불변이라 `db:types` 재생성 불필요).
- 비로그인으로 `/committee` 데스크톱을 열어 "활발한 작성자"에 **실제 이름·직함·글 수**가 표시되는지 확인(이전 고정 mock → 실집계).
- 글 수 정렬·상위 4명 제한 확인. 시드/직접 삽입으로 서로 다른 작성자 글을 만들어 순위 변화 확인.
- `pnpm lint && pnpm build` 통과.

## 구현 단계(개요)

1. `committee.ts`: 작성자 집계 추가, `CommitteeListData.authors` 반환.
2. `lib/committee-data.ts`: `SIDE_AUTHORS` 제거, `SideAuthor` 타입 유지.
3. prop 스레딩: `page.tsx`(desktop) → `CommitteeDesktop` → `Sidebar` → `SideAuthorsBlock`.
4. 로컬 e2e + `pnpm lint && pnpm build`.
5. 문서·코드 커밋.
