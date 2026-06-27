"use client";
import { useActionState } from "react";
import {
  adminResetPassword,
  type AdminResetPasswordState,
} from "@/server/actions/admin";
import styles from "./_components/ui.module.css";

const initialState: AdminResetPasswordState = {};

export default function AdminResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    adminResetPassword,
    initialState,
  );

  return (
    <form action={formAction} className={styles.formGrid}>
      <input name="email" type="email" required autoComplete="off" placeholder="회원 이메일" className={styles.input} />
      <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="임시 비밀번호 (8자 이상)" className={styles.input} />
      <input name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" placeholder="임시 비밀번호 확인" className={styles.input} />

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
        {pending ? "재설정 중…" : "비밀번호 재설정"}
      </button>
    </form>
  );
}
