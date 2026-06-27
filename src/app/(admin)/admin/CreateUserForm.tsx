"use client";
import { useActionState } from "react";
import { createUser, type CreateUserState } from "@/server/actions/admin";
import styles from "./_components/ui.module.css";

const initialState: CreateUserState = {};

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <form action={formAction} className={styles.formGrid}>
      <input name="name" type="text" required placeholder="이름" className={styles.input} />
      <input name="email" type="email" required autoComplete="off" placeholder="이메일" className={styles.input} />
      <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="비밀번호 (8자 이상)" className={styles.input} />
      <input name="title" type="text" placeholder="직함 (선택 — 예: 목사·전도사)" className={styles.input} />
      <input name="church" type="text" placeholder="소속 교회 (선택)" className={styles.input} />
      <select name="role" defaultValue="member" className={styles.input}>
        <option value="member">일반 회원</option>
        <option value="admin">관리자</option>
      </select>

      {state.error && (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className={styles.success}>
          {state.success}
        </p>
      )}

      <button type="submit" disabled={pending} className={styles.btnPrimary}>
        {pending ? "생성 중…" : "계정 생성"}
      </button>
    </form>
  );
}
