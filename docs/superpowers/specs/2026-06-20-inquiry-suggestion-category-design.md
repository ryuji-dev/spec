# 푸터 "제안 보내기" → /support 제안 유형 설계

작성일: 2026-06-20

## 배경·목적

메인 푸터 "소통" 열의 "제안 보내기"가 `href` 없는 비기능 텍스트로 렌더된다(`main-page-data.ts`의 `FOOTER_COLUMNS`, 같은 열의 공지사항·사진첩·문의하기는 실제 링크). 이 항목을 기능화한다.

"제안"은 별도 시스템을 새로 만들기보다 기존 `/support` 문의 시스템의 한 **유형**으로 보는 것이 적절하다(1인·저비용 운영, YAGNI). 따라서 문의 카테고리에 `suggestion`(제안)을 추가하고, 푸터 항목을 `/support?category=suggestion`로 연결해 폼이 "제안" 유형으로 열리게 한다.

## 범위 (확정 결정)

- 문의 시스템에 `suggestion`(제안) 유형 추가.
- 푸터 "제안 보내기" → `/support?category=suggestion` 연결(폼 유형 자동 선택).
- 흩어진 카테고리 라벨 삼항식을 공용 라벨 맵으로 통일(이번 변경으로 깨지는 지점 정리).
- 푸터는 **데스크톱 전용**(`FOOTER_COLUMNS`는 `DesktopFooter`에서만 사용) — 모바일 변경 없음.

비범위: 별도 "제안" 테이블/페이지 신설, 제안 전용 답변 플로우, 알림/이메일, 푸터의 다른 라벨-only 항목(교육 사역·자료실 열) 처리.

## 아키텍처

### 1) DB 마이그레이션 — `supabase/migrations/<ts>_inquiry_suggestion_category.sql`

기존 제약(`20260611074022_inquiries.sql`):
```sql
category text not null check (category in ('general','password'))
```
을 `suggestion` 포함으로 교체한다:
```sql
alter table public.inquiries drop constraint inquiries_category_check;
alter table public.inquiries
  add constraint inquiries_category_check
  check (category in ('general','suggestion','password'));
```
(제약명은 기존 `inquiries_category_check`. 실제 이름은 마이그레이션 작성 시 `\d inquiries`로 확인해 일치시킨다.)

### 2) DTO·라벨 — `src/lib/dto/inquiry.ts` (client-safe)

- `INQUIRY_CATEGORIES`에 `"suggestion"` 추가. 순서는 `["general", "suggestion", "password"]` — `general`을 첫 항목으로 유지해 기본 선택값 불변.
- 공용 라벨 맵 신설:
  ```ts
  export const INQUIRY_CATEGORY_LABEL: Record<InquiryCategory, string> = {
    general: "일반 문의",
    suggestion: "제안",
    password: "비밀번호 분실",
  };
  ```
- `inquirySchema`의 `z.enum(INQUIRY_CATEGORIES)`는 자동으로 `suggestion`을 허용(서버·클라이언트 공유 검증).

### 3) 서비스 타입 — `src/server/services/inquiry.ts`

`Inquiry` 타입의 `category: "general" | "password"` → `"general" | "suggestion" | "password"`. (또는 `InquiryCategory`를 재사용하도록 정리.)

### 4) 입력 폼 — `src/app/(public)/support/InquiryForm.tsx`

- 로컬 `CATEGORY_LABEL`(general/password) 제거 → 공용 `INQUIRY_CATEGORY_LABEL` 사용.
- `initialCategory?: InquiryCategory` prop 추가. `useState<InquiryCategory>(initialCategory ?? "general")`로 초기값 설정.
- `needsContact = !isLoggedIn || category === "password"` 로직 불변(제안은 일반과 동일하게 동작, password만 연락처 강제).

### 5) 공개 페이지 — `src/app/(public)/support/page.tsx`

- `searchParams: Promise<{ category?: string }>`를 받아 `await`. 값이 `INQUIRY_CATEGORIES`에 포함되면 `initialCategory`로 `InquiryForm`에 전달, 아니면 미전달(기본 general).
- "내 문의 내역" 라벨의 삼항식(`q.category === "password" ? ... : ...`)을 `INQUIRY_CATEGORY_LABEL[q.category]`로 교체.

### 6) 관리자 화면 — `src/app/(admin)/admin/inquiries/page.tsx`

- 목록의 라벨 삼항식(`q.category === "password" ? "비밀번호 분실" : "일반 문의"`)을 `INQUIRY_CATEGORY_LABEL[q.category]`로 교체. 답변 플로우는 유형과 무관하게 공통이므로 그 외 변경 없음.

### 7) 푸터 데이터 — `src/lib/main-page-data.ts`

`FOOTER_COLUMNS`의 "소통" 열에서 `{ label: "제안 보내기" }` → `{ label: "제안 보내기", href: "/support?category=suggestion" }`.

## 보안·동작 고려

- 제안 문의도 기존 문의와 동일한 경로(Server Action `submitInquiry`, zod 검증, honeypot, RLS)를 그대로 탄다. 새 권한·정책 불필요.
- `category` 쿼리 파라미터는 화이트리스트(`INQUIRY_CATEGORIES`) 검증 후에만 사용 — 임의 값은 무시하고 기본 general. 폼 제출의 최종 검증은 서버 zod enum이 재확인.
- 라벨 맵은 `Record<InquiryCategory, string>`로 강제 → 향후 카테고리 추가 시 라벨 누락이 타입 에러로 드러남(안전).

## 검증 (로컬 Supabase)

- `npx supabase db reset`로 마이그레이션 적용(스키마 제약 변경 — `inquiries` 컬럼 타입 불변이라 `db:types` 영향 없음, 단 재생성해도 무방).
- 데스크톱 메인에서 푸터 "제안 보내기" 클릭 → `/support?category=suggestion` 이동, 폼 "문의 유형"이 **제안**으로 선택돼 열림.
- 제안 문의 제출 → DB `inquiries.category = 'suggestion'` 확인.
- 비로그인/로그인 각각: 로그인 시 "내 문의 내역"에 "제안" 라벨 표시, admin 목록에서도 "제안" 라벨 표시.
- 무효 쿼리(`?category=foo`) → 기본 general로 열림(에러 없음).
- `pnpm lint && pnpm build` 통과.

## 구현 단계(개요)

1. 마이그레이션(제약 교체) 작성·적용.
2. DTO 카테고리·공용 라벨 맵 + 서비스 타입 확장.
3. 폼 `initialCategory` prop·라벨 맵 적용.
4. 공개/관리자 페이지 라벨 맵 적용 + 공개 페이지 searchParams 프리필.
5. 푸터 href 연결.
6. 로컬 e2e + lint/build, 문서·코드 커밋.
