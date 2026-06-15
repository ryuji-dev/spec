"use client";
import { useActionState } from "react";
import {
  setAnnouncement,
  clearAnnouncement,
  type AnnouncementState,
} from "@/server/actions/notice";

const inputStyle = {
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 6,
  width: "100%",
} as const;

export default function AnnouncementForm({ current }: { current: string | null }) {
  const [setState, setAction, setPending] = useActionState<AnnouncementState, FormData>(
    setAnnouncement,
    {},
  );
  const [clearState, clearAction, clearPending] = useActionState<AnnouncementState, FormData>(
    clearAnnouncement,
    {},
  );
  const error = setState.error || clearState.error;
  const success = setState.success || clearState.success;

  return (
    <div style={{ display: "grid", gap: 10, maxWidth: 640 }}>
      <form action={setAction} style={{ display: "grid", gap: 8 }}>
        <input
          name="text"
          defaultValue={current ?? ""}
          placeholder="메인 상단에 노출할 공지 한 줄"
          maxLength={200}
          style={inputStyle}
        />
        <button type="submit" disabled={setPending} style={{ padding: 10, borderRadius: 6 }}>
          {setPending ? "저장 중…" : "공지 저장"}
        </button>
      </form>
      {current && (
        <form action={clearAction}>
          <button
            type="submit"
            disabled={clearPending}
            style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}
          >
            {clearPending ? "처리 중…" : "공지 내리기"}
          </button>
        </form>
      )}
      {error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{error}</p>}
      {success && <p style={{ color: "#0a0", margin: 0 }}>{success}</p>}
    </div>
  );
}
