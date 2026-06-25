import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { logout } from "@/server/actions/auth";
import CreateUserForm from "./CreateUserForm";
import AdminResetPasswordForm from "./AdminResetPasswordForm";

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
      <p style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/admin/inquiries">문의 접수함 →</Link>
        <Link href="/admin/notice">공지 관리 →</Link>
        <Link href="/admin/training">강습회 글 관리 →</Link>
        <Link href="/admin/committee">위원회 소식 관리 →</Link>
        <Link href="/admin/webzine">웹진 관리 →</Link>
        <Link href="/admin/resources">자료실 관리 →</Link>
        <Link href="/admin/events">수련회 이벤트 관리 →</Link>
        <Link href="/admin/timetable">강의 시간표 관리 →</Link>
        <Link href="/admin/collections">자료실 컬렉션 관리 →</Link>
        <Link href="/admin/hero">메인 히어로 관리 →</Link>
      </p>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>계정 생성</h2>
        <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
          일반 회원은 셀프 가입이 가능합니다. 여기서는 직함이 필요한 회원·관리자 계정을 발급합니다.
        </p>
        <CreateUserForm />
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>회원 비밀번호 재설정</h2>
        <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
          비밀번호를 잊은 회원에게 임시 비밀번호를 발급합니다. 전달 후 회원이
          로그인하여 /reset-password에서 직접 변경하도록 안내해주세요.
        </p>
        <AdminResetPasswordForm />
      </section>
    </main>
  );
}
