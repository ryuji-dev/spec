"use client";
import { useActionState } from "react";
import type { HeroFormState } from "@/server/actions/hero";

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

export default function NewForm({
  action,
}: {
  action: (prev: HeroFormState, formData: FormData) => Promise<HeroFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        이미지 (jpg·png·webp, 최대 8MB)
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required style={inputStyle} />
      </label>
      <input name="alt" placeholder="대체 텍스트(접근성, 선택)" style={inputStyle} />
      <label style={{ fontSize: 13, color: "#666", display: "grid", gap: 4 }}>
        정렬 순서
        <input type="number" name="sortOrder" defaultValue={0} min={0} style={inputStyle} />
      </label>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" name="isPublished" defaultChecked /> 공개
      </label>
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "업로드 중…" : "업로드"}
      </button>
    </form>
  );
}
