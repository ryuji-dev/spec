# 공개 `/notice` 공지 페이지 + 누적형 공지 관리 — 설계

- 작성일: 2026-06-16
- 대상: 공개 `/notice`(목록·상세), admin 공지 CRUD, `/main` 공지 배너 연결
- 선행: admin 메인 공지 한 줄(PR #35), 메인 실데이터·사진(PR #34·#36)

## 1. 목적 / 범위

현재 공지(notice)는 **싱글톤 배너**다. PR #35의 `메인 공지 한 줄`은 `setAnnouncement`가 기존 notice 1건을 덮어쓰고(없으면 생성), `clearAnnouncement`가 notice 전체를 삭제한다. 그래서 notice 행은 항상 ≤1건이라 **지난 공지가 쌓이지 않는다.**

이 작업은 notice를 **누적형 게시판**으로 바꿔, 일반 유저가 **지난 공지 목록·상세를 열람**할 수 있게 한다.

- notice = `posts` 테이블 `section='notice'`로 여러 건 누적(제목 + 본문 + 상단고정).
- 공개 읽기(게시됨), admin CRUD. **committee 패턴 재사용**, 카테고리·인기글·첨부는 **제외**.
- 기존 싱글톤(`setAnnouncement`/`clearAnnouncement`·`AnnouncementForm`·`getCurrentAnnouncement`)을 **공지 게시물 CRUD로 대체**.
- `/main` 한 줄 배너는 **최신 공지 제목으로 자동 도출**(getHomeData 기존 쿼리 그대로 유지) + 배너에 `/notice` 링크 부여.

### 결정 요약 (브레인스토밍)
- **Q1 데이터 모델**: 누적형 게시판(A). 싱글톤은 이력이 안 쌓여 목적 미달. getHomeData가 이미 "최신 공지 1건"을 읽으므로 `/main` 배너는 자동 동작.
- **Q2 디자인**: committee와 **같은 디자인 언어로 간결한 목록 신설**(A2). committee 목록은 board.jsx 기반 1,000+줄(카테고리 필터·뷰토글·검색·페이지네이션·인기 사이드바)이라 통째 복제 후 제거는 비효율·고위험. notice엔 그 기능들이 본래 불필요하므로, 공유 자산(`FOREST_PALETTE`·`PageHero`·카드 룩)을 재사용한 **간결한 목록**을 새로 만든다. 상세는 committee와 동일하게 "최소 기능 화면"으로 간결히.
- **Q3 첨부**: 없음(A). 공지는 본문으로 충분, 공문성 자료는 자료실(resource)이 담당. notice 업로드 정책·라우트 불필요.
- **Q4 진입 경로**: 디자인 보존(A). 상단 내비/메인 그리드 칸 수를 바꾸지 않고, 푸터 "공지사항" 텍스트와 `/main` 공지 배너에 링크만 부여.
- **접근 권한**: 공개(비로그인 열람). `src/proxy.ts` matcher는 `/admin/*`·`/board/*`만 가드하므로 committee·training과 동일하게 `/notice`는 공개.

## 2. 기존 인프라 (재사용)

- `posts` 테이블(section enum에 `notice` 포함), RLS: `auth_is_admin()` 쓰기 + 공개 글(is_published) 읽기 — **모든 섹션 공통이라 notice도 그대로 커버**(새 RLS 불필요).
- committee 서비스/액션/컴포넌트 패턴: `getCommitteeListData`/`getCommitteePost`/`incrementCommitteeView`, `createPost`/`updatePost`/`deletePost`, desktop/mobile 컴포넌트 + CSS Modules.
- `getHomeData().announcement`: 최신 notice 제목(`is_pinned desc, created_at desc, limit 1`) — `/main` 배너 소스. **변경 없음.**
- `incrementCommitteeView`가 쓰는 RPC `increment_post_view`(마이그레이션 존재) 재사용.

## 3. 데이터 흐름

```
[공개 목록]  notice/page.tsx → getNoticeListData() → NoticeDesktop/Mobile (props)
[공개 상세]  notice/[id]/page.tsx → getNoticePost(id) + incrementNoticeView(id)
[작성/수정]  admin EditorForm → createPost/updatePost (zod 검증) → revalidate /notice·/main
[삭제]       deletePost(id) → revalidate /notice·/main
[메인 배너]  getHomeData.announcement(최신 공지 제목) → 배너를 /notice 링크로 래핑
```

## 4. 컴포넌트 / 파일

### 공개 페이지 (A2 — 간결한 목록 신설 + 최소 상세)
- `src/app/notice/page.tsx` — 목록. device split: 데스크톱은 `DesktopNav` + `NoticeDesktop`, 모바일은 `NoticeMobile`.
- `src/app/notice/[id]/page.tsx` — 상세. `getNoticePost` + `incrementNoticeView`. 없으면 `notFound()`.
- `src/app/notice/_components/desktop/NoticeDesktop.tsx`
- `src/app/notice/_components/mobile/NoticeMobile.tsx`
- **목록 구성(간결)**: 상단고정 공지 강조 + 최신순 글 목록(제목·날짜·작성자·조회수, 상단고정 배지). admin이면 "글쓰기" 버튼(→ `/admin/notice/new`). 카테고리 필터·뷰토글·검색·인기 사이드바·페이지네이션 **없음**.
- **재사용 자산(디자인 언어 일관)**: `FOREST_PALETTE`(`@/app/_components/shared/palette`), `PageHero`(`@/app/_components/PageHero`)의 데스크톱/모바일 히어로, committee `PostCard`/`PinnedCard`의 카드 룩을 참고해 notice용 카드 스타일을 구성. committee 컴포넌트를 직접 import하지 않고 notice용으로 독립 구성(상호 결합 방지).
- **상세(최소 기능, committee 상세 미러 − category·댓글·첨부)**: 목록으로 가는 링크, 메타(작성자·날짜·조회수), 제목, admin이면 수정 링크(→ `/admin/notice/{id}/edit`), 본문(`white-space: pre-wrap`). 댓글·첨부·카테고리 표기는 두지 않는다.

### 서비스 `src/server/services/notice.ts` (재작성)
- 제거: `getCurrentAnnouncement`(admin 페이지에서만 쓰였고 이 작업에서 제거됨 → 미사용).
- 추가(committee.ts 미러, categories/popular 제외, 함수명 컨벤션 일치):
  - `getNoticeListData(): { pinned: NoticePost | null; posts: NoticePost[] }`
  - `getNoticePost(id): NoticeDetail | null`
  - `getNoticePostForEdit(id): NoticeEditData | null`
  - `incrementNoticeView(id): Promise<void>` (RPC `increment_post_view`)
- 타입은 committee의 것을 본떠 category·attachments·comments 필드를 뺀 형태(제목·excerpt·본문·작성자·날짜·조회수·상단고정).

### 액션 `src/server/actions/notice.ts` (재작성)
- 제거: `setAnnouncement`/`clearAnnouncement`.
- 추가(committee.ts 미러, category 제외): `createPost`/`updatePost`/`deletePost` (section='notice'). zod: `title`(필수, 트림·max), `excerpt`(선택), `body`(선택), `isPinned`(불리언). `requireAdmin` 진입 가드. 성공 시 `revalidatePath('/notice')`·`revalidatePath('/main')`.

### admin
- 신설(committee 미러, category·첨부 없음):
  - `src/app/(admin)/admin/notice/new/page.tsx`
  - `src/app/(admin)/admin/notice/[id]/edit/page.tsx`
  - `src/app/(admin)/admin/notice/EditorForm.tsx`
- 수정: `src/app/(admin)/admin/page.tsx` — "메인 공지" 섹션(AnnouncementForm)·관련 import 제거. (공지 관리는 `/notice`의 admin 글쓰기·수정·삭제 진입으로 일원화 — committee와 동일.)
- 삭제: `src/app/(admin)/admin/AnnouncementForm.tsx`.

### 진입 경로 (디자인 보존 — 링크만 부여, 마크업/레이아웃 불변)
- **푸터 "공지사항" 텍스트 → `/notice` 링크** (데스크톱·모바일 공통, 주 진입점). `FOOTER_COLUMNS`(`src/lib/main-page-data.ts`)의 "소통" 칼럼 항목과 푸터 렌더 컴포넌트(`DesktopFooter`·모바일 푸터)에서 해당 항목만 링크로. 현재 항목은 문자열 배열이라, "공지사항"만 href를 가질 수 있도록 항목 모델을 최소 확장(텍스트는 그대로, 시각 변화 없음).
- **모바일 공지 배너 → `/notice` 링크 래핑**: `AnnouncementStrip`(`src/app/main/_components/mobile/AnnouncementStrip.tsx`)을 Link로 감쌈(시각 변화 없음). **데스크톱 `/main`엔 공지 배너가 없으므로**(현 디자인) 데스크톱 배너 작업은 없음.
- `/notice` 목록/상세에 admin 전용 글쓰기·수정·삭제 진입(committee와 동일 패턴: 공개 페이지의 admin 버튼 + edit 페이지의 삭제 폼).

## 5. 에러 처리
- 없는/미게시 공지 상세 → `notFound()`(404).
- 빈 목록 → 빈 상태 안내(committee 빈 상태 패턴 재사용).
- 공지 0건 → `/main` 배너 미표시(기존 동작 유지).
- 액션: zod 실패 시 폼 에러 메시지, 권한 없으면 `requireAdmin`이 차단.

## 6. 검증
- `pnpm lint && pnpm build` 통과.
- 로컬 Supabase e2e(admin 로그인):
  1. 공지 2건 작성(1건 상단고정) → `/notice` 목록에 고정 우선 정렬·노출.
  2. 상세 진입 → 본문 표시·조회수 증가.
  3. `/main` 배너가 최신 공지 제목 표시 + 클릭 시 `/notice` 이동.
  4. 수정/삭제 동작 확인.
  5. 테스트 데이터 정리(원복).

## 7. 범위 밖 (후속 후보)
- 카테고리·검색·첨부, 인기 공지 사이드바.
- 푸시/알림, 공지 예약 발행.
- 상단 내비/메인 메뉴 그리드에 공지 정식 편입(디자인 재export 시).
