"use client";
import { useActionState } from "react";
import { WEBZINE_CATEGORIES_KO } from "@/lib/webzine";
import type { PostFormState } from "@/server/actions/webzine";

type Initial = {
  title?: string;
  category?: string;
  excerpt?: string;
  body?: string;
  isPinned?: boolean;
};

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

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
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <input name="title" defaultValue={initial?.title ?? ""} required placeholder="제목" style={inputStyle} />
      <select name="category" defaultValue={initial?.category ?? WEBZINE_CATEGORIES_KO[0]} style={inputStyle}>
        {WEBZINE_CATEGORIES_KO.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input name="excerpt" defaultValue={initial?.excerpt ?? ""} placeholder="부제 (선택)" style={inputStyle} />
      <textarea name="body" defaultValue={initial?.body ?? ""} placeholder="본문" rows={16} style={inputStyle} />
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPinned" defaultChecked={initial?.isPinned ?? false} /> 커버 기사로 고정
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
