import type { Metadata } from "next";
import AuthLayout from "../_components/auth/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AuthLayout>
      <LoginForm next={sp.next} notice={sp.error} />
    </AuthLayout>
  );
}
