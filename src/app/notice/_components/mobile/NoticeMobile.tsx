import Link from "next/link";
import { PageHeroMobile } from "@/app/_components/PageHero";
import type { NoticePost } from "@/server/services/notice";
import BottomTabBar from "@/app/main/_components/mobile/BottomTabBar";

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

function Card({ n }: { n: NoticePost }) {
  return (
    <li style={{ borderBottom: `1px solid ${C.line}` }}>
      <Link href={`/notice/${n.id}`} style={{ display: "block", padding: "16px 4px", textDecoration: "none", color: C.ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {n.isPinned && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.surface, background: C.primary, padding: "2px 6px", borderRadius: 4 }}>
              고정
            </span>
          )}
          {n.isNew && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>NEW</span>}
        </div>
        <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{n.title}</div>
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
          {n.author} · {n.date} · 조회 {n.views}
        </div>
      </Link>
    </li>
  );
}

export default function NoticeMobile({
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
      <PageHeroMobile kicker="NOTICE" title="공지사항" lead="교육위원회의 안내와 소식." />
      <main style={{ padding: "24px 20px 80px", background: C.bg, minHeight: "60vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, color: C.ink, margin: 0 }}>전체 공지</h2>
          {isAdmin && (
            <Link href="/admin/notice/new" style={{ fontSize: 12, color: C.surface, background: C.primary, padding: "6px 12px", borderRadius: 6, textDecoration: "none" }}>
              글쓰기
            </Link>
          )}
        </div>
        {all.length === 0 ? (
          <p style={{ color: C.muted, padding: "40px 0", textAlign: "center" }}>등록된 공지가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `2px solid ${C.primary}` }}>
            {all.map((n) => (
              <Card key={n.id} n={n} />
            ))}
          </ul>
        )}
      </main>
      <BottomTabBar />
    </>
  );
}
