import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getCommitteeListData } from "@/server/services/committee";
import DesktopNav from "@/app/_components/DesktopNav";
import CommitteeDesktop from "./_components/desktop/CommitteeDesktop";
import CommitteeMobile from "./_components/mobile/CommitteeMobile";

/**
 * 서경노회 교육위원회 게시판 — DB 연동(읽기). 디자인 마크업 보존.
 * 데이터는 server/services/committee.ts 에서 조회해 클라이언트 컴포넌트에 props로 주입.
 */
export default async function CommitteePage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const data = await getCommitteeListData();
  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <CommitteeDesktop
          pinned={data.pinned}
          posts={data.posts}
          categories={data.categories}
          popular={data.popular}
          authors={data.authors}
        />
      </>
    );
  }
  return (
    <CommitteeMobile
      pinned={data.pinned}
      posts={data.posts}
      categories={data.categories}
      popular={data.popular}
    />
  );
}
