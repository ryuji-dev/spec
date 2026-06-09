"use client";
import { useState } from "react";
import styles from "./auth.module.css";

type Props = {
  id: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
};

// 비밀번호 입력 + 눈 아이콘 토글. 원본 Field(withEye) 동작 그대로.
export default function PasswordInput({
  id,
  name,
  placeholder,
  autoComplete,
  value,
  onChange,
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <span className={styles.inputWrap}>
      <input
        id={id}
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.input} ${styles.inputEye}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "비밀번호 숨기기" : "비밀번호 표시"}
        className={styles.eyeBtn}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9s2.7-4.5 7-4.5S16 9 16 9s-2.7 4.5-7 4.5S2 9 2 9Z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9s2.7-4.5 7-4.5S16 9 16 9s-2.7 4.5-7 4.5S2 9 2 9Z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3 15 15 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </span>
  );
}
