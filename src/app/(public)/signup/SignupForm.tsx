"use client";
import Link from "next/link";
import { useState } from "react";
import { signupSchema } from "@/lib/dto/auth";
import BrandLockup from "../_components/auth/BrandLockup";
import PasswordInput from "../_components/auth/PasswordInput";
import GoogleMark from "../_components/auth/GoogleMark";
import styles from "../_components/auth/auth.module.css";

type Errors = Partial<
  Record<"name" | "email" | "password" | "passwordConfirm" | "terms" | "form", string>
>;

export default function SignupForm() {
  const [f, setF] = useState({
    name: "",
    church: "",
    email: "",
    password: "",
    passwordConfirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const set =
    (k: keyof typeof f) =>
    (v: string | boolean) =>
      setF((p) => ({ ...p, [k]: v }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(f);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    // 디자인 단계: 실제 가입은 미연동(기능 단계에서 signupSchema 공유 Server Action 연결).
    setDone(true);
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

      <form onSubmit={onSubmit} className={styles.form} noValidate>
        <div className={styles.twoCol}>
          <label className={styles.field}>
            <span className={styles.label}>성함</span>
            <span className={styles.inputWrap}>
              <input
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
            checked={f.terms}
            onChange={(e) => set("terms")(e.target.checked)}
          />
          <span>
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>이용약관</a> 및{" "}
            <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>개인정보 처리방침</a>에 동의합니다.
          </span>
        </label>
        {errors.terms && <p className={styles.error}>{errors.terms}</p>}

        {done && (
          <p className={styles.error} style={{ color: "#9DB08F" }}>
            입력이 확인되었습니다. (가입 기능은 준비 중입니다)
          </p>
        )}

        <button type="submit" className={styles.submit}>가입하기</button>
      </form>

      <div className={styles.footer}>
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className={styles.footerLink}>로그인</Link>
      </div>
    </>
  );
}
