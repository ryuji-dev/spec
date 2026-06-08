"use client";
import { useActionState } from "react";
import { createUser, type CreateUserState } from "@/server/actions/admin";

const initialState: CreateUserState = {};

const inputStyle = {
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 6,
} as const;

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <form action={formAction} style={{ display: "grid", gap: 12 }}>
      <input
        name="name"
        type="text"
        required
        placeholder="이름"
        style={inputStyle}
      />
      <input
        name="email"
        type="email"
        required
        autoComplete="off"
        placeholder="이메일"
        style={inputStyle}
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="비밀번호 (8자 이상)"
        style={inputStyle}
      />
      <input
        name="title"
        type="text"
        placeholder="직함 (선택 — 예: 목사·전도사)"
        style={inputStyle}
      />
      <input
        name="church"
        type="text"
        placeholder="소속 교회 (선택)"
        style={inputStyle}
      />
      <select name="role" defaultValue="member" style={inputStyle}>
        <option value="member">일반 회원</option>
        <option value="admin">관리자</option>
      </select>

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
        {pending ? "생성 중…" : "계정 생성"}
      </button>
    </form>
  );
}
