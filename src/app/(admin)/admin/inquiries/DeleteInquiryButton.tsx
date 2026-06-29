"use client";
import { useActionState } from "react";
import {
  deleteInquiry,
  type DeleteInquiryState,
} from "@/server/actions/inquiry";
import styles from "../_components/ui.module.css";

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
      <button type="submit" disabled={pending} className={styles.btnDanger}>
        {pending ? "삭제 중…" : "삭제"}
      </button>
      {state.error && (
        <span role="alert" className={styles.error} style={{ marginLeft: 8 }}>
          {state.error}
        </span>
      )}
    </form>
  );
}
