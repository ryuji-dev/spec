import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { WEBZINE_PALETTE } from "@/lib/webzine-data";
import DesktopNav from "@/app/_components/DesktopNav";
import MobileStickyHeader from "@/app/_components/MobileStickyHeader";
import WebzineDesktop from "./_components/desktop/WebzineDesktop";
import WebzineMobile from "./_components/mobile/WebzineMobile";

/**
 * 서경노회 신학원웹진 (mock 데이터, 정적 화면)
 * 원본 디자인:
 *   _design/seogyeong-presbytery-education-committee/project/서경노회 신학원웹진.html
 *   _design/.../webzine.jsx
 * 헌법 [7]: 마크업·디자인은 임의 변경 금지.
 * 글로벌 DesktopNav(solid)·MobileStickyHeader 노출. 매거진 마스트헤드는 보존.
 */
export default async function WebzinePage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <WebzineDesktop palette={WEBZINE_PALETTE} />
      </>
    );
  }
  return (
    <>
      <MobileStickyHeader />
      <WebzineMobile palette={WEBZINE_PALETTE} deviceType={device} />
    </>
  );
}
