# 자료공유(자료 라이브러리) — 설계 문서 (Phase 4 두 번째 섹션)

작성일: 2026-06-01
대상 브랜치: `feat/resource-library`

## 배경 / 목표

교육위원회 게시판 슬라이스(읽기·쓰기·업로드·댓글, PR #19~#21)가 완성됐다. 검증된 패턴(뷰모델 서비스 계층 + 최소 화면 + 업로드 인프라)을 **자료공유(resource)** 섹션으로 확장한다.

자료공유는 **파일 라이브러리**다: 설교PPT·악보·교안·문서·영상·디자인 자료를 admin이 등록하고 누구나 다운로드한다. 게시판(텍스트 글 + 선택적 첨부)과 달리 **파일이 1급 시민**이다.

### 확정된 결정 (사용자 승인)

| 항목 | 결정 |
|------|------|
| 읽기·다운로드 | **누구나 공개** |
| 업로드·수정·삭제 | **admin 전용** |
| 작성자(by) 표시 | **업로더 계정 기반**(이름+직함). mock의 "편집부/찬양팀" 팀명은 생략 |
| 큐레이션 컬렉션(LB_COLLECTIONS) | **1차 제외**(정적 유지). 인기 top만 실데이터 |
| 파일 type(ppt/pdf/score/doc/video/image) | **카테고리에서 파생**(카테고리 아이콘과 1:1) |
| 다운로드 수 | **`posts.viewCount`** 재사용, 파일 다운로드 시 증가 |
| 파일 정책 | 파일당 ≤ 300MB, 자료당 합계 ≤ 500MB·20개. 대용량 형식 포함 |
| 신규 화면 | 상세 페이지·에디터는 최소 기능 화면. 목록은 마크업 보존 |

## 아키텍처 — 접근법 A (뷰모델 서비스 계층, committee와 동일)

`posts`(section='resource') + `attachments`를 재사용한다. 순수 매퍼(`lib/resource.ts`, 클라이언트 안전)가 DB 평면 행 → 디자인 `ResourceFile` 뷰모델로 변환하고, `server/services/resource.ts`가 Drizzle 조회 후 매퍼를 호출한다. 목록 페이지(서버 컴포넌트)가 서비스를 호출해 클라이언트 컴포넌트에 props 주입 → 마크업·Tailwind 무변경.

**마이그레이션 불필요** — 기존 `posts`(isPinned 포함)·`attachments` 스키마로 충분.

## 데이터 모델 (기존 테이블 재사용)

### posts (section='resource')
- `category`: 설교PPT / 악보 / 교안 / 문서 / 영상 / 디자인 (6종)
- `title`: 자료 제목
- `excerpt`: 설명(디자인의 `sub` — "40슬라이드 · 16:9 · …")
- `authorId`: 업로더(admin)
- `viewCount`: **다운로드 수**
- `isPublished`: 공개 여부 (기본 true)
- `createdAt`: 등록일
- (isPinned·eventDate·meta 미사용)

### attachments
- 자료의 파일(들). `mime`·`sizeBytes`로 표시용 size 계산. 다중 파일 가능(예: "PDF + 음원").

## 읽기 경로 (공개)

`lib/resource.ts` (순수, 클라이언트 안전):
- `RESOURCE_CATEGORY_EN`: KO↔EN 맵 (설교PPT→SLIDES, 악보→SCORES, 교안→CURRICULUM, 문서→DOCS, 영상→VIDEO, 디자인→DESIGN)
- `RESOURCE_CATEGORIES_KO`: 6종 순서
- `categoryToType(cat)`: 카테고리 → `ResourceFileType` (설교PPT→ppt, 악보→score, 교안→pdf, 문서→doc, 영상→video, 디자인→image)
- `formatBytes(n)`: bytes → "12.4 MB" / "186 MB" 등
- `toResourceFileView(row, now)`: 평면 행(id, category, title, excerpt, viewCount, createdAt, authorName, authorTitle, totalBytes) → 디자인 `ResourceFile`({id, type, cat, title, sub, size, date, downloads, by, isNew})

`server/services/resource.ts` (server-only):
- `getResourceListData()` → `{ files: ResourceFile[], categories: ResourceCategory[], top: ResourceTopItem[] }`
  - files: section='resource' AND isPublished, 각 자료의 첨부 합계 bytes 집계 → 뷰모델. 정렬은 최신순 기본(클라이언트가 최신/다운로드/이름 토글)
  - categories: 카테고리별 카운트(전체 + 6종), icon은 카테고리 type
  - top: viewCount(다운로드) 상위 5 → `ResourceTopItem`
- 컬렉션(LB_COLLECTIONS)은 **정적 유지**(추후 엔티티화)

목록 페이지(`app/resources/page.tsx`): 서비스 호출 → props 주입. 컴포넌트(그리드/리스트/정렬/사이드바) 마크업 그대로. 카드 클릭 시 상세로 라우팅(추가).

상세 페이지(`app/resources/[id]/page.tsx`, 신규 최소 화면): 제목·설명·by·날짜·카테고리 + **파일 목록 다운로드 링크**. admin이면 수정 링크. 파일 다운로드 시 다운로드 수(viewCount) 증가.

## 쓰기 경로 (admin 전용)

`server/actions/resource.ts` (`'use server'`): `createResource`/`updateResource`/`deleteResource` — requireAdmin, zod(title·category·excerpt), 생성→편집 흐름. 삭제 시 첨부 디스크 정리(`deletePostFiles` 재사용 가능 — 동일 attachments 테이블).

에디터(`/admin/resources/new`, `/admin/resources/[id]/edit`): 제목·카테고리 select·설명 폼 + AttachmentManager(자료 업로드 엔드포인트). committee의 EditorForm/AttachmentManager 패턴 복제(자료용으로 카테고리·엔드포인트 교체).

## 파일 업로드 (대용량)

`lib/resource-upload.ts` (committee-upload의 자료 버전):
- 파일당 ≤ 300MB, 자료당 합계 ≤ 500MB, 개수 ≤ 20
- 허용 형식 + 매직바이트(file-type):
  - 문서: pdf·hwp·hwpx·docx·pptx·xlsx
  - 이미지: png·jpg·jpeg·gif·webp
  - 영상: mp4·mov·webm
  - 음원: mp3·wav
  - 디자인/압축: ai(pdf/postscript 컨테이너로 감지)·psd(8BPS)·zip
- `resolveResourceMime(ext, detected)`: committee의 resolveMime와 유사하되 위 형식 테이블로 확장. 확장자 화이트리스트 + 매직바이트 일치 검증, 파일명 서버 재생성 유지

Route Handler(committee 패턴 복제, resource 경로):
- `POST /api/resources/[postId]/uploads` (admin): resource 업로드. 대상 글 존재·`section='resource'` 검증
- `GET /api/resources/files/[id]` (공개): 다운로드. **다운로드 시 해당 post viewCount++**. 영상/대용량은 `attachment` disposition + nosniff
- `DELETE /api/resources/attachments/[id]` (admin)
- 저장: `web/uploads/resource/`(gitignore, 컨테이너 볼륨)

서버 저장 헬퍼 `server/uploads/resource.ts`: committee의 `storeAttachment` 유사하되 resource 정책·디렉터리 사용. (committee 코드와 중복되는 부분은 공통 추출 가능하나, 1차에서는 명확성을 위해 별도 파일로 두고 후속 DRY 검토.)

## 에러 처리 / 검증 규약

- Server Action: committee와 동일(zod safeParse, 친절한 한국어 메시지, redirect).
- Route Handler: `{ok,data}`/`{ok,error:{code,message}}` + `lib/api.ts` 재사용. UUID 가드.
- 권한: 쓰기/삭제 진입부 서버 재확인. `proxy`가 `/admin` 가드.

## 검증

- `pnpm lint`/`build`, `resource:verify`(순수 매퍼·카테고리→type·업로드 정책 결정), 기존 db:verify/committee:verify/uploads:verify 회귀.
- Preview e2e: admin 로그인 → 자료 등록(카테고리·설명) → 대용량 파일 업로드(영상 등) → 공개 목록에 표시(type 아이콘·size·by) → 다운로드(카운트 증가) → 허용 외 형식·용량 초과 거부 → 삭제(디스크 정리).

## Plan 분할 (승인됨)

- **Plan A — 읽기 경로**: `lib/resource.ts`(매퍼·맵·formatBytes), `server/services/resource.ts`(목록·카운트·top), 목록 페이지 props 배선(마크업 보존), 상세 페이지(읽기), dev-db resource seed, `resource:verify`. → 공개 목록·상세·다운로드(읽기) 동작.
- **Plan B — 쓰기 + 업로드**: `lib/resource-upload.ts`, `server/uploads/resource.ts`, Route Handler 3종(업로드·다운로드 카운트·삭제), `server/actions/resource.ts`, 에디터(new/edit) + AttachmentManager 배선, 목록 "자료 올리기" 라우팅. → admin 자료 등록·대용량 업로드.

각 Plan은 독립 PR. (committee 슬라이스와 동일한 리듬.)

## 범위 밖 (후속)

- 큐레이션 컬렉션 엔티티화(파일↔컬렉션 N:M).
- 회원 업로드·모더레이션.
- committee/resource 업로드·첨부 코드의 공통 추출(DRY) — 양쪽 안정화 후.
- 신규 화면(상세·에디터)의 Claude Design 폴리시 교체.
- 다른 섹션(자유게시판·교역자수련회·웹진·교수소개) 확장.
