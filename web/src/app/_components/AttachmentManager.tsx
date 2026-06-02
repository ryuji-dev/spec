"use client";
import { useState } from "react";
import { apiPostForm, apiDelete, ApiError } from "@/lib/api";
import { preCheck, type UploadPolicy } from "@/lib/upload-policy";

type Att = { id: string; name: string; sizeBytes: number; mime: string };

type Props = {
  postId: string;
  initial: Att[];
  // 직렬화 가능한 prop만 (Server → Client). 함수 prop 금지.
  apiBase: string; // 예: "/api/committee" | "/api/resources"
  policy: UploadPolicy;
};

export default function AttachmentManager({ postId, initial, apiBase, policy }: Props) {
  const [items, setItems] = useState<Att[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    const failed: string[] = [];
    for (const f of files) {
      const pre = preCheck(policy, f.name, f.size);
      if (pre) { failed.push(`${f.name}: ${pre}`); continue; }
      try {
        const form = new FormData();
        form.append("files", f);
        const added = await apiPostForm<Att[]>(`${apiBase}/${postId}/uploads`, form);
        setItems((prev) => [...prev, ...added]);
      } catch (err) {
        failed.push(`${f.name}: ${err instanceof ApiError ? err.message : "업로드 실패"}`);
      }
    }
    setBusy(false);
    setError(failed.length > 0 ? failed.join("\n") : null);
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      await apiDelete(`${apiBase}/attachments/${id}`);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제 실패");
    }
  }

  return (
    <div style={{ marginTop: 24, maxWidth: 640 }}>
      <h2 style={{ fontSize: 16 }}>첨부 파일 ({items.length})</h2>
      <input type="file" multiple onChange={onPick} disabled={busy} />
      {busy && <span style={{ marginLeft: 8, fontSize: 13 }}>업로드 중…</span>}
      {error && <p role="alert" style={{ color: "#c00", whiteSpace: "pre-wrap" }}>{error}</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={`${apiBase}/files/${a.id}`}>{a.name}</a>
            <span style={{ fontSize: 12, color: "#888" }}>({Math.round(a.sizeBytes / 1024)} KB)</span>
            <button type="button" onClick={() => onDelete(a.id)} style={{ fontSize: 12 }}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
