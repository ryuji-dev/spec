"use client";
import { useActionState } from "react";
import type { HeroFormState } from "@/server/actions/hero";
import styles from "../_components/ui.module.css";

type Initial = { alt: string; isPublished: boolean; sortOrder: number };

export default function EditForm({
  action,
  initial,
}: {
  action: (prev: HeroFormState, formData: FormData) => Promise<HeroFormState>;
  initial: Initial;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={styles.formGrid} style={{ maxWidth: 480 }}>
      <input name="alt" defaultValue={initial.alt} placeholder="대체 텍스트(접근성, 선택)" className={styles.input} />
      <label className={styles.field}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial.sortOrder} min={0} className={styles.input} />
      </label>
      <label className={styles.checkLabel}>
        <input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} /> 공개
      </label>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      <button type="submit" disabled={pending} className={styles.btnPrimary} style={{ justifySelf: "start" }}>
        {pending ? "저장 중…" : "수정 저장"}
      </button>
    </form>
  );
}
