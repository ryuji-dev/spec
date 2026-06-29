import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getResourceListData } from "@/server/services/resource";
import SiteDesktopNav from "@/app/_components/SiteDesktopNav";
import ResourcesDesktop from "./_components/desktop/ResourcesDesktop";
import ResourcesMobile from "./_components/mobile/ResourcesMobile";

/**
 * 자료공유 (mock 데이터, 인터랙션 포함).
 * 원본 디자인:
 *   _design/seogyeong-presbytery-education-committee/project/서경노회 자료공유.html
 *   _design/.../library.jsx
 * 헌법 [7]: 마크업·디자인은 임의 변경 금지.
 * 글로벌 DesktopNav(solid)을 데스크톱에서 노출. 모바일은 자체 sticky 헤더 사용.
 */
export default async function ResourcesPage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const data = await getResourceListData();
  if (device === "desktop") {
    return (
      <>
        <SiteDesktopNav variant="solid" />
        <ResourcesDesktop files={data.files} categories={data.categories} top={data.top} collections={data.collections} />
      </>
    );
  }
  return (
    <ResourcesMobile
      deviceType={device}
      files={data.files}
      categories={data.categories}
      top={data.top}
      collections={data.collections}
    />
  );
}
