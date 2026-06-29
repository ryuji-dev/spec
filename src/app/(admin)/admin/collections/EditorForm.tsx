"use client";
import { useActionState } from "react";
import type { CollectionFormState } from "@/server/actions/collections";
import styles from "../_components/ui.module.css";

type Picker = { id: string; title: string; category: string | null };

type Initial = {
  title?: string;
  sub?: string;
  cover?: string;
  badge?: string | null;
  tag?: string;
  isPublished?: boolean;
  sortOrder?: number;
  postIds?: string[];
};

export default function EditorForm({
  action,
  picker,
  initial,
  submitLabel,
}: {
  action: (prev: CollectionFormState, formData: FormData) => Promise<CollectionFormState>;
  picker: Picker[];
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const selected = new Set(initial?.postIds ?? []);
  return (
    <form action={formAction} className={styles.formGrid} style={{ maxWidth: 560 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="컬렉션 제목" className={styles.input} />
      <input name="sub" defaultValue={initial?.sub ?? ""} required placeholder="설명" className={styles.input} />
      <input name="tag" defaultValue={initial?.tag ?? ""} required placeholder="표시 태그 (예: 교안·예배·교사)" className={styles.input} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label className={styles.field}>
          커버
          <select name="cover" defaultValue={initial?.cover ?? "spring"} className={styles.input}>
            <option value="spring">spring</option>
            <option value="easter">easter</option>
            <option value="teacher">teacher</option>
          </select>
        </label>
        <label className={styles.field}>
          배지
          <select name="badge" defaultValue={initial?.badge ?? ""} className={styles.input}>
            <option value="">없음</option>
            <option value="NEW">NEW</option>
            <option value="HOT">HOT</option>
          </select>
        </label>
      </div>
      <label className={styles.field}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} min={0} className={styles.input} />
      </label>
      <label className={styles.checkLabel}>
        <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
      </label>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>연결할 자료</legend>
        {picker.length === 0 && <p className={styles.hint}>등록된 자료가 없습니다.</p>}
        {picker.map((p) => (
          <label key={p.id} className={styles.checkItem}>
            <input type="checkbox" name="postIds" value={p.id} defaultChecked={selected.has(p.id)} />{" "}
            {p.title}
            {p.category ? <span className={styles.cellMuted}> · {p.category}</span> : null}
          </label>
        ))}
      </fieldset>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      <button type="submit" disabled={pending} className={styles.btnPrimary} style={{ justifySelf: "start" }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
