import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getTrainingListData, getTrainingEventsData } from "@/server/services/training";
import SiteDesktopNav from "@/app/_components/SiteDesktopNav";
import TrainingDesktop from "./_components/desktop/TrainingDesktop";
import TrainingMobile from "./_components/mobile/TrainingMobile";

/**
 * 서경노회 교역자수련회 게시판 — 게시물 목록은 DB 연동, 이벤트 콘텐츠는 정적.
 * 데이터는 server/services/training.ts 에서 조회해 클라이언트 컴포넌트에 props로 주입.
 * 헌법 [7]: 게시물 영역만 mock→props, Hero·일정·강사 등 이벤트 마크업은 불변.
 * 글로벌 DesktopNav(solid)을 데스크톱에서 노출. 모바일은 자체 sticky 헤더 사용.
 */
export default async function TrainingPage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const data = await getTrainingListData();
  const events = await getTrainingEventsData();
  // training 디자인엔 고정(pinned) 슬롯이 없어, pinned 글을 목록 맨 앞에 합친다.
  const posts = data.pinned ? [data.pinned, ...data.posts] : data.posts;
  if (device === "desktop") {
    return (
      <>
        <SiteDesktopNav variant="solid" />
        <TrainingDesktop posts={posts} categories={data.categories} events={events} />
      </>
    );
  }
  return <TrainingMobile posts={posts} categories={data.categories} events={events} />;
}
