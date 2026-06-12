"use client";
import { useActionState } from "react";
import {
  deleteInquiry,
  type DeleteInquiryState,
} from "@/server/actions/inquiry";

const initialState: DeleteInquiryState = {};

// 문의 삭제 — 보유 기간 경과·요청 시 파기. 실수 방지를 위해 confirm으로 한 번 확인.
export default function DeleteInquiryButton({ inquiryId }: { inquiryId: string }) {
  const [state, formAction, pending] = useActionState(deleteInquiry, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("이 문의를 삭제할까요? 되돌릴 수 없습니다.")) {
          e.preventDefault();
        }
      }}
      style={{ marginTop: 8 }}
    >
      <input type="hidden" name="id" value={inquiryId} />
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #c0392b",
          background: "#fff",
          color: "#c0392b",
          cursor: "pointer",
        }}
      >
        {pending ? "삭제 중…" : "삭제"}
      </button>
      {state.error && (
        <span role="alert" style={{ color: "#c00", marginLeft: 8, fontSize: 13 }}>
          {state.error}
        </span>
      )}
    </form>
  );
}
