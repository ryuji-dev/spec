import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getBoardListData } from "@/server/services/board";
import DesktopNav from "@/app/_components/DesktopNav";
import BoardDesktop from "./_components/desktop/BoardDesktop";
import BoardMobile from "./_components/mobile/BoardMobile";

/**
 * 자유게시판 — DB 연동(읽기). 디자인 마크업 보존.
 * 데이터는 server/services/board.ts 에서 조회해 클라이언트 컴포넌트에 props로 주입.
 * proxy가 이미 /board 회원 가드. 글로벌 DesktopNav(solid)을 데스크톱에서 노출.
 */
export default async function BoardPage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const data = await getBoardListData();
  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <BoardDesktop posts={data.posts} categories={data.categories} />
      </>
    );
  }
  return (
    <BoardMobile
      deviceType={device}
      posts={data.posts}
      categories={data.categories}
    />
  );
}
