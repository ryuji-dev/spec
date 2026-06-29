"use client";
import { useActionState } from "react";
import type { HeroFormState } from "@/server/actions/hero";
import styles from "../_components/ui.module.css";

export default function NewForm({
  action,
}: {
  action: (prev: HeroFormState, formData: FormData) => Promise<HeroFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={styles.formGrid} style={{ maxWidth: 480 }}>
      <label className={styles.field}>
        이미지 (jpg·png·webp, 최대 8MB)
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required className={styles.input} />
      </label>
      <input name="alt" placeholder="대체 텍스트(접근성, 선택)" className={styles.input} />
      <label className={styles.field}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={0} min={0} className={styles.input} />
      </label>
      <label className={styles.checkLabel}>
        <input type="checkbox" name="isPublished" defaultChecked /> 공개
      </label>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      <button type="submit" disabled={pending} className={styles.btnPrimary} style={{ justifySelf: "start" }}>
        {pending ? "업로드 중…" : "업로드"}
      </button>
    </form>
  );
}
