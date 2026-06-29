// MobileStickyHeader 서버 래퍼 — viewer가 admin이면 헤더에 관리자 링크를 노출한다.
import MobileStickyHeader from "./MobileStickyHeader";
import { getViewerIsAdmin } from "@/server/auth/viewer";

export default async function SiteMobileHeader() {
  const isAdmin = await getViewerIsAdmin();
  return <MobileStickyHeader isAdmin={isAdmin} />;
}
