"use client";
import { useActionState } from "react";
import { addComment, type CommentState } from "@/server/actions/comments";

const initial: CommentState = {};

export default function CommentForm({ postId }: { postId: string }) {
  const action = addComment.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} style={{ marginTop: 16, display: "grid", gap: 8 }}>
      <textarea
        name="body"
        required
        rows={3}
        placeholder="댓글을 입력하세요"
        style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6, width: "100%" }}
      />
      {state.error && (
        <p role="alert" style={{ color: "#c00", margin: 0 }}>
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{ padding: "8px 14px", borderRadius: 6, justifySelf: "start" }}
      >
        {pending ? "등록 중…" : "댓글 등록"}
      </button>
    </form>
  );
}
