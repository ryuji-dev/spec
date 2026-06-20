"use client";
import { useActionState, useState } from "react";
import {
  submitInquiry,
  type SubmitInquiryState,
} from "@/server/actions/inquiry";
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABEL,
  type InquiryCategory,
} from "@/lib/dto/inquiry";
import styles from "./support.module.css";

const initialState: SubmitInquiryState = {};

// 로그인 사용자는 이름·이메일이 미리 채워진다. 연락처는 인앱 답변을 못 받는
// 경우(비로그인 또는 비밀번호 분실)에만 노출·필수.
export default function InquiryForm({
  isLoggedIn,
  defaultName,
  defaultEmail,
  initialCategory,
}: {
  isLoggedIn: boolean;
  defaultName?: string;
  defaultEmail?: string;
  initialCategory?: InquiryCategory;
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);
  const [category, setCategory] = useState<InquiryCategory>(initialCategory ?? "general");
  const needsContact = !isLoggedIn || category === "password";

  if (state.done) {
    return (
      <div className={styles.done} role="status">
        문의가 접수되었습니다.
        {needsContact
          ? " 입력하신 연락처로 답변드리겠습니다."
          : " 답변이 등록되면 이 페이지의 내 문의 내역에서 확인하실 수 있습니다."}
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      <div>
        <label htmlFor="inq-category" className={styles.label}>문의 유형</label>
        <select
          id="inq-category"
          name="category"
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value as InquiryCategory)}
        >
          {INQUIRY_CATEGORIES.map((c) => (
            <option key={c} value={c}>{INQUIRY_CATEGORY_LABEL[c]}</option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="inq-name" className={styles.label}>이름</label>
          <input
            id="inq-name"
            name="name"
            className={styles.input}
            required
            defaultValue={defaultName}
            placeholder="홍길동"
          />
        </div>
        <div>
          <label htmlFor="inq-email" className={styles.label}>이메일</label>
          <input
            id="inq-email"
            name="email"
            type="email"
            className={styles.input}
            required
            defaultValue={defaultEmail}
            placeholder="you@example.com"
          />
        </div>
      </div>

      {needsContact && (
        <div>
          <label htmlFor="inq-contact" className={styles.label}>연락처</label>
          <input
            id="inq-contact"
            name="contact"
            className={styles.input}
            required
            placeholder="전화번호 또는 카카오톡 ID"
          />
          <p className={styles.notice}>
            {category === "password"
              ? "비밀번호 분실 시 로그인이 불가하므로, 답변은 입력하신 연락처로 드립니다."
              : "비로그인 문의는 입력하신 연락처로 답변드립니다."}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="inq-body" className={styles.label}>문의 내용</label>
        <textarea
          id="inq-body"
          name="body"
          className={styles.textarea}
          required
          minLength={5}
          maxLength={2000}
          placeholder="문의하실 내용을 적어주세요."
        />
      </div>

      {/* honeypot — 사람은 보지 못하는 필드. 봇 차단용 */}
      <div className={styles.hp} aria-hidden="true">
        <label>
          회사명
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "접수 중…" : "문의 접수"}
      </button>
    </form>
  );
}
