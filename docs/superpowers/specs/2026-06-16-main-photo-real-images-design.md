# 메인 사진타일 실이미지 연결 — 설계

- 작성일: 2026-06-16
- 대상: `/main` 사진 섹션("최근 활동 모음")
- 선행: 메인 실데이터 연동(PR #34), admin 작성 폼 보강(PR #35)

## 1. 목적 / 범위

`/main` 사진 섹션은 현재 최신 공개 글 7건을 가져와 각 타일에 **브랜드 그라데이션 아트**(`PhotoThumb`)를 깐다. 이것이 메인에 남은 마지막 mock 요소다. 이를 **실제 업로드 이미지**로 대체한다.

- **방식**: 이미지 첨부가 있는 최신 공개 글만 선별(글 단위, 첫 이미지). 이미지 로드 실패 시에만 기존 그라데이션으로 폴백.
- **신규 산출물**: 범용 다운로드 Route Handler 1개 + client 썸네일 래퍼 1개 + `home.ts` 사진 쿼리 교체 + 사진 섹션 컴포넌트의 썸네일 호출부 교체.
- **변경 없음**: DB 스키마, RLS, Storage 정책, admin 업로드 UI. (이미지 업로드 경로·인프라는 이미 존재)

### 결정 요약 (브레인스토밍)
- **Q1 타일 채우기**: 사진(이미지 첨부) 있는 글만 노출 — 그라데이션과 실이미지 혼재 방지.
- **Q2 타일 단위**: 글 단위(글 1건 = 타일 1개, 그 글의 첫 이미지 첨부). 캡션이 글 제목·날짜·태그 구조라 글 단위여야 의미를 가짐.
- **Q3 실패 처리**: 그라데이션을 폴백으로 유지(`onError` 시 `PhotoThumb`). graceful degradation 기조 유지.
- **서빙 라우트**: 범용 `/api/files/[id]` 신설. 홈 타일이 글의 섹션을 몰라도 첨부 id만으로 이미지를 받도록(올바른 추상화). `readAttachment`가 이미 섹션 무관.

## 2. 기존 인프라 (재사용)

- `attachments` 버킷(비공개) + `attachments` 테이블(post_id, original_name, stored_name, mime, size_bytes, created_at).
- `readAttachment(id)` — service-role로 Storage blob + 메타 조회, **미게시 글(is_published=false) 첨부는 null** 반환.
- 기존 다운로드 라우트 `/api/{committee,training,resource}/files/[id]` — 이미지는 inline, 그 외 attachment.
- RLS `attachments_select`: **공개 글(is_published)의 첨부 메타데이터는 anon에서 SELECT 가능** → `getHomeData`(anon)에서 첨부 조회 가능.
- 업로드 정책: committee·training·resource 세 섹션 모두 이미지(png/jpg/jpeg/gif/webp) 허용 → 실이미지 원천 존재.

## 3. 데이터 흐름

```
posts(공개) ⨝ attachments(image/*)
   → getHomeData()  (anon, src/server/services/home.ts)
   → main/page.tsx
   → Desktop/Mobile PhotoSection
   → PhotoTileThumb ('use client')
        ├─ <img src="/api/files/{imageId}">   (정상)
        └─ onError → PhotoThumb(그라데이션)   (실패)

GET /api/files/[id]
   → readAttachment(id)  (service-role, is_published 확인)
   → inline image  (Content-Type, nosniff, private max-age=3600)
```

## 4. 컴포넌트 / 변경 단위

### A. `src/server/services/home.ts` (수정)
사진 쿼리를 "최신 글 7건" → "이미지 첨부 있는 최신 공개 글 7건"으로 교체.

```ts
supabase
  .from("posts")
  .select("id, title, category, section, created_at, attachments!inner(id, mime, created_at)")
  .eq("is_published", true)
  .like("attachments.mime", "image/%")
  .order("created_at", { ascending: false })
  .limit(7)
```

- `!inner` + `.like("attachments.mime","image/%")`: 이미지 첨부가 있는 글만 남고, 임베드된 `attachments`는 이미지 첨부만 포함.
- 각 글의 임베드 첨부를 `created_at` 오름차순 정렬해 **첫 이미지 id** 선택.
- `HomePhotoItem`에 `imageId: string` 추가. `type`(`PhotoTileType`)은 폴백용으로 유지하고 기존 `SECTION_PHOTO_TYPE` 매핑으로 계속 산출.

### B. `src/app/api/files/[id]/route.ts` (신설)
기존 `training/files/[id]/route.ts`를 그대로 본뜸: `runtime="nodejs"`, `isUuid` 가드 → `readAttachment(id)` → 없으면 404, 있으면 mime별 inline/attachment + `X-Content-Type-Options: nosniff` + `Cache-Control: private, max-age=3600`. 기존 3개 섹션 라우트는 그대로 둔다.

### C. `src/app/main/_components/PhotoTileThumb.tsx` (신설, `'use client'`)
- props: `{ imageId: string; type: PhotoTileType; idPrefix: string }`
- `<img src={\`/api/files/${imageId}\`} loading="lazy" decoding="async" alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />`
- `useState`로 실패 토글: `onError` 시 `<PhotoThumb type={type} idPrefix={idPrefix} />` 렌더.
- 컨테이너 크기는 부모(타일)가 결정 — 기존 `PhotoThumb`과 동일하게 100% 채움(`object-fit: cover` ↔ 기존 `preserveAspectRatio slice` 동치).

### D. 사진 섹션 컴포넌트 (수정)
`PhotoThumb`을 직접 호출하는 곳을 `PhotoTileThumb`로 교체하고 `imageId`를 전달. **레이아웃·className·캡션 마크업은 일절 변경하지 않음**(헌법 [7] 디자인 보존) — 썸네일을 채우는 컴포넌트만 교체. 소비처는 다음 2개 파일이 전부다(확인 완료):
- `src/app/main/_components/desktop/DesktopPhotoSection.tsx` — `<PhotoThumb>` 3곳(대표·중·소).
- `src/app/main/_components/mobile/PhotoSectionMobile.tsx` — `<PhotoThumb>` 1곳.

## 5. 에러 처리

- 쿼리 실패/결과 없음 → 빈 배열 → 사진 섹션 숨김(기존 빈 상태 처리 그대로).
- 이미지 로드 실패 → `onError`로 그라데이션 폴백.
- 라우트: 비-UUID id, 미게시 글 첨부, 없는 첨부 → 404(`readAttachment` 로직).

## 6. 검증

- `pnpm lint && pnpm build` 통과.
- 로컬 Supabase e2e: admin 로그인 → committee/training 글에 이미지 업로드 → `/main` 사진 섹션에 실이미지 노출(Preview MCP DOM/스크린샷) → 잘못된/없는 imageId로 그라데이션 폴백 동작 확인 → 테스트 데이터 정리(원복).

## 7. 범위 밖 (후속 후보)

- "전체 사진첩 →" 버튼 → 갤러리 페이지.
- 이미지 리사이즈/최적화(next/image, 썸네일 변형), 사진 단위 갤러리, 사진별 캡션 편집.
- notice/board/webzine 섹션 이미지 업로드 경로(현재 미지원).
