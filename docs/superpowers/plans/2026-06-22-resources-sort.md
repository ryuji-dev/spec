# 자료실 정렬 실동작화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자료실 데스크톱 정렬 탭(최신순·다운로드순·이름순)이 실제 목록 순서를 바꾸도록 클라이언트 정렬을 연결한다.

**Architecture:** `lib/resource.ts`에 순수 정렬 함수 `sortResourceFiles`를 추가하고, `ResourcesDesktop`에서 카테고리 필터 결과에 정렬을 적용해 렌더한다. 디자인 마크업은 보존하고 데이터 흐름만 추가한다.

**Tech Stack:** TypeScript(strict), React(클라이언트 컴포넌트), Next.js 16. 단위 테스트 러너 없음 → `pnpm lint && pnpm build` + 로컬 Supabase e2e로 검증.

---

### Task 1: 정렬 순수 함수 추가

**Files:**
- Modify: `src/lib/resource.ts`

- [ ] **Step 1: `ResourcesSort` import + `sortResourceFiles` 구현**

`src/lib/resource.ts` 상단 import에 `ResourcesSort` 타입을 추가한다. 현재 import 블록(2~9행 근처)은 `./resources-data`에서 `ResourceFile` 등을 type import 한다. 거기에 `ResourcesSort`를 추가:

```ts
import type {
  // ...기존 type들 (ResourceFile, ResourceCategoryEn, ResourceFileType, ResourceFileCategory 등 그대로 유지)...
  ResourcesSort,
} from "./resources-data";
```

> 주의: 기존 import 목록을 지우지 말고 `ResourcesSort`만 추가한다. 실제 기존 항목은 파일을 열어 확인할 것.

파일 끝에 함수 추가:

```ts
// 자료실 목록 정렬 — recent는 입력 순서(서비스가 created_at desc로 제공) 유지,
// downloads/name만 복사본을 정렬(안정 정렬이라 동점은 최신순 유지).
export function sortResourceFiles(
  files: ResourceFile[],
  sort: ResourcesSort,
): ResourceFile[] {
  if (sort === "downloads") {
    return [...files].sort((a, b) => b.downloads - a.downloads);
  }
  if (sort === "name") {
    return [...files].sort((a, b) => a.title.localeCompare(b.title, "ko"));
  }
  return files;
}
```

- [ ] **Step 2: 린트·타입 확인**

Run: `pnpm lint`
Expected: 통과(에러 없음)

---

### Task 2: 데스크톱 정렬 적용

**Files:**
- Modify: `src/app/resources/_components/desktop/ResourcesDesktop.tsx`

- [ ] **Step 1: `sortResourceFiles` import 추가**

기존 import 구역(예: `import type { ResourceFile, ... } from "@/lib/resources-data";` 아래)에 추가:

```ts
import { sortResourceFiles } from "@/lib/resource";
```

- [ ] **Step 2: 정렬 적용**

기존:
```tsx
  const filtered =
    activeCat === 0 ? files : files.filter((f) => f.cat === categories[activeCat].ko);
```
바로 아래에 추가:
```tsx
  const sorted = sortResourceFiles(filtered, sort);
```

- [ ] **Step 3: 렌더를 `sorted`로 교체**

`FileGrid`·`FileList` 두 곳의 `files={filtered}` 를 `files={sorted}` 로 교체.
**주의**: "총 N건" 카운트(`{filtered.length}`)는 그대로 둔다(정렬은 개수 불변).

- [ ] **Step 4: 린트·빌드 확인**

Run: `pnpm lint && pnpm build`
Expected: 모두 통과

---

### Task 3: 로컬 e2e 검증

**Files:** (코드 변경 없음)

- [ ] **Step 1: 다운로드 수·제목·작성일이 다른 resource 글 시드**

로컬 Supabase(127.0.0.1 확인)에 `section='resource'` 글 3건 시드. `view_count`(=다운로드)·`title`·`created_at`을 세 정렬이 모두 다른 순서가 되도록 분포:
- 예) 글가(view 10, 최신), 글나(view 100, 중간), 글다(view 50, 과거)
  - 최신순: 가 → 나 → 다 / 다운로드순: 나 → 다 → 가 / 이름순: 가 → 나 → 다 (제목 가나다)
- author_id는 임의 admin/유저, `is_published=true`.

- [ ] **Step 2: 정렬 탭 전환 검증**

`/resources` 데스크톱에서 최신순→다운로드순→이름순 전환 시 파일 목록 순서가 규칙대로 바뀌는지 렌더 DOM으로 확인:
- 다운로드순: `downloads` 내림차순
- 이름순: 제목 가나다 오름차순
- 최신순: 원래(created_at desc) 순서

(참고: `/resources`는 공개 라우트라 로그인 가드 없음 — proxy 보호 대상 아님. 로그인 불필요.)

- [ ] **Step 3: 테스트 데이터 정리**

시드한 글을 정확 매치 조건으로 삭제해 로컬 DB를 원상 복구.

---

## Self-Review
- **Spec 커버리지**: 정렬 규칙(recent/downloads/name) → Task 1, 데스크톱 적용 → Task 2, 검증 → Task 3. Collections·모바일 제외는 spec과 일치(변경 없음). 누락 없음.
- **Placeholder**: 없음(모든 코드 블록 실제 코드). Task 1 import는 기존 목록 보존을 명시.
- **타입 일관성**: `sortResourceFiles(files: ResourceFile[], sort: ResourcesSort)` 시그니처를 Task 1에서 정의하고 Task 2에서 동일 호출. `ResourcesSort`·`ResourceFile`은 `resources-data.ts`의 기존 export.
