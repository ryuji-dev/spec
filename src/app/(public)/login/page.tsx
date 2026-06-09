import type { Metadata } from "next";
import AuthLayout from "../_components/auth/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
