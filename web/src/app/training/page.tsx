import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import DesktopNav from "@/app/_components/DesktopNav";
import TrainingDesktop from "./_components/desktop/TrainingDesktop";
import TrainingMobile from "./_components/mobile/TrainingMobile";

/**
 * 서경노회 교역자수련회 게시판 (mock 데이터, 인터랙션 포함)
 * 원본 디자인:
 *   _design/seogyeong-presbytery-education-committee/project/서경노회 교역자수련회 게시판.html
 *   _design/.../training.jsx
 * 헌법 [7]: 마크업·디자인은 임의 변경 금지.
 * 글로벌 DesktopNav(solid)을 데스크톱에서 노출. 모바일은 자체 sticky 헤더 사용.
 */
export default async function TrainingPage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <TrainingDesktop />
      </>
    );
  }
  return <TrainingMobile />;
}
