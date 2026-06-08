import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getFacultyDirectoryData } from "@/server/services/faculty";
import DesktopNav from "@/app/_components/DesktopNav";
import FacultyDesktop from "./_components/desktop/FacultyDesktop";
import FacultyMobile from "./_components/mobile/FacultyMobile";

/**
 * 신학원교수소개 — 교수 디렉터리는 DB 연동, 시간표·인용·CTA는 정적.
 * 데이터는 server/services/faculty.ts 에서 조회해 클라이언트 컴포넌트에 props로 주입.
 * 헌법 [7]: 교수 영역만 mock→props, 아바타·정적 섹션 마크업은 불변.
 * 글로벌 DesktopNav(solid)을 데스크톱에서 노출. 모바일은 자체 sticky 헤더 사용.
 */
export default async function FacultyPage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const data = await getFacultyDirectoryData();
  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <FacultyDesktop
          cover={data.cover}
          members={data.members}
          depts={data.depts}
        />
      </>
    );
  }
  return (
    <FacultyMobile
      deviceType={device}
      cover={data.cover}
      members={data.members}
      depts={data.depts}
    />
  );
}
