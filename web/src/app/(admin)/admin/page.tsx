import { requireAdmin } from "@/server/auth/current-user";
import { logout } from "@/server/actions/auth";
import CreateUserForm from "./CreateUserForm";

// proxy가 1차 가드, 여기서 서버 권한을 재확인한다(헌법: 권한 체크는 서버에서).
export default async function AdminPage() {
  const user = await requireAdmin();

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

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>계정 생성</h2>
        <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
          일반 가입 경로는 없습니다. 노회 회원·관리자 계정은 여기서 발급합니다.
        </p>
        <CreateUserForm />
      </section>
    </main>
  );
}
