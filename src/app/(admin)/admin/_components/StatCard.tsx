import Link from "next/link";
import type { ContentStat } from "@/server/services/admin-stats";

export default function StatCard({ stat }: { stat: ContentStat }) {
  const hasDraft = stat.unpublished >= 1;
  return (
    <Link
      href={stat.href}
      style={{
        display: "block",
        padding: 16,
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 14, color: "#666" }}>{stat.label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>
        {stat.total}
        <span style={{ fontSize: 13, fontWeight: 400, color: "#999" }}> 건</span>
      </div>
      <div style={{ fontSize: 13, marginTop: 4, color: hasDraft ? "#c00" : "#888" }}>
        미공개 {stat.unpublished}
      </div>
    </Link>
  );
}
