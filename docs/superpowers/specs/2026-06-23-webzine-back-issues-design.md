# 웹진 "지난 호" 실데이터화 설계

## 배경
신학원웹진(`/webzine`)은 featured·기사 목록·카테고리 카운트가 모두 실데이터로 동작한다. 다만 하단 **"지난 호"(`WZ_BACK_ISSUES`)** 섹션만 mock 상수다. `posts` 테이블은 **개별 기사(article) 단위**라 "호(issue/volume)"라는 개념 자체가 없다. 따라서 별도 "호" 모델을 만들지 않고, "지난 호"를 **"지난 글 다시 읽기"로 재해석**해 실 기사 데이터로 채운다.

## 선정 규칙 (`backIssues`)
- 이미 조회한 webzine `rows`를 **재사용**(추가 쿼리 없음).
- **조회수 상위 4편**(`view_count` 내림차순, 동점 시 `created_at` 최신 우선)을 노출.
- featured 제외 여부는 두지 않는다 — featured도 "많이 읽힌 글"이면 다시 읽기 목록에 포함될 수 있다(중복은 의미상 허용; 메인 그리드와 별개 섹션).

## 슬롯 매핑 (마크업 보존, 값만 실데이터)
카드 슬롯 4개의 **필드명은 유지**해 마크업을 건드리지 않고, 서비스가 채우는 값만 바꾼다.

| 카드 슬롯 | 기존(mock) | 변경(실데이터) |
|---|---|---|
| `vol` (대문자 라벨) | `Vol. 23` | EN 카테고리 태그 (`THEOLOGY` 등) |
| `issue` (굵은 텍스트) | `2026 신년호` | 한글 카테고리 (`신학산책` 등) |
| `theme` (serif 큰 글) | 테마 문구 | **기사 제목** |
| `date` | `2026.01` | 기사 작성일(`YYYY.MM.DD`) |

- `WebzineBackIssue` 타입에 `id: string` 추가(네비게이션용). 나머지 필드명(`vol`/`issue`/`date`/`theme`)은 그대로 둔다.
- 카테고리가 `WZ_CATEGORY_EN`에 없으면 상세 페이지와 동일하게 `에세이`로 폴백.

## 인터랙션
- 카드에 onClick 추가 → `router.push('/webzine/{id}')`. 기존 `cursor:pointer`만 있던 장식 카드를 실제 라우팅으로 연결(board/resources에서 쓴 패턴). 데스크톱·모바일 동일.

## 헤더 카피 교체 (데스크톱)
데스크톱 "지난 호" 섹션의 고정 문구가 새 모델에서 사실과 달라지므로 교체한다.
- 기존: `"2014년 창간 이후 발행된 23개의 호. 그동안의 글들을 분기별로 모아두었습니다."`
- 교체: `"신학원웹진에 실린 글 가운데 많이 읽힌 글들을 다시 모았습니다."`
- 섹션 제목 `지난 호`(데스크톱)·`지난 호 다시 읽기`(모바일)는 **라벨**이므로 유지. 모바일에는 사실 주장 단락이 없어 카피 변경 없음.

## 데이터 흐름
- `WebzineListData`에 `backIssues: WebzineBackIssue[]` 추가.
- `getWebzineListData()`가 `rows`에서 상위 4편을 골라 `backIssues`로 변환해 반환.
- `page.tsx`가 `backIssues={data.backIssues}`를 데스크톱·모바일에 전달.
- 두 컴포넌트는 `WZ_BACK_ISSUES` import를 제거하고 props `backIssues`를 렌더(데스크톱 `.map`, 모바일 `.slice(0,4)` 유지).

## 설계 보존 (헌법 [7])
- 카드/그리드 마크업·스타일·일러스트는 불변. 데이터 흐름(props 주입)·카드 onClick·데스크톱 사실 문구 1줄만 변경.

## 범위 제외
- "호(issue/volume)" 스키마 도입은 하지 않는다(YAGNI, 1인 운영).
- featured/기사 그리드/카테고리/상세/조회수는 이미 동작 → 변경 없음.

## 정리
- `src/lib/webzine-data.ts`에서 `WZ_BACK_ISSUES` mock 상수 제거. `WebzineBackIssue` 타입은 유지(+`id`).

## 검증
- `pnpm lint && pnpm build`
- 로컬 Supabase(127.0.0.1 확인)에 `view_count`가 서로 다른 webzine 글을 시드한 뒤, `/webzine` 데스크톱·모바일에서 "지난 호" 카드가 조회수 상위 4편을 제목·카테고리·날짜와 함께 노출하고, 클릭 시 `/webzine/{id}`로 이동하는지 렌더 DOM으로 확인.
