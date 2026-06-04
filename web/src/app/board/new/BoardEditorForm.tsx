"use client";
import { useActionState } from "react";
import type { BoardFormState } from "@/server/actions/board";
import { BOARD_CATEGORIES_KO } from "@/lib/board";

const inputStyle = { padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" } as const;

type BoardFormAction = (state: BoardFormState, formData: FormData) => Promise<BoardFormState>;

// 회원 글 작성/수정 공통 폼. 디자인 컴포저(Composer)는 진입 트리거라, 작성·수정은 이 최소 폼에서 처리.
export default function BoardEditorForm({
  action,
  defaultCategory,
  defaultTitle = "",
  defaultBody = "",
  submitLabel = "글 작성",
}: {
  action: BoardFormAction;
  defaultCategory?: string;
  defaultTitle?: string;
  defaultBody?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<BoardFormState, FormData>(action, {});
  const initialCat =
    defaultCategory && BOARD_CATEGORIES_KO.includes(defaultCategory as never)
      ? defaultCategory
      : BOARD_CATEGORIES_KO[0];
  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <input name="title" required defaultValue={defaultTitle} placeholder="제목" style={inputStyle} />
      <select name="category" defaultValue={initialCat} style={inputStyle}>
        {BOARD_CATEGORIES_KO.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <textarea name="body" defaultValue={defaultBody} placeholder="본문" rows={12} style={inputStyle} />
      {state.error && <p role="alert" style={{ color: "#c00", margin: 0 }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={{ padding: 10, borderRadius: 6 }}>
        {pending ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
