import { requireAdmin } from "@/server/auth/current-user";
import { countUnansweredInquiries } from "@/server/services/inquiry";
import Sidebar from "./admin/_components/Sidebar";
import shell from "./admin/_components/admin-shell.module.css";

// (admin) 그룹 전체를 감싸는 셸. 로그인 페이지는 (public)이라 영향 없음.
// 레이아웃에서 권한을 1차 확인(각 페이지의 requireAdmin 재확인은 유지).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const unanswered = await countUnansweredInquiries();

  const userName = `${user.name}${user.title ? ` ${user.title}` : ""}`;
  const userMeta = `${user.email} · ${user.role}`;

  return (
    <div className={shell.shell}>
      <Sidebar userName={userName} userMeta={userMeta} unanswered={unanswered} />
      <div className={shell.content}>{children}</div>
    </div>
  );
}
