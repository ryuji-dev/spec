"use client";
import { useActionState } from "react";
import type { TimetableFormState } from "@/server/actions/timetable";
import styles from "../_components/ui.module.css";

type Initial = {
  day?: string;
  time?: string;
  course?: string;
  prof?: string;
  room?: string;
  host?: boolean;
  sortOrder?: number;
};

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
    <form action={formAction} className={styles.formGrid} style={{ maxWidth: 560 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input name="day" defaultValue={initial?.day ?? ""} required placeholder="요일 (예: 월)" className={styles.input} />
        <input name="time" defaultValue={initial?.time ?? ""} required placeholder="시간 (예: 10:00)" className={styles.input} />
      </div>
      <input name="course" defaultValue={initial?.course ?? ""} required placeholder="강좌명" className={styles.input} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input name="prof" defaultValue={initial?.prof ?? ""} required placeholder="교수명" className={styles.input} />
        <input name="room" defaultValue={initial?.room ?? ""} required placeholder="강의실" className={styles.input} />
      </div>
      <label className={styles.field}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} min={0} className={styles.input} />
      </label>
      <label className={styles.checkLabel}>
        <input type="checkbox" name="host" defaultChecked={initial?.host ?? false} /> 학장 강의(강조)
      </label>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      <button type="submit" disabled={pending} className={styles.btnPrimary} style={{ justifySelf: "start" }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
