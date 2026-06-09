import type { Metadata } from "next";
import AuthLayout from "../_components/auth/AuthLayout";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
