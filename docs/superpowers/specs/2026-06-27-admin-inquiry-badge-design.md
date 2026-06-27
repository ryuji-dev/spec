# admin 대시보드 미처리 문의 배지 설계

> 작성일: 2026-06-27 · 브랜치: `feat/admin-inquiry-badge`

## 목표

admin 대시보드(`/admin`)의 "문의 접수함 →" 링크 옆에, **미답변(접수됨) 문의가 1건 이상일 때만** 빨간 강조 배지로 건수를 표시한다. 1인 운영에서 답변이 밀린 문의를 대시보드 진입 즉시 인지하게 한다.

## 범위

- **미처리 정의:** `inquiries.answer is null` — admin 문의 페이지의 "접수됨"(미답변) 기준과 동일. (`q.answer ? "답변완료" : "접수됨"`)
- **스키마/RLS/마이그레이션 변경 없음.** 기존 admin RLS 정책으로 전체 문의를 카운트한다.
- 0건일 때는 배지를 숨긴다(주의가 필요할 때만 노출).

## 구성요소

### 1. `src/server/services/inquiry.ts` (수정)

```ts
export async function countUnansweredInquiries(): Promise<number>;
```

- `head: true, count: "exact"`로 행 전송 없이 카운트만 조회.
- `.is("answer", null)` 필터.
- `count`가 null이면 0 반환.

### 2. `src/app/(admin)/admin/page.tsx` (수정)

- `countUnansweredInquiries()`를 `getAdminContentStats()`와 함께 호출.
- "기타 관리" 줄의 "문의 접수함 →" 링크 옆에 `unanswered > 0`일 때만 `<span>` 빨간 pill 배지(건수) 렌더.

## 데이터 흐름

Server Component(`page.tsx`)가 서비스를 직접 호출(읽기 규약 1번). 쓰기 없음. 진입부 `requireAdmin()` 유지.

## 디자인

admin 기능 화면이라 기존 인라인 스타일과 동일 톤. 배지는 `background:#c00; color:#fff` 작은 pill(`borderRadius`, 작은 폰트·패딩).

## 검증

- `npx tsc --noEmit` · `pnpm lint` · `pnpm build` 통과.
- 로컬 e2e: 미답변 문의가 있는 상태에서 `/admin` 진입 → 배지 노출·건수 정확. 해당 문의에 답변 기록 후 → 건수 감소/배지 사라짐 확인. 콘솔 오류 0.
