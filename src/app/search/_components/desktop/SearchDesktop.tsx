import Link from "next/link";
import { PageHeroDesktop } from "@/app/_components/PageHero";
import type { SearchResult } from "@/server/services/search";
import styles from "./SearchDesktop.module.css";

type Props = { query: string; results: SearchResult[] };

export default function SearchDesktop({ query, results }: Props) {
  const hasQuery = query.trim().length > 0;
  return (
    <main className={styles.page}>
      <PageHeroDesktop kicker="SEARCH" title="통합 검색" lead="공지·게시판·교육위원회·수련회·웹진·자료를 한 번에 찾습니다." />
      <div className={styles.body}>
        <form className={styles.searchForm} method="get" action="/search">
          <input
            className={styles.input}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="검색어를 입력하세요"
            aria-label="검색어"
            autoFocus
          />
          <button type="submit" className={styles.submit}>검색</button>
        </form>

        {!hasQuery ? (
          <p className={styles.hint}>검색어를 입력해 주세요.</p>
        ) : results.length === 0 ? (
          <p className={styles.hint}>&apos;{query}&apos;에 대한 검색 결과가 없습니다.</p>
        ) : (
          <>
            <p className={styles.count}>검색 결과 {results.length}개</p>
            <ul className={styles.list}>
              {results.map((r) => (
                <li key={r.id} className={styles.item}>
                  <Link href={r.href} className={styles.itemLink}>
                    <div className={styles.itemHead}>
                      <span className={styles.badge}>{r.sectionLabel}</span>
                      <span className={styles.date}>{r.date}</span>
                    </div>
                    <h3 className={styles.title}>{r.title}</h3>
                    {r.snippet && <p className={styles.snippet}>{r.snippet}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
