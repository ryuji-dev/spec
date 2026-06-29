import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { getDeviceType } from "@/lib/device";
import SiteDesktopNav from "@/app/_components/SiteDesktopNav";
import styles from "./DocPage.module.css";

// 문서형 공용 레이아웃 — 디자인 원본이 없는 안내·약관 페이지용(고객지원·이용약관·개인정보).
// 데스크톱은 사이트 공통 DesktopNav(solid), 모바일은 항상 보이는 단순 상단바.
export default async function DocPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  const h = await headers();
  const device = getDeviceType(h.get("user-agent"));
  return (
    <div className={styles.page}>
      {device === "desktop" ? (
        <SiteDesktopNav variant="solid" />
      ) : (
        <div className={styles.mobileBar}>
          <Link href="/main" className={styles.mobileBrand} aria-label="메인페이지로 이동">
            <svg width="10" height="16" viewBox="0 0 12 20" aria-hidden="true">
              <rect x="5" y="0" width="2" height="20" fill="var(--palette-primary)" />
              <rect x="0" y="5" width="12" height="2" fill="var(--palette-primary)" />
            </svg>
            서경노회 교육위원회
          </Link>
        </div>
      )}
      <main className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children}
      </main>
    </div>
  );
}
