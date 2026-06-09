"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { login, type LoginState } from "@/server/actions/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import PasswordInput from "../_components/auth/PasswordInput";
import GoogleMark from "../_components/auth/GoogleMark";
import styles from "../_components/auth/auth.module.css";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [password, setPassword] = useState("");

  return (
    <>
      <div className={styles.brandRow}>
        <BrandLockup />
      </div>

      <button type="button" className={styles.oauth} disabled aria-disabled="true">
        <GoogleMark /> Google로 계속하기
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>또는</span>
        <span className={styles.dividerLine} />
      </div>

      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <span className={styles.inputWrap}>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={styles.input}
            />
          </span>
        </label>

        <div>
          <div className={styles.labelRow}>
            <label htmlFor="login-password" className={styles.label} style={{ marginBottom: 0 }}>비밀번호</label>
            <span className={styles.forgot} aria-disabled="true">비밀번호를 잊으셨나요?</span>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>

        {state.error && (
          <p role="alert" className={styles.error}>{state.error}</p>
        )}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <div className={styles.footer}>
        계정이 없으신가요?{" "}
        <Link href="/signup" className={styles.footerLink}>회원가입</Link>
      </div>
    </>
  );
}
