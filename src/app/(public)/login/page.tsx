import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

// 임시 기능형 화면 — 디자인 핸드오프 확정 시 교체
export default function LoginPage() {
  return (
    <main style={{ maxWidth: 360, margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>로그인</h1>
      <LoginForm />
    </main>
  );
}
