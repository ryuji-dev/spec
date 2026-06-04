# 신학원웹진(webzine) — 설계 문서

작성일: 2026-06-04
대상 브랜치: `feat/webzine-board`

## 배경 / 목표

교육위원회·자료공유·자유게시판·교역자수련회까지 DB 연동 완료. 다음으로 **신학원웹진(webzine)** 의 기사 목록을 DB 연동한다. 웹진은 **읽기 전용 매거진**(admin이 글을 발행, 누구나 열람)으로, 댓글·좋아요·첨부가 없는 가장 가벼운 섹션이다. committee의 뷰모델 서비스 + admin CRUD 패턴을 따르되, 매거진 특유의 **표지 에세이(featured)** 와 **파생 필드(cover 일러스트·read 읽기시간)** 를 더한다.

### 확정된 결정 (사용자 승인)
| 항목 | 결정 |
|------|------|
| 연동 범위 | 기사 목록(표지 에세이 + 그리드) + 상세 |
| cover·read | **자동 파생** — cover는 카테고리→일러스트 고정 맵, read는 본문 길이로 계산 (DB 스키마 추가·meta 없음) |
| 상세 페이지 | **있음** (`전문 읽기` → `/webzine/[id]`, 본문) |
| 댓글 | **없음** (읽기 전용) |
| 첨부·좋아요 | 없음 |
| featured(표지 에세이) | `isPinned` 기사. 없으면 최신 기사 fallback |
| 작성·수정·삭제 | **admin 전용** |
| 지난호 아카이브·현재호 라벨 | mock 정적 유지 |
| 열람 | 공개 (proxy 가드 없음) |

## 아키텍처

`posts`(section='webzine'). 댓글·첨부·좋아요 인프라 불사용. 순수 매퍼(`lib/webzine.ts`)가 DB행 → `WebzineArticle`/featured 뷰모델로 변환하며 cover·read·tag를 파생. 목록 페이지(서버)가 서비스 호출 → 기사 영역 props 주입(아카이브·현재호 라벨은 정적).

### 데이터 모델 (posts, section='webzine')
- `category`: 신학산책 / 현장에서 / 북리뷰 / 에세이 / 교회사 / 대담 (6종)
- `title`, `excerpt`(부제/요약), `body`(본문), `authorId`, `viewCount`, `isPublished`(기본 true), `isPinned`(표지 에세이), `createdAt`
- (meta·eventDate·attachments·comments 미사용)

### 파생 규칙 (lib/webzine.ts, 순수)
- `WZ_CATEGORY_EN`(tag): 신학산책→THEOLOGY, 현장에서→FIELD, 북리뷰→REVIEW, 에세이→ESSAY, 교회사→HISTORY, 대담→DIALOGUE
- `WEBZINE_CATEGORIES_KO`: 6종
- `WZ_CATEGORY_COVER`: 신학산책→book, 현장에서→rural, 북리뷰→book2, 에세이→child, 교회사→history, 대담→dialogue (mock과 1:1). 폴백 book
- `readingTime(bodyLength)`: 한국어 ~약 350자/분 기준 `최대(1, round(len/350))` → `"N분"`
- `WebzineRow`(DB 평면 행: id·category·title·excerpt·viewCount·createdAt·isPinned·authorName·authorTitle·bodyLength) → `toWebzineArticleView(row)` → `WebzineArticle`({id, cat, tag, title, excerpt, author, date, read, cover})
  - date: 기존 그리드는 `2026.{date}` 형식이므로, mock과 호환되게 `MM.DD` 또는 전체 날짜 — 매퍼에서 `formatDate` 후 그리드 표시에 맞춤(구현 시 디자인 텍스트 보존)
- featured 뷰모델 `toWebzineFeaturedView(row)` → {issue(정적 상수), category(tag), title, subtitle(excerpt), author, authorRole(authorTitle), date, read, cover:"wilderness"}

### 서비스 (server/services/webzine.ts, server-only)
- `getWebzineListData()` → `{ featured: WebzineFeatured | null, articles: WebzineArticle[], categories: WebzineCategory[] }`. section='webzine' AND isPublished. featured=isPinned(없으면 최신), 나머지 articles. 카테고리 카운트. `length(body)`로 read 계산용 bodyLength 집계.
- `getWebzineArticle(id)` → 상세(제목·부제·본문·작성자·날짜·read·tag·cover) | null. viewCount++.
- `getWebzineArticleForEdit(id)` → admin 편집용(category·title·excerpt·body·isPinned).

### 쓰기 (server/actions/webzine.ts, 'use server')
- `createPost` — `requireAdmin`, zod(title·category(6종)·excerpt·body·isPinned), insert section='webzine', redirect `/webzine/${id}`.
- `updatePost(id, ...)` — `requireAdmin`, update, redirect `/webzine/${id}`.
- `deletePost(id)` — `requireAdmin`, posts delete, redirect `/webzine`.
- (첨부 단계 없으므로 createPost는 상세로 직행)

### 페이지
- `app/webzine/page.tsx`(서버): `getWebzineListData()` → `WebzineDesktop`/`WebzineMobile`에 featured·articles·categories props. 현재호 라벨·아카이브(WZ_BACK_ISSUES)는 정적.
- 컴포넌트 배선: 표지 에세이 블록·기사 그리드·카테고리 nav 카운트 mock→props. `전문 읽기`·기사 카드 클릭 → `/webzine/${id}`. **마크업·일러스트(CoverArt/CoverWilderness)·style 보존**. 아카이브 섹션 불변.
- 상세 `app/webzine/[id]/page.tsx`(신규 최소 화면): tag·제목·부제·작성자·날짜·read·본문. admin 수정/삭제.
- admin `app/(admin)/admin/webzine/new`·`[id]/edit`: `requireAdmin`, EditorForm(webzine 카테고리·isPinned) + 삭제 폼. (첨부 관리 없음)

## 재사용 / 신규
- 재사용: `lib/format.ts`(formatDate/formatAuthor), `server/auth/current-user`(requireAdmin), posts 테이블.
- 신규: `lib/webzine.ts`(매퍼·파생), `server/services/webzine.ts`, `server/actions/webzine.ts`, `app/webzine/[id]/page.tsx`, `app/(admin)/admin/webzine/{EditorForm,new,[id]/edit}`, verify-webzine.mjs. 수정: `app/webzine/page.tsx`·`WebzineDesktop`·`WebzineMobile`(기사 영역 배선).
- **불사용**: comments·attachments·post_likes·uploads (웹진은 순수 읽기).

## 검증
- `pnpm lint`/`build`, `webzine:verify`(파생: cover·read·tag 매핑), 기존 verify 회귀.
- dev-db에 webzine seed(featured 1 + 기사 several, 카테고리 분산, isPinned 1).
- Preview e2e: 목록(표지 에세이 + 그리드 DB), 기사 클릭 → 상세(본문). admin 작성/수정/삭제. 비admin은 admin 경로 가드. 아카이브 정적 표시.

## 범위 밖 (후속)
- 카테고리 필터링(현재 디자인은 정적 nav), 인기순 정렬, 호(issue) 관리 DB화, 지난호 아카이브 DB화.
- 남은 섹션(교수소개), 실제 VM 배포.
