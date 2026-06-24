"use client";
import { useActionState } from "react";
import type { CollectionFormState } from "@/server/actions/collections";

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

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

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
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="컬렉션 제목" style={inputStyle} />
      <input name="sub" defaultValue={initial?.sub ?? ""} required placeholder="설명" style={inputStyle} />
      <input name="tag" defaultValue={initial?.tag ?? ""} required placeholder="표시 태그 (예: 교안·예배·교사)" style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          커버
          <select name="cover" defaultValue={initial?.cover ?? "spring"} style={inputStyle}>
            <option value="spring">spring</option>
            <option value="easter">easter</option>
            <option value="teacher">teacher</option>
          </select>
        </label>
        <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
          배지
          <select name="badge" defaultValue={initial?.badge ?? ""} style={inputStyle}>
            <option value="">없음</option>
            <option value="NEW">NEW</option>
            <option value="HOT">HOT</option>
          </select>
        </label>
      </div>
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} min={0} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked={initial?.isPublished ?? true} /> 공개
      </label>
      <fieldset style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
        <legend style={{ fontSize: 13, color: "#666" }}>연결할 자료</legend>
        {picker.length === 0 && <p style={{ color: "#888", margin: 0 }}>등록된 자료가 없습니다.</p>}
        {picker.map((p) => (
          <label key={p.id} style={{ display: "block", fontSize: 14, padding: "4px 0" }}>
            <input type="checkbox" name="postIds" value={p.id} defaultChecked={selected.has(p.id)} />{" "}
            {p.title}
            {p.category ? <span style={{ color: "#999" }}> · {p.category}</span> : null}
          </label>
        ))}
      </fieldset>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
