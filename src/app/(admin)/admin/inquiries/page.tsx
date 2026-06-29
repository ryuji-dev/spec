import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listInquiries } from "@/server/services/inquiry";
import { INQUIRY_CATEGORY_LABEL } from "@/lib/dto/inquiry";
import { formatDate } from "@/lib/format";
import AnswerForm from "./AnswerForm";
import DeleteInquiryButton from "./DeleteInquiryButton";
import styles from "../_components/ui.module.css";

// proxy(/admin/:path*)가 1차 가드, 여기서 서버 권한 재확인.
export default async function AdminInquiriesPage() {
  await requireAdmin();
  const inquiries = await listInquiries();

  return (
    <div className={styles.page}>
      <Link href="/admin" className={styles.backLink}>← 관리자 홈</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>문의 접수함</h1>
        <p className={styles.pageDesc}>
          비밀번호 분실 건은 관리자 홈의 &quot;회원 비밀번호 재설정&quot;으로 임시
          비밀번호를 발급해 연락처로 전달한 뒤, 답변에 처리 결과를 기록해주세요.
        </p>
      </div>

      {inquiries.length === 0 && (
        <p className={styles.cellMuted}>접수된 문의가 없습니다.</p>
      )}

      {inquiries.map((q) => (
        <details key={q.id} className={styles.inquiryItem}>
          <summary className={styles.inquirySummary}>
            <strong>{q.name}</strong> · {q.email} ·{" "}
            {INQUIRY_CATEGORY_LABEL[q.category]} ·{" "}
            {formatDate(new Date(q.created_at))} ·{" "}
            <span className={q.answer ? styles.statusDone : styles.statusNew}>
              {q.answer ? "답변완료" : "접수됨"}
            </span>
          </summary>
          <div className={styles.inquiryBody}>
            {q.contact && (
              <p style={{ margin: "0 0 8px" }}>연락처: {q.contact}</p>
            )}
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{q.body}</p>
            <AnswerForm inquiryId={q.id} defaultAnswer={q.answer ?? undefined} />
            <DeleteInquiryButton inquiryId={q.id} />
          </div>
        </details>
      ))}
    </div>
  );
}
