import type { Metadata } from "next";
import AuthLayout from "../_components/auth/AuthLayout";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "비밀번호 재설정" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
