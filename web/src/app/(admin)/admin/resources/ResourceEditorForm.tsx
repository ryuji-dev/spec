"use client";
import { useActionState } from "react";
import { RESOURCE_CATEGORIES_KO } from "@/lib/resource";
import type { ResourceFormState } from "@/server/actions/resource";

type Initial = { title?: string; category?: string; sub?: string };
const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

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
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="자료 제목" style={inputStyle} />
      <select name="category" defaultValue={initial?.category ?? RESOURCE_CATEGORIES_KO[0]} style={inputStyle}>
        {RESOURCE_CATEGORIES_KO.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <textarea name="sub" defaultValue={initial?.sub ?? ""} placeholder="설명 (예: 40슬라이드 · 16:9 · 본문)" rows={4} style={inputStyle} />
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
