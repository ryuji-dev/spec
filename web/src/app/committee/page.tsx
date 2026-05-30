import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import DesktopNav from "@/app/_components/DesktopNav";
import CommitteeDesktop from "./_components/desktop/CommitteeDesktop";
import CommitteeMobile from "./_components/mobile/CommitteeMobile";

/**
 * 서경노회 교육위원회 게시판 (mock 데이터, 인터랙션 포함)
 * 원본 디자인:
 *   _design/seogyeong-presbytery-education-committee/project/서경노회 교육위원회 게시판.html
 *   _design/.../board.jsx
 * 헌법 [7]: 마크업·디자인은 임의 변경 금지.
 * 글로벌 DesktopNav(solid)을 데스크톱에서 노출. 모바일은 자체 sticky 헤더 사용.
 */
export default async function CommitteePage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <CommitteeDesktop />
      </>
    );
  }
  return <CommitteeMobile />;
}
