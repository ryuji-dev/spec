"use client";
import { useActionState } from "react";
import type { HeroFormState } from "@/server/actions/hero";

type Initial = { alt: string; isPublished: boolean; sortOrder: number };
const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function EditForm({
  action,
  initial,
}: {
  action: (prev: HeroFormState, formData: FormData) => Promise<HeroFormState>;
  initial: Initial;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <input name="alt" defaultValue={initial.alt} placeholder="대체 텍스트(접근성, 선택)" style={inputStyle} />
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={initial.sortOrder} min={0} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} /> 공개
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : "수정 저장"}
      </button>
    </form>
  );
}
