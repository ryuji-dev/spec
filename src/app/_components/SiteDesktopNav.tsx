// DesktopNav 서버 래퍼 — viewer가 admin이면 헤더에 관리자 링크를 노출한다.
import DesktopNav from "./DesktopNav";
import { getViewerIsAdmin } from "@/server/auth/viewer";

export default async function SiteDesktopNav({
  variant = "transparent",
}: {
  variant?: "transparent" | "solid";
}) {
  const isAdmin = await getViewerIsAdmin();
  return <DesktopNav variant={variant} isAdmin={isAdmin} />;
}
