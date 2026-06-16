import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getNoticeListData } from "@/server/services/notice";
import { getCurrentUser } from "@/server/auth/current-user";
import DesktopNav from "@/app/_components/DesktopNav";
import NoticeDesktop from "./_components/desktop/NoticeDesktop";
import NoticeMobile from "./_components/mobile/NoticeMobile";

/** 공개 공지 목록 — DB 연동(읽기). committee와 같은 디자인 언어, 간결 구성. */
export default async function NoticePage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const { pinned, posts } = await getNoticeListData();
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <NoticeDesktop pinned={pinned} posts={posts} isAdmin={isAdmin} />
      </>
    );
  }
  return <NoticeMobile pinned={pinned} posts={posts} isAdmin={isAdmin} />;
}
