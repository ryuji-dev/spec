import type { Metadata } from "next";
import { getCurrentUser } from "@/server/auth/current-user";
import { listInquiries } from "@/server/services/inquiry";
import { formatDate } from "@/lib/format";
import DocPage from "@/app/_components/DocPage";
import InquiryForm from "./InquiryForm";
import styles from "./support.module.css";

export const metadata: Metadata = { title: "고객지원" };

// 비로그인 포함 공개 페이지. 내 문의 내역은 RLS로 본인 것만 조회된다(비로그인이면 빈 목록).
export default async function SupportPage() {
  const user = await getCurrentUser();
  const myInquiries = user ? await listInquiries() : [];

  return (
    <DocPage
      title="고객지원"
      lead="서비스 이용 중 불편한 점이나 비밀번호 분실 등 도움이 필요하시면 문의를 남겨주세요. 일반 문의는 로그인 후 이 페이지에서 답변을 확인하실 수 있고, 비밀번호 분실 문의는 입력하신 연락처로 답변드립니다."
    >
      <InquiryForm
        isLoggedIn={!!user}
        defaultName={user?.name}
        defaultEmail={user?.email}
      />

      {user && (
        <section className={styles.history}>
          <h2 className={styles.historyTitle}>내 문의 내역</h2>
          {myInquiries.length === 0 ? (
            <p className={styles.notice}>접수된 문의가 없습니다.</p>
          ) : (
            myInquiries.map((q) => (
              <div key={q.id} className={styles.item}>
                <div className={styles.itemMeta}>
                  <span>{q.category === "password" ? "비밀번호 분실" : "일반 문의"}</span>
                  <span>{formatDate(new Date(q.created_at))}</span>
                  <span className={q.answer ? styles.badgeDone : styles.badgeOpen}>
                    {q.answer ? "답변완료" : "접수됨"}
                  </span>
                </div>
                <p className={styles.itemBody}>{q.body}</p>
                {q.answer && (
                  <div className={styles.answerBox}>
                    <span className={styles.answerLabel}>답변</span>
                    <p className={styles.itemBody}>{q.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}
    </DocPage>
  );
}
