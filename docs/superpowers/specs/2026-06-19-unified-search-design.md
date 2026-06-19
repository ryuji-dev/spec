# 통합 검색 설계

작성일: 2026-06-19

## 배경·목적

데스크톱 상단 네비(`DesktopNav`)와 모바일 스티키 헤더(`MobileStickyHeader`)의 **검색 버튼이 동작하지 않는다**(죽은 컨트롤). 노회 포털의 콘텐츠(공지·게시판·교육위원회·수련회·웹진·자료)는 모두 `posts` 한 테이블에 섹션으로 구분되어 저장되므로, 섹션을 가로지르는 **통합 검색**을 제공한다.

대상: 비로그인 포함 모든 방문자. 공개(`is_published=true`) 글만 검색된다.

## 범위 (확정 결정)

- **UX 흐름**: 전용 결과 페이지 `/search?q=...`. Server Component가 서비스를 직접 호출(HTTP hop 없음). 클라이언트 fetch·Route Handler 없음.
- **검색 필드**: `title` + `excerpt` + `body` 부분일치(`ilike`).
- **대상 섹션**: 6종 전체(notice·board·committee·training·webzine·resource). 모두 공개 상세 경로 보유.
- **결과 표시**: 섹션 구분 없는 통합 목록 + 각 항목에 섹션 뱃지. 최신순(`created_at desc`), 상위 50건, "검색 결과 N개" 카운트.
- **페이지 구성**: device-split(데스크톱 `DesktopNav(solid)`, 모바일 스티키 헤더 + `BottomTabBar`) — 기존 `/notice`·`/gallery`와 동일.
- **공용화**: `home.ts`·`gallery.ts`에 중복된 섹션 매핑 상수를 `src/lib/section-meta.ts`로 추출, search가 세 번째 소비자.

비범위(v2): 무한 스크롤/페이지네이션, 섹션별 그룹핑, 인라인 자동완성 드롭다운, 검색어 하이라이트, 첨부 파일명 검색.

## 아키텍처

### 데이터 계층 — `src/server/services/search.ts`

```
searchPosts(rawQuery: string): Promise<SearchResult[]>
```

`SearchResult` 타입:
```ts
type SearchResult = {
  id: string;
  title: string;
  snippet: string;       // excerpt ?? body 앞부분 발췌
  section: PostSection;   // 뱃지 라벨용
  sectionLabel: string;   // SECTION_LABEL[section]
  date: string;           // formatDate(created_at)
  href: string;           // SECTION_ROUTE[section]/{id}
};
```

쿼리:
```
supabase.from("posts")
  .select("id, title, excerpt, body, section, created_at")
  .eq("is_published", true)
  .or(`title.ilike.${pat},excerpt.ilike.${pat},body.ilike.${pat}`)
  .order("created_at", { ascending: false })
  .limit(50)
```
- `pat = %{sanitized}%`.
- 결과 매핑 시 `snippet`은 `excerpt`가 있으면 그것, 없으면 `body`를 공백 정리 후 120자 내로 자른다(말줄임).
- `createSupabaseServer()`(anon 컨텍스트) 사용 — RLS가 비공개 글을 한 번 더 차단.
- 파일 상단 `import "server-only"`.

### 입력 정제 (보안·견고성)

- 트림 후 **빈 문자열이면 빈 배열 반환**(쿼리 실행 안 함).
- **길이 컷**: 100자 초과 시 100자로 절단.
- **PostgREST `.or()` 인젝션 방지**: PostgREST는 `,`로 필터를 구분하고 `()`로 그룹을 만들며 `*`는 ilike 와일드카드다. 사용자 입력에서 `,` `(` `)` `*` `%` `\` 를 제거(또는 공백 치환)한 뒤 `ilike` 패턴을 만든다. 이로써 필터 구문 깨짐과 의도치 않은 와일드카드 매칭을 모두 방지한다.
- 정제 로직은 서비스 내부 순수 함수 `sanitizeQuery(raw): string`로 분리해 단위 검증 가능하게 둔다.

### 공용 모듈 — `src/lib/section-meta.ts`

기존 `home.ts`·`gallery.ts`에 흩어진 상수를 모은다(순수 상수·타입만 → 클라이언트 공용 가능):
- `SECTION_LABEL: Record<PostSection, string>` — 뱃지/태그 라벨.
- `SECTION_ROUTE: Record<PostSection, string>` — 공개 상세 경로(`resource`→`/resources`).
- `SECTION_PHOTO_TYPE: Record<PostSection, PhotoTileType>` — 사진 폴백 타입(gallery·home에서 사용).

`gallery.ts`·`home.ts`는 로컬 상수를 제거하고 이 모듈을 import 하도록 수정(동작 불변, 순수 리팩터).

### 페이지 — `src/app/search/page.tsx`

- `searchParams`에서 `q` 추출(`await` 패턴, Next 16).
- `searchPosts(q)` 호출 → 결과를 device별 컴포넌트에 props로 전달.
- `getDeviceType(await headers())`로 분기.

```
src/app/search/
├── page.tsx
└── _components/
    ├── desktop/SearchDesktop.tsx + .module.css
    └── mobile/SearchMobile.tsx + .module.css
```

- **데스크톱**: `<DesktopNav variant="solid" />` + `PageHeroDesktop`(kicker "SEARCH", title "통합 검색") + 검색 폼(`<form method="get" action="/search">`, `name="q"`, 기본값 = 현재 q) + 결과 목록.
- **모바일**: `PageHeroMobile` + 검색 폼 + 결과 목록 + `<BottomTabBar />`.
- 결과 항목은 `<Link href={r.href}>` (제목·발췌·섹션 뱃지·날짜).

### 상태별 화면

- **q 없음/빈 값**: 안내 문구 "검색어를 입력해 주세요." (폼만 표시)
- **결과 있음**: "검색 결과 N개" + 목록.
- **결과 없음**: "‘{q}’에 대한 검색 결과가 없습니다."

### 진입점 연결

- `DesktopNav.tsx`: 검색 `<button>` → `<Link href="/search">`(아이콘 유지, 디자인 클래스 보존).
- `MobileStickyHeader.tsx`: 검색 `<button>` → `<Link href="/search">`(아이콘 유지).

> 헌법 [7]: 아이콘 마크업·클래스는 그대로 두고 `button`→`Link` 기계적 치환 + 라우팅만 추가.

## 에러 처리

- supabase 에러는 throw(상위 error boundary). 빈 결과는 정상 경로.
- 정제 결과가 빈 문자열이면 쿼리 생략하고 "검색어를 입력해 주세요" 표시.

## 검증

- `pnpm lint && pnpm build`.
- 로컬 Supabase 시드 데이터로 e2e(데스크톱 1280×800 / 모바일 390×844):
  - 일반 검색어 → 매칭 결과·섹션 뱃지·카운트 표시.
  - 결과 항목 클릭 → 올바른 `SECTION_ROUTE/{id}` 상세 이동.
  - 빈 검색어 → 안내 문구.
  - 없는 검색어 → "검색 결과가 없습니다".
  - 특수문자(`,`, `(`, `%`, `*`) 입력 → 깨지지 않고 안전 처리.
  - 데스크톱·모바일 검색 버튼 → `/search` 이동.
- 리팩터 회귀: `/main`·`/gallery` 사진/링크 정상(섹션 매핑 공용화 후).

## 구현 단계(개요)

1. `src/lib/section-meta.ts` 추출 + `home.ts`·`gallery.ts` 치환(순수 리팩터, 회귀 검증).
2. `src/server/services/search.ts`(`sanitizeQuery` + `searchPosts`).
3. `/search` 페이지 + 데스크톱/모바일 컴포넌트.
4. 진입점 연결(DesktopNav·MobileStickyHeader 검색 버튼).
5. 로컬 e2e 검증·정리.
