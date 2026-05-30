import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { logout } from "@/server/actions/auth";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 24 }}>관리자</h1>
      <p>
        {user.name}
        {user.title ? ` ${user.title}` : ""} · {user.email} · {user.role}
      </p>
      <form action={logout}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6 }}>
          로그아웃
        </button>
      </form>
    </main>
  );
}
