import Link from "next/link";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import type { NoticePost } from "@/server/services/notice";

// forest 팔레트 CSS 변수 — globals.css에서 정의, 별도 import 불필요
const C = {
  bg: "var(--palette-bg)",
  surface: "var(--palette-surface)",
  primary: "var(--palette-primary)",
  accent: "var(--palette-accent)",
  ink: "var(--palette-ink)",
  muted: "var(--palette-muted)",
  line: "var(--palette-line)",
};

function Row({ n }: { n: NoticePost }) {
  return (
    <li style={{ borderBottom: `1px solid ${C.line}` }}>
      <Link
        href={`/notice/${n.id}`}
        style={{ display: "block", padding: "18px 8px", textDecoration: "none", color: C.ink }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {n.isPinned && (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.surface, background: C.primary, padding: "2px 8px", borderRadius: 4 }}>
              고정
            </span>
          )}
          <span style={{ fontSize: 17, fontWeight: 600 }}>{n.title}</span>
          {n.isNew && <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>NEW</span>}
        </div>
        {n.excerpt && (
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {n.excerpt}
          </p>
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
          {n.author} · {n.date} · 조회 {n.views}
        </div>
      </Link>
    </li>
  );
}

export default function NoticeDesktop({
  pinned,
  posts,
  isAdmin,
}: {
  pinned: NoticePost | null;
  posts: NoticePost[];
  isAdmin: boolean;
}) {
  const all = pinned ? [pinned, ...posts] : posts;
  return (
    <>
      <PageHeroDesktop kicker="NOTICE" title="공지사항" lead="교육위원회의 안내와 소식을 전합니다." />
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px 96px", background: C.bg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, color: C.ink, margin: 0 }}>전체 공지</h2>
          {isAdmin && (
            <Link
              href="/admin/notice/new"
              style={{ fontSize: 13, color: C.surface, background: C.primary, padding: "8px 16px", borderRadius: 6, textDecoration: "none" }}
            >
              글쓰기
            </Link>
          )}
        </div>
        {all.length === 0 ? (
          <p style={{ color: C.muted, padding: "48px 0", textAlign: "center" }}>등록된 공지가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `2px solid ${C.primary}` }}>
            {all.map((n) => (
              <Row key={n.id} n={n} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
