"use client";
import { useActionState } from "react";
import type { TimetableFormState } from "@/server/actions/timetable";

type Initial = {
  day?: string;
  time?: string;
  course?: string;
  prof?: string;
  room?: string;
  host?: boolean;
  sortOrder?: number;
};

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function EditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: TimetableFormState, formData: FormData) => Promise<TimetableFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input name="day" defaultValue={initial?.day ?? ""} required placeholder="요일 (예: 월)" style={inputStyle} />
        <input name="time" defaultValue={initial?.time ?? ""} required placeholder="시간 (예: 10:00)" style={inputStyle} />
      </div>
      <input name="course" defaultValue={initial?.course ?? ""} required placeholder="강좌명" style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input name="prof" defaultValue={initial?.prof ?? ""} required placeholder="교수명" style={inputStyle} />
        <input name="room" defaultValue={initial?.room ?? ""} required placeholder="강의실" style={inputStyle} />
      </div>
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} min={0} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="host" defaultChecked={initial?.host ?? false} /> 학장 강의(강조)
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
