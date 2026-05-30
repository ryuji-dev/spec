"use client";
import { useActionState } from "react";
import { login, type LoginState } from "@/server/actions/auth";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} style={{ display: "grid", gap: 12 }}>
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="이메일"
        style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="비밀번호"
        style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
      />
      {state.error && (
        <p role="alert" style={{ color: "#c00", margin: 0 }}>
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{ padding: 10, borderRadius: 6 }}
      >
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
