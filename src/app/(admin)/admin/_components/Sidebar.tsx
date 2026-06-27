"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/server/actions/auth";
import styles from "./admin-shell.module.css";

type NavItem = { href: string; label: string; badge?: number };
type NavGroup = { title?: string; items: NavItem[] };

export default function Sidebar({
  userName,
  userMeta,
  unanswered,
}: {
  userName: string;
  userMeta: string;
  unanswered: number;
}) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    { items: [{ href: "/admin", label: "대시보드" }] },
    {
      title: "콘텐츠",
      items: [
        { href: "/admin/notice", label: "공지" },
        { href: "/admin/training", label: "강습회" },
        { href: "/admin/committee", label: "위원회 소식" },
        { href: "/admin/webzine", label: "웹진" },
        { href: "/admin/resources", label: "자료실" },
      ],
    },
    {
      title: "운영",
      items: [
        { href: "/admin/inquiries", label: "문의 접수함", badge: unanswered },
        { href: "/admin/events", label: "수련회 이벤트" },
        { href: "/admin/timetable", label: "강의 시간표" },
        { href: "/admin/collections", label: "자료실 컬렉션" },
        { href: "/admin/hero", label: "메인 히어로" },
      ],
    },
  ];

  // /admin은 정확히 일치할 때만, 나머지는 하위 경로 포함 활성.
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>✝</span>
        <div>
          <div className={styles.brandName}>서경노회 교육위원회</div>
          <div className={styles.brandSub}>관리자</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {groups.map((g, gi) => (
          <div key={g.title ?? gi}>
            {g.title && <div className={styles.navGroup}>{g.title}</div>}
            {g.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`${styles.navItem} ${isActive(it.href) ? styles.navItemActive : ""}`}
              >
                <span>{it.label}</span>
                {it.badge != null && it.badge > 0 && (
                  <span className={styles.navBadge}>{it.badge}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.userBox}>
        <div className={styles.userName}>{userName}</div>
        <div className={styles.userMeta}>{userMeta}</div>
        <form action={logout}>
          <button type="submit" className={styles.logoutBtn}>
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
