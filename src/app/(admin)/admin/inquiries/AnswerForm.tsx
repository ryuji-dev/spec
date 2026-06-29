"use client";
import { useActionState } from "react";
import {
  answerInquiry,
  type AnswerInquiryState,
} from "@/server/actions/inquiry";
import styles from "../_components/ui.module.css";

const initialState: AnswerInquiryState = {};

export default function AnswerForm({
  inquiryId,
  defaultAnswer,
}: {
  inquiryId: string;
  defaultAnswer?: string;
}) {
  const [state, formAction, pending] = useActionState(answerInquiry, initialState);

  return (
    <form action={formAction} className={styles.formGrid} style={{ marginTop: 12 }}>
      <input type="hidden" name="id" value={inquiryId} />
      <label htmlFor={`answer-${inquiryId}`} className={styles.fieldLabel}>
        답변
      </label>
      <textarea
        id={`answer-${inquiryId}`}
        name="answer"
        required
        defaultValue={defaultAnswer}
        placeholder="답변 내용 (비밀번호 분실 건은 연락처로 전달 후 '처리 완료' 등으로 기록)"
        className={styles.textarea}
      />
      {state.error && (
        <p role="alert" className={styles.error}>{state.error}</p>
      )}
      {state.success && (
        <p role="status" className={styles.success}>{state.success}</p>
      )}
      <button type="submit" disabled={pending} className={styles.btnPrimary} style={{ justifySelf: "start" }}>
        {pending ? "저장 중…" : defaultAnswer ? "답변 수정" : "답변 저장"}
      </button>
    </form>
  );
}
