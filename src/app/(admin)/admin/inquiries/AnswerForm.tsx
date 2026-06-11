"use client";
import { useActionState } from "react";
import {
  answerInquiry,
  type AnswerInquiryState,
} from "@/server/actions/inquiry";

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
    <form action={formAction} style={{ display: "grid", gap: 8, marginTop: 10 }}>
      <input type="hidden" name="id" value={inquiryId} />
      <label htmlFor={`answer-${inquiryId}`} style={{ fontSize: 13, fontWeight: 600 }}>
        답변
      </label>
      <textarea
        id={`answer-${inquiryId}`}
        name="answer"
        required
        defaultValue={defaultAnswer}
        placeholder="답변 내용 (비밀번호 분실 건은 연락처로 전달 후 '처리 완료' 등으로 기록)"
        style={{
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 6,
          minHeight: 80,
        }}
      />
      {state.error && (
        <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>
      )}
      {state.success && (
        <p role="status" style={{ color: "#0a0", margin: 0 }}>{state.success}</p>
      )}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : defaultAnswer ? "답변 수정" : "답변 저장"}
      </button>
    </form>
  );
}
