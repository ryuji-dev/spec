"use client";
import { useActionState } from "react";
import {
  adminResetPassword,
  type AdminResetPasswordState,
} from "@/server/actions/admin";

const initialState: AdminResetPasswordState = {};

const inputStyle = {
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 6,
} as const;

export default function AdminResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    adminResetPassword,
    initialState,
  );

  return (
    <form action={formAction} style={{ display: "grid", gap: 12 }}>
      <input
        name="email"
        type="email"
        required
        autoComplete="off"
        placeholder="회원 이메일"
        style={inputStyle}
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="임시 비밀번호 (8자 이상)"
        style={inputStyle}
      />
      <input
        name="passwordConfirm"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="임시 비밀번호 확인"
        style={inputStyle}
      />

      {state.error && (
        <p role="alert" style={{ color: "#c00", margin: 0 }}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" style={{ color: "#0a0", margin: 0 }}>
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{ padding: 10, borderRadius: 6 }}
      >
        {pending ? "재설정 중…" : "비밀번호 재설정"}
      </button>
    </form>
  );
}
