import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { WEBZINE_PALETTE } from "@/lib/webzine-data";
import { getWebzineListData } from "@/server/services/webzine";
import SiteDesktopNav from "@/app/_components/SiteDesktopNav";
import SiteMobileHeader from "@/app/_components/SiteMobileHeader";
import WebzineDesktop from "./_components/desktop/WebzineDesktop";
import WebzineMobile from "./_components/mobile/WebzineMobile";

/**
 * 서경노회 신학원웹진 — 기사 목록은 DB 연동, 현재호 라벨·지난호 아카이브는 정적.
 * 데이터는 server/services/webzine.ts 에서 조회해 클라이언트 컴포넌트에 props로 주입.
 * 헌법 [7]: 기사 영역만 mock→props, 일러스트·아카이브·마스트헤드 마크업은 불변.
 * 글로벌 DesktopNav(solid)·MobileStickyHeader 노출.
 */
export default async function WebzinePage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const data = await getWebzineListData();
  if (device === "desktop") {
    return (
      <>
        <SiteDesktopNav variant="solid" />
        <WebzineDesktop
          palette={WEBZINE_PALETTE}
          featured={data.featured}
          articles={data.articles}
          categories={data.categories}
          backIssues={data.backIssues}
        />
      </>
    );
  }
  return (
    <>
      <SiteMobileHeader />
      <WebzineMobile
        palette={WEBZINE_PALETTE}
        deviceType={device}
        featured={data.featured}
        articles={data.articles}
        categories={data.categories}
        backIssues={data.backIssues}
      />
    </>
  );
}
