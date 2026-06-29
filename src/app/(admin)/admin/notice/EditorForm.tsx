"use client";
import { useActionState } from "react";
import type { PostFormState } from "@/server/actions/notice";
import styles from "../_components/ui.module.css";

type Initial = {
  title?: string;
  excerpt?: string;
  body?: string;
  isPinned?: boolean;
  isPublished?: boolean;
};

export default function EditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: PostFormState, formData: FormData) => Promise<PostFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={styles.formGrid} style={{ maxWidth: 640 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="제목" className={styles.input} />
      <input name="excerpt" defaultValue={initial?.excerpt ?? ""} placeholder="요약 (선택)" className={styles.input} />
      <textarea name="body" defaultValue={initial?.body ?? ""} placeholder="본문" rows={12} className={styles.textarea} />
      <label className={styles.checkLabel}>
        <input type="checkbox" name="isPinned" defaultChecked={initial?.isPinned ?? false} /> 상단 고정
      </label>
      <label className={styles.checkLabel}>
        <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
      </label>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      <button type="submit" disabled={pending} className={styles.btnPrimary} style={{ justifySelf: "start" }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
