import { headers } from "next/headers";
import { getDeviceType } from "@/lib/device";
import { searchPosts } from "@/server/services/search";
import DesktopNav from "@/app/_components/DesktopNav";
import SearchDesktop from "./_components/desktop/SearchDesktop";
import SearchMobile from "./_components/mobile/SearchMobile";

/** 통합 검색 — 공개 글 전체를 title/excerpt/body로 검색, 최신순 상위 50건. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
  const results = query.trim() ? await searchPosts(query) : [];

  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));

  if (device === "desktop") {
    return (
      <>
        <DesktopNav variant="solid" />
        <SearchDesktop query={query} results={results} />
      </>
    );
  }
  return <SearchMobile query={query} results={results} />;
}
