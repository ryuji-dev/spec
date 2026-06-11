import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import AuthLayout from "../_components/auth/AuthLayout";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "새 비밀번호 설정" };

// 로그인 사용자의 비밀번호 변경 페이지(임시 비밀번호 수령 후 본인 변경 경로). 미로그인은 로그인으로.
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
