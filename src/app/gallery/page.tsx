import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { getGalleryData } from "@/server/services/gallery";
import DesktopNav from "@/app/_components/DesktopNav";
import GalleryDesktop from "./_components/desktop/GalleryDesktop";
import GalleryMobile from "./_components/mobile/GalleryMobile";

/** 공개 전체 사진첩 — 이미지 첨부가 있는 글의 대표 이미지를 최신순 그리드로. */
export default async function GalleryPage() {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  const tiles = await getGalleryData();

  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <GalleryDesktop tiles={tiles} />
      </>
    );
  }
  return <GalleryMobile tiles={tiles} />;
}
