import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import AuthLayout from "../_components/auth/AuthLayout";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "새 비밀번호 설정" };

// 복구 링크(verifyOtp)로 세션이 만들어진 상태에서만 진입. 직접 접근은 요청 페이지로 보낸다.
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/forgot-password");
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
