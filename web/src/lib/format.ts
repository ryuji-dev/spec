// 공통 포맷 유틸 — 클라이언트 안전 순수 함수.
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// bytes → "12.4 MB" / "186 MB" / "843 KB"
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

// 작성자 표시명 — 이름 + 직함(있으면). 이름 없으면 "익명".
export function formatAuthor(name: string | null, title: string | null): string {
  const n = name ?? "익명";
  return title ? `${n} ${title}` : n;
}
