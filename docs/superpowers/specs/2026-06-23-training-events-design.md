# training 이벤트 실데이터화 설계 (1단계: 공개 읽기 + 시드)

## 배경
교역자수련회(`/training`)의 **게시판 목록·카테고리·상세·댓글·첨부는 이미 실데이터**(`getTrainingListData`)다. 그러나 페이지 상단의 **"수련회 이벤트" 도메인**은 전부 mock이다: `TR_UPCOMING`(예정 수련회 히어로), `TR_NEXT`(후속 예정), `TR_SPEAKERS`(강사진), `TR_SCHEDULE`(일자별 일정표), `TR_PAST`(지난 수련회 벤토), `TR_ARCHIVE`(연도별 아카이브). 이벤트는 게시판 글과 성격이 다른 **구조화된 데이터**라 전용 모델이 필요하다.

이 문서는 전체 기능의 **1단계**다: `events` 스키마·RLS·서비스·공개 페이지 실데이터화 + SQL 시드. **admin 입력 UI는 다음 PR**로 분리한다.

## 데이터 모델 — `events` 테이블 (신규)
표시용 파생값은 저장하지 않고 서비스에서 계산한다(기존 `toTrainingPostView` 등과 동일 패턴).

```sql
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  theme text,
  category text,
  badge text,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  place text,
  note text,                        -- NextSection 안내 문구("주제·강사 추후 공지" 등)
  cover text not null default 'mountain-dawn',
  capacity int,
  registered int,
  fee text,
  deadline date,
  speakers jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  participants int,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
```

- `speakers` 항목: `{ name, role, affiliation, talks }` (강사 `init`은 `name[0]`로 파생).
- `schedule` 항목: `{ day, date, items: [{ time, what, place, tag, highlight? }] }`.
- `capacity`·`registered`·`fee`·`deadline`은 모두 **admin이 적는 정적 표시값**(실시간 집계 아님). `registered`는 "신청 현황 N%" 진행바(UpcomingHero·SideRegister·TrainingMobile 3곳)를 디자인 그대로 보존하기 위해 유지한다.

### 파생값 (저장하지 않음)
- `dates`: `starts_at`·`ends_at` → "2026.05.18 — 05.20" 포맷.
- `daysLeft`: `starts_at` − now(일 단위, 음수면 0).
- `season`: `starts_at` 연도 + 계절(월 < 7 → "봄", 그 외 "가을") → "2025 가을".
- 강사 `init`: `name`의 첫 글자.
- past 벤토 `kind`: past 목록 인덱스로 `["big","tall","wide","small"]` 순환 배정(디자인 4분할 보존).

## 인덱스
```sql
create index events_starts_at_idx on public.events (starts_at);
```

## RLS (기존 `faculty` 정책 패턴 준용)
admin 판별은 기존 헬퍼 `public.auth_is_admin()`를 사용한다(posts·faculty 정책과 동일).
```sql
alter table public.events enable row level security;

-- 공개: 게시된 이벤트 읽기
create policy events_select on public.events
  for select using (is_published);

-- admin: 전체 쓰기 (쓰기는 admin PR에서 실사용)
create policy events_write on public.events
  for all using (public.auth_is_admin()) with check (public.auth_is_admin());
```

## 서비스 — `getTrainingEventsData()`
`src/server/services/training.ts`에 추가. 단일 쿼리(`events`, `is_published=true`)로 가져와 JS에서 버킷 분류.

반환 타입:
```ts
export type TrainingEventsData = {
  featured: UpcomingTraining | null;   // ends_at >= now 중 가장 임박한 1건 (speakers·schedule 포함)
  next: NextTraining[];                // 나머지 예정 (starts_at 오름차순)
  past: PastTraining[];                // ends_at < now (starts_at 내림차순, 상위 4)
  archive: ArchiveYear[];              // 지난 이벤트 전체를 연도별 그룹핑(내림차순)
  speakers: TrainingSpeaker[];         // featured.speakers (없으면 [])
  schedule: ScheduleDay[];             // featured.schedule (없으면 [])
};
```
- 버킷 분류 기준은 `now`(서버 시각). featured는 예정 중 `starts_at` 최소.
- `archive`는 past 전체(상위 4 제한과 무관) 기준으로 연도별 `"계절 · 제목"` 문자열 배열 구성.
- 뷰 변환 순수 함수(`toUpcomingView`·`toNextView`·`toPastView`)는 클라이언트 안전 `src/lib/training.ts`에 두고 `speakers`/`schedule`은 zod로 파싱.

## 뷰 타입·zod
- 기존 `src/lib/training-data.ts`의 뷰 타입(`UpcomingTraining`·`NextTraining`·`PastTraining`·`TrainingSpeaker`·`ScheduleDay`·`ScheduleItem`·`ArchiveYear`·`CoverKind`)은 **유지**.
- `TR_UPCOMING`·`TR_NEXT`·`TR_PAST`·`TR_SPEAKERS`·`TR_SCHEDULE`·`TR_ARCHIVE` const는 **제거**.
- `speakers`·`schedule` jsonb 검증용 zod 스키마를 `src/lib/training.ts`에 추가(서비스 파싱 + admin PR 재사용).

## 공개 페이지 연결
`src/app/training/page.tsx`가 `getTrainingEventsData()`를 호출해 결과를 데스크톱·모바일 컴포넌트에 props로 주입.
- 데스크톱: `UpcomingHero`(featured+speakers)·`NextSection`(next)·`SpeakersSection`(speakers)·`ScheduleSection`(schedule)·`PastBento`(past)·`Sidebar`(featured upcoming + archive).
- 모바일: `TrainingMobile`(featured·next·past·speakers·schedule·archive).
- 각 컴포넌트의 `TR_*` mock import 제거, props로 교체. **마크업·디자인 보존**(헌법 [7]).
- `featured`가 null인 경우(예정 이벤트 없음) 각 섹션은 빈/대체 렌더가 필요 — 컴포넌트별 가드는 plan에서 구체화.

## 시드 (SQL, 로컬 전용)
로컬 Supabase(127.0.0.1 확인)에 이벤트 투입:
- featured 1건: 2026 봄(미래, speakers 3·schedule 3일).
- next 2건: 2026 가을, 청년부 1박(미래).
- past 6건: 2025 가을/봄, 2024 가을/봄, 2023 가을/봄(과거) — past 벤토(상위 4)·아카이브(3개 연도) 모두 채움.

## 범위 제외
- **admin 이벤트 CRUD UI**(생성/수정, jsonb 강사·일정 편집기) → 다음 PR. 이번엔 SQL 시드로만 데이터 투입(쓰기 RLS 정책은 미리 생성).
- 신청(등록) 시스템·신청자수 집계.
- 게시판 목록/상세(이미 실데이터)는 변경 없음.

## 검증
- `pnpm lint && pnpm build`.
- 로컬 Supabase 시드 후 `/training` 데스크톱에서 히어로(주제·일정·장소·D-day)·강사 3인·일정표 3일·지난 수련회 4건(벤토)·아카이브 3개 연도가 실데이터로 렌더되는지 e2e DOM 확인.
- 모바일에서도 동일 데이터가 렌더되는지 확인.
