"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/server/actions/auth";
import { resetRequestSchema } from "@/lib/dto/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import styles from "../_components/auth/auth.module.css";

const initialState: ResetRequestState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const [email, setEmail] = useState("");
  const [clientError, setClientError] = useState<string | undefined>();

  // 클라이언트 즉시 검증 — 실패 시 제출 막고 오류 표시, 통과 시 Server Action 진행.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = resetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      e.preventDefault();
      setClientError(parsed.error.issues[0]?.message);
      return;
    }
    setClientError(undefined);
  }

  if (state.sent) {
    return (
      <>
        <div className={styles.brandRow}>
          <BrandLockup />
        </div>
        <p className={styles.label} style={{ textAlign: "center", lineHeight: 1.6 }}>
          재설정 메일을 보냈습니다.
          <br />
          메일의 링크를 눌러 새 비밀번호를 설정해주세요.
        </p>
        <div className={styles.footer}>
          <Link href="/login" className={styles.footerLink}>로그인으로 돌아가기</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.brandRow}>
        <BrandLockup />
      </div>

      <p className={styles.label} style={{ textAlign: "center", lineHeight: 1.6, marginBottom: 22 }}>
        가입하신 이메일을 입력하시면
        <br />
        비밀번호 재설정 링크를 보내드립니다.
      </p>

      <form action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <span className={styles.inputWrap}>
            <input
              name="email"
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </span>
        </label>
        {clientError && <p className={styles.error}>{clientError}</p>}
        {state.error && <p role="alert" className={styles.error}>{state.error}</p>}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "전송 중…" : "재설정 링크 보내기"}
        </button>
      </form>

      <div className={styles.footer}>
        비밀번호가 기억나셨나요?{" "}
        <Link href="/login" className={styles.footerLink}>로그인</Link>
      </div>
    </>
  );
}
