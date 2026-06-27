# admin C단계: 콘텐츠 현황 대시보드 설계

> 작성일: 2026-06-26 · 브랜치: `feat/admin-dashboard-stats`

## 목표

admin 대시보드(`/admin`) 상단에 5개 `posts` 도메인의 **콘텐츠 현황 요약 카드**를 추가한다. 각 카드는 `전체 N건 · 미공개 M`을 보여주고, 클릭하면 해당 도메인 관리 페이지로 이동한다. 관리자가 도메인별 글 규모와 처리 필요한 초안(미공개)을 한눈에 파악하게 한다.

## 범위

- **포함:** 공지(notice)·강습회(training)·위원회(committee)·웹진(webzine)·자료실(resource) — 동일한 `is_published` 구조를 가진 5개 도메인.
- **제외:** 수련회 이벤트·시간표·컬렉션·히어로·문의 — 구조가 달라 단순 집계가 애매. 기존 링크는 "기타 관리" 줄로 유지.
- **스키마/RLS/마이그레이션 변경 없음.** 기존 admin RLS select 정책(미공개 포함 조회)을 그대로 사용한다.

## 집계 방식

**단일 쿼리 + JS 집계.** admin 권한으로 `posts`에서 `section, is_published`만 `.in("section", [5개])`로 한 번에 읽고, JS에서 도메인별 `total`/`unpublished`를 카운트한다.

- 라운드트립 1회, RPC·마이그레이션 불필요.
- 노회 규모상 행 수가 작아 전송량 부담 없음.
- (대안으로 도메인별 head count 10회 호출, DB 집계 RPC가 있으나 각각 라운드트립 과다·마이그레이션 필요로 채택하지 않음.)

## 구성요소

### 1. `src/server/services/admin-stats.ts` (신규)

```ts
import "server-only";

export type ContentStat = {
  section: string;
  label: string;
  href: string;
  total: number;
  unpublished: number;
};

export async function getAdminContentStats(): Promise<ContentStat[]>;
```

- 5개 도메인 메타(section·label·href)를 상수로 정의.
- `posts`에서 `section, is_published`를 `.in("section", sections)`로 단일 조회.
- JS에서 도메인별 `total`(행 수)·`unpublished`(`is_published === false` 수) 집계.
- 메타 정의 순서대로 `ContentStat[]` 반환(데이터가 0건인 도메인도 카드 노출).

### 2. `src/app/(admin)/admin/_components/StatCard.tsx` (신규)

- 서버 컴포넌트. props: `{ stat: ContentStat }`.
- 전체가 `<Link href={stat.href}>`인 카드.
- 표시: 도메인명(label) / `전체 N` / `미공개 M`.
- `unpublished >= 1`이면 미공개 수치를 강조색(예: `#c00`), 0이면 은은한 회색(`#888`).

### 3. `src/app/(admin)/admin/page.tsx` (수정)

- 상단 인사·로그아웃 아래에 **"콘텐츠 현황"** 섹션 추가: `getAdminContentStats()` 호출 → 카드 그리드(`display: grid`, 반응형 `repeat(auto-fill, minmax(...))`).
- 기존 한 줄 링크 목록 중 5개 posts 도메인 링크는 카드로 **대체(제거)**.
- 나머지 링크(문의·이벤트·시간표·컬렉션·히어로)는 **"기타 관리"** 줄로 유지.
- 기존 "계정 생성"·"회원 비밀번호 재설정" 섹션은 그대로 둔다.

## 데이터 흐름

Server Component(`page.tsx`)가 `getAdminContentStats()`를 직접 호출(읽기 규약 1번) → 카드 렌더. 쓰기 경로 없음. 진입부 `requireAdmin()`는 기존대로 유지(proxy 가드 + 서버 재확인).

## 디자인

admin 화면은 디자인 이식 대상이 아닌 **기능용 인라인 스타일** 영역(기존 `page.tsx`와 동일 톤). 같은 인라인 스타일 카드로 통일한다. 헌법[7] 디자인 보존은 공개 페이지 대상이며 여기에는 적용되지 않는다.

## 검증

- `npx tsc --noEmit` · `pnpm lint` · `pnpm build` 통과.
- 로컬 e2e: admin 로그인 → `/admin`에서 5개 카드 노출·숫자 정확성 확인. seed 글 1건을 비공개로 토글 후 해당 카드 `미공개` 수치 증가 확인 → 복구. 카드 클릭 시 해당 관리 페이지 이동. 콘솔 오류 0.
