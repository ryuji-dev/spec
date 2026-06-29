"use client";
import { useActionState } from "react";
import { RESOURCE_CATEGORIES_KO } from "@/lib/resource";
import type { ResourceFormState } from "@/server/actions/resource";
import styles from "../_components/ui.module.css";

type Initial = { title?: string; category?: string; sub?: string; isPublished?: boolean };

export default function ResourceEditorForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ResourceFormState, formData: FormData) => Promise<ResourceFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={styles.formGrid} style={{ maxWidth: 640 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="자료 제목" className={styles.input} />
      <select name="category" defaultValue={initial?.category ?? RESOURCE_CATEGORIES_KO[0]} className={styles.input}>
        {RESOURCE_CATEGORIES_KO.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <textarea name="sub" defaultValue={initial?.sub ?? ""} placeholder="설명 (예: 40슬라이드 · 16:9 · 본문)" rows={4} className={styles.textarea} />
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
