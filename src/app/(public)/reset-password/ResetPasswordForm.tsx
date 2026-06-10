"use client";
import { useActionState, useState } from "react";
import {
  updatePassword,
  type UpdatePasswordState,
} from "@/server/actions/auth";
import { newPasswordSchema } from "@/lib/dto/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import PasswordInput from "../_components/auth/PasswordInput";
import styles from "../_components/auth/auth.module.css";

type Errors = Partial<Record<"password" | "passwordConfirm", string>>;

const initialState: UpdatePasswordState = {};

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);
  const [f, setF] = useState({ password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const set =
    (k: keyof typeof f) =>
    (v: string) =>
      setF((p) => ({ ...p, [k]: v }));

  // 클라이언트 즉시 검증 — 실패 시 제출 막고 필드 오류 표시, 통과 시 Server Action 진행.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = newPasswordSchema.safeParse(f);
    if (!parsed.success) {
      e.preventDefault();
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
  }

  return (
    <>
      <div className={styles.brandRow}>
        <BrandLockup />
      </div>

      <p className={styles.label} style={{ textAlign: "center", lineHeight: 1.6, marginBottom: 22 }}>
        새로 사용할 비밀번호를 입력해주세요.
      </p>

      <form action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
        <div>
          <label htmlFor="reset-password" className={styles.label}>새 비밀번호</label>
          <PasswordInput
            id="reset-password"
            name="password"
            placeholder="8자 이상 입력하세요"
            autoComplete="new-password"
            value={f.password}
            onChange={set("password")}
          />
        </div>
        {errors.password && <p className={styles.error}>{errors.password}</p>}

        <div>
          <label htmlFor="reset-password-confirm" className={styles.label}>새 비밀번호 확인</label>
          <PasswordInput
            id="reset-password-confirm"
            name="passwordConfirm"
            placeholder="비밀번호를 다시 입력하세요"
            autoComplete="new-password"
            value={f.passwordConfirm}
            onChange={set("passwordConfirm")}
          />
        </div>
        {errors.passwordConfirm && (
          <p className={styles.error}>{errors.passwordConfirm}</p>
        )}

        {state.error && <p role="alert" className={styles.error}>{state.error}</p>}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>
    </>
  );
}
