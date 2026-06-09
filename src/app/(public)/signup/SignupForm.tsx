"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signup, type SignupState } from "@/server/actions/auth";
import { signupSchema } from "@/lib/dto/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import PasswordInput from "../_components/auth/PasswordInput";
import GoogleMark from "../_components/auth/GoogleMark";
import styles from "../_components/auth/auth.module.css";

type Errors = Partial<
  Record<"name" | "email" | "password" | "passwordConfirm" | "terms", string>
>;

const initialState: SignupState = {};

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [f, setF] = useState({
    name: "",
    church: "",
    email: "",
    password: "",
    passwordConfirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const set =
    (k: keyof typeof f) =>
    (v: string | boolean) =>
      setF((p) => ({ ...p, [k]: v }));

  // 클라이언트 즉시 검증 — 실패 시 제출 막고 필드 오류 표시, 통과 시 Server Action 진행.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = signupSchema.safeParse(f);
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

  if (state.sent) {
    return (
      <>
        <div className={styles.brandRow}>
          <BrandLockup />
        </div>
        <p className={styles.label} style={{ textAlign: "center", lineHeight: 1.6 }}>
          입력하신 이메일로 인증 메일을 보냈습니다.
          <br />
          메일의 링크를 눌러 회원가입을 완료해주세요.
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

      <button type="button" className={styles.oauth} disabled aria-disabled="true">
        <GoogleMark /> Google로 계속하기
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>또는</span>
        <span className={styles.dividerLine} />
      </div>

      <form action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
        <div className={styles.twoCol}>
          <label className={styles.field}>
            <span className={styles.label}>성함</span>
            <span className={styles.inputWrap}>
              <input
                name="name"
                className={styles.input}
                placeholder="홍길동"
                autoComplete="name"
                value={f.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </span>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>소속 교회</span>
            <span className={styles.inputWrap}>
              <input
                name="church"
                className={styles.input}
                placeholder="서경중앙교회"
                autoComplete="organization"
                value={f.church}
                onChange={(e) => set("church")(e.target.value)}
              />
            </span>
          </label>
        </div>
        {errors.name && <p className={styles.error}>{errors.name}</p>}

        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <span className={styles.inputWrap}>
            <input
              name="email"
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={f.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </span>
        </label>
        {errors.email && <p className={styles.error}>{errors.email}</p>}

        <div>
          <label htmlFor="signup-password" className={styles.label}>비밀번호</label>
          <PasswordInput
            id="signup-password"
            name="password"
            placeholder="8자 이상 입력하세요"
            autoComplete="new-password"
            value={f.password}
            onChange={set("password")}
          />
        </div>
        {errors.password && <p className={styles.error}>{errors.password}</p>}

        <div>
          <label htmlFor="signup-password-confirm" className={styles.label}>비밀번호 확인</label>
          <PasswordInput
            id="signup-password-confirm"
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

        <label className={styles.terms}>
          <input
            type="checkbox"
            name="terms"
            checked={f.terms}
            onChange={(e) => set("terms")(e.target.checked)}
          />
          <span>
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>이용약관</a> 및{" "}
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>개인정보 처리방침</a>에 동의합니다.
          </span>
        </label>
        {errors.terms && <p className={styles.error}>{errors.terms}</p>}

        {state.error && <p role="alert" className={styles.error}>{state.error}</p>}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "처리 중…" : "가입하기"}
        </button>
      </form>

      <div className={styles.footer}>
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className={styles.footerLink}>로그인</Link>
      </div>
    </>
  );
}
