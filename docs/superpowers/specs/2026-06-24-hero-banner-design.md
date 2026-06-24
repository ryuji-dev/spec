# 메인 히어로 사진 배너 시스템 — 설계

**작성일**: 2026-06-24
**대상**: 메인 페이지(`/` → `src/app/main`)의 히어로(첫 화면 대표 배너)
**목표**: 현재 코드로 그린 SVG 아트 슬라이드 배경을, 관리자가 업로드한 사진 슬라이드로 교체할 수 있는 시스템을 신설한다.

---

## 배경

현재 히어로는 **배경(SVG 아트 4장 자동 슬라이드)** 위에 **고정 텍스트 오버레이**(영문 kicker / "가르치는 자의 거룩한 부르심" 제목 / 설명 / 버튼 2개)가 얹힌 구조다(`DesktopHero.tsx`, `HeroMobile.tsx`). SVG 아트는 콘텐츠가 아니라 장식이라 그동안 "실데이터화" 대상에서 보류돼 있었다.

이번 작업으로 **배경만** 관리자 업로드 사진으로 교체할 수 있게 한다. 텍스트 오버레이·슬라이드 동작(자동 전환·점·카운터)·CSS는 그대로 유지한다.

### 결정 사항 (브레인스토밍)

- **편집 범위**: 배경 사진만. 텍스트 오버레이·버튼은 현 고정값 유지.
- **빈 상태(사진 0장)**: 기존 SVG 아트로 폴백.
- **스토리지**: 신규 **공개** 버킷 `hero`. 메인은 최다 트래픽 페이지이고 배너는 본래 공개용이라, 공개 URL 직접 노출(CDN 캐시)이 기존 비공개 첨부(`attachments` + 서버 스트리밍)보다 성능·운영에 유리.
- **슬라이드 수**: 가변(관리자가 추가/삭제). 표시 슬라이드 수에 맞춰 점·카운터 동작.
- **이미지**: 데스크톱·모바일 공용 1장(`object-fit: cover`)으로 단순화.

---

## 1. 데이터 모델

### 테이블 `hero_slides`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | uuid PK | `gen_random_uuid()` |
| `image_path` | text not null | `hero` 버킷 내 경로 (예: `<uuid>.jpg`) |
| `alt` | text not null default '' | 접근성용 대체 텍스트 |
| `is_published` | boolean not null default true | 공개 토글 |
| `sort_order` | int not null default 0 | 슬라이드 순서 |
| `created_at` | timestamptz not null default now() | |

인덱스: `hero_slides (sort_order)`.

### RLS

- `enable row level security`.
- select: `using (is_published or public.auth_is_admin())` — 비공개는 admin만.
- write: `for all using (public.auth_is_admin()) with check (public.auth_is_admin())`.

---

## 2. Storage 버킷 `hero` (공개)

- 마이그레이션으로 `storage.buckets`에 `('hero', 'hero', true)`(public=true) 추가.
- storage.objects 정책: 쓰기(insert/update/delete)는 `bucket_id='hero' and public.auth_is_admin()`. 읽기는 공개 버킷이라 익명 URL 접근 허용.
- 업로드 검증: 기존 `src/lib/upload-policy.ts`의 `image` 종류 재사용 — 확장자 화이트리스트(jpg/jpeg/png/webp), 실제 MIME 검사(`file-type`), 파일당 용량 제한.
- 저장 파일명은 서버에서 `<uuid>.<ext>`로 재생성(원본 파일명 저장 금지 — 보안 규칙).

> 로컬 `npx supabase db reset` 후 public 스키마 grant 복구가 필요한 것은 기존과 동일(로컬 한정, 커밋하지 않음).

---

## 3. 서버 계층

### 업로드 헬퍼 (`src/server/uploads/hero.ts`, 신규)

기존 `core.ts`는 `attachments`(비공개) + `posts` 전용이라 그대로 두고, 공개 `hero` 버킷용 작은 헬퍼를 추가한다.

- `storeHeroImage(file: File): Promise<{ imagePath: string }>` — `preCheck`(이미지 정책) → 버퍼 MIME 검사(`resolveMime`) → `<uuid>.<ext>`로 `hero` 버킷 업로드(service-role) → 경로 반환. 실패 시 `UploadError`.
- `deleteHeroImage(imagePath: string): Promise<void>` — 버킷 오브젝트 삭제.
- 공개 URL 생성: `supabase.storage.from('hero').getPublicUrl(path)` 또는 base URL 조합.

### 서비스 (`src/server/services/hero.ts`, 신규)

- `getHeroSlides(): Promise<{ url: string; alt: string }[]>` — 공개(`is_published`) 슬라이드를 `sort_order`로 정렬, 공개 URL로 변환해 반환. 없으면 빈 배열.
- `listHeroForAdmin(): Promise<HeroAdminRow[]>` — 비공개 포함 전체(`url`, `alt`, `isPublished`, `sortOrder`).
- `getHeroSlideForEdit(id): Promise<HeroEditData | null>` — alt·sort_order·is_published·url.

### 액션 (`src/server/actions/hero.ts`, 신규)

- `createHeroSlide(prev, formData)` — `requireAdmin()` → 파일 `storeHeroImage` → `hero_slides` 행 insert(alt·sort_order·is_published). zod 검증(alt 선택, sortOrder int min 0, isPublished boolean). 실패 시 업로드 롤백.
- `updateHeroSlide(id, prev, formData)` — alt·sort_order·is_published 수정(이미지 교체는 삭제 후 재등록으로 단순화 — 이번 범위에선 메타만 수정).
- `deleteHeroSlide(id)` — DB 행 + Storage 오브젝트 함께 삭제.
- 모든 액션 완료 후 `/admin/hero`로 redirect.

---

## 4. admin CRUD UI (`(admin)/admin/hero/`)

기존 admin 패턴(timetable·collections) 준용.

- `page.tsx` — 목록(썸네일 `<img>`·순서·공개여부·수정) + "새 슬라이드" 버튼.
- `new/page.tsx` + `EditorForm.tsx`(`'use client'`) — 파일 input(`accept="image/*"`) + alt + sortOrder(number) + isPublished(checkbox). 생성 폼만 파일 input 노출.
- `[id]/edit/page.tsx` — alt·sortOrder·isPublished 수정 + 삭제 폼(이미지 미리보기 표시).
- `(admin)/admin/page.tsx`에 `메인 히어로 관리 →` 링크 추가.

---

## 5. 공개 화면 배선 (디자인 보존)

- 메인 `page.tsx`(서버)가 `getHeroSlides()` 호출 → 결과를 `DesktopPage`·모바일 경로를 거쳐 `DesktopHero`·`HeroMobile`에 props 주입(기존 `home` 주입과 동일 패턴).
- `DesktopHero`·`HeroMobile`은 `slides: { url: string; alt: string }[]` prop을 받는다.
  - **slides.length > 0**: 슬라이드 루프 배경을 `<Component/>`(SVG) 대신 `<img src={url} alt={alt}>`로 렌더. `<img>`는 기존 `.slide` 컨테이너를 채우게 `object-fit: cover`. 오버레이·텍스트·점·카운터·자동전환 로직과 CSS 클래스는 그대로.
  - **slides.length === 0**: 기존 `HERO_SLIDE_COMPONENTS`(SVG)로 폴백 — 기존 코드 경로 유지.
  - 점/카운터 개수는 고정(`HERO_SLIDES.length`) 대신 현재 표시 슬라이드 수에 맞춘다.
- next/image 미사용(`<img>` 기본 태그) → `next.config.ts` 이미지 호스트 설정 불필요.

> 마크업·CSS·애니메이션 변경 없음. 슬라이드 배경 소스만 교체(헌법 [7]). 이미지 추가는 디자인 의도(배경 슬라이드) 그대로의 데이터 바인딩.

---

## 6. 데이터 정리 + 검증

- 로컬 e2e:
  1. admin에서 사진 2장 업로드 → 메인에서 사진 슬라이드 표시·자동전환·점·카운터 확인.
  2. 순서 변경 반영 확인.
  3. 비공개 토글 시 해당 슬라이드 제외 확인.
  4. 삭제(행 + Storage 오브젝트) 확인.
  5. **전부 삭제 시 SVG 아트로 폴백 복귀** 확인.
  6. 허용 외 형식/용량 초과 업로드 거부 확인.
  7. 검증 데이터 정리.
- `tsc`·`lint`·`build` 통과.

---

## 범위 밖 (YAGNI)

- 히어로 텍스트(제목·설명·버튼)·버튼 링크 편집 — 이번 범위 아님(배경 사진만).
- 데스크톱/모바일 별도 이미지 — 공용 1장으로 단순화.
- 이미지 교체(in-place) — 삭제 후 재등록으로 갈음(메타만 수정 지원).
- next/image 최적화 도입.
- 슬라이드별 캡션/날짜 노출(현재 디자인도 미노출).

---

## 머지 후 유의사항

- `hero_slides` 테이블 + `hero` Storage 버킷 마이그레이션 포함 → 운영 반영 시 `npx supabase db push` 필요.
