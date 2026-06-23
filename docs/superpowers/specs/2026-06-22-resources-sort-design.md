# 자료실 정렬 실동작화 설계

## 배경
자료공유(`/resources`)는 파일 목록·카테고리·인기 Top5·상세/다운로드·admin CRUD가 모두 실데이터로 동작한다. 다만 데스크톱 정렬 탭(최신순·다운로드순·이름순)이 `sort` 상태만 있고 목록 정렬에 반영되지 않는다(항상 `created_at` 내림차순 고정). board 정렬과 동일한 방식으로 클라이언트 정렬을 연결한다.

## 정렬 규칙 (`ResourcesSort`)
- **최신순(recent)**: 서비스가 `created_at` 내림차순으로 제공 → 원배열 순서 유지(재정렬 없음).
- **다운로드순(downloads)**: `downloads`(=view_count) 내림차순. JS 안정 정렬이라 동률은 최신순 유지.
- **이름순(name)**: `title` 한글 `localeCompare("ko")` 오름차순.

## 구현
- **`src/lib/resource.ts`** (클라이언트 안전 순수 유틸)에 `sortResourceFiles(files: ResourceFile[], sort: ResourcesSort): ResourceFile[]` 추가.
  - `recent`는 입력 배열 그대로 반환, `downloads`·`name`은 복사본 정렬(입력 불변).
  - `ResourcesSort` 타입은 `@/lib/resources-data`에서 import.
- **`src/app/resources/_components/desktop/ResourcesDesktop.tsx`**: 카테고리 필터 결과 `filtered` 뒤에 `const sorted = sortResourceFiles(filtered, sort)`를 두고, `FileGrid`/`FileList`에 `files={sorted}` 전달.
  - "총 N건" 카운트는 `filtered.length` 유지(정렬은 개수 불변).

## 설계 보존
- 마크업·정렬 탭 UI·그리드/리스트 토글은 변경하지 않는다. 데이터 흐름(정렬 적용)만 추가한다.

## 범위 제외
- **Collections**(`LB_COLLECTIONS`)는 mock 유지(큐레이션 전용 스키마 미보유, YAGNI).
- **모바일**(`ResourcesMobile`)은 정렬 UI가 없어 변경 없음.
- 그리드/리스트 보기, 상세/다운로드, admin은 이미 동작.

## 검증
- `pnpm lint && pnpm build`
- 로컬 Supabase에 다운로드 수·제목·작성일이 서로 다른 resource 글을 시드한 뒤, `/resources` 데스크톱에서 최신순→다운로드순→이름순 전환 시 순서가 규칙대로 바뀌는지 e2e 확인.
