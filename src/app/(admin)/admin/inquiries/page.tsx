import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { listInquiries } from "@/server/services/inquiry";
import { formatDate } from "@/lib/format";
import AnswerForm from "./AnswerForm";
import DeleteInquiryButton from "./DeleteInquiryButton";

// proxy(/admin/:path*)가 1차 가드, 여기서 서버 권한 재확인.
export default async function AdminInquiriesPage() {
  await requireAdmin();
  const inquiries = await listInquiries();

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px" }}>
      <p>
        <Link href="/admin">← 관리자 홈</Link>
      </p>
      <h1 style={{ fontSize: 24 }}>문의 접수함</h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        비밀번호 분실 건은 관리자 홈의 &quot;회원 비밀번호 재설정&quot;으로 임시
        비밀번호를 발급해 연락처로 전달한 뒤, 답변에 처리 결과를 기록해주세요.
      </p>

      {inquiries.length === 0 && <p>접수된 문의가 없습니다.</p>}

      {inquiries.map((q) => (
        <details
          key={q.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 10,
          }}
        >
          <summary style={{ cursor: "pointer", fontSize: 14 }}>
            <strong>{q.name}</strong> · {q.email} ·{" "}
            {q.category === "password" ? "비밀번호 분실" : "일반 문의"} ·{" "}
            {formatDate(new Date(q.created_at))} ·{" "}
            <span style={{ color: q.answer ? "#0a0" : "#c60", fontWeight: 700 }}>
              {q.answer ? "답변완료" : "접수됨"}
            </span>
          </summary>
          <div style={{ marginTop: 10, fontSize: 14 }}>
            {q.contact && (
              <p style={{ margin: "0 0 8px" }}>연락처: {q.contact}</p>
            )}
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{q.body}</p>
            <AnswerForm inquiryId={q.id} defaultAnswer={q.answer ?? undefined} />
            <DeleteInquiryButton inquiryId={q.id} />
          </div>
        </details>
      ))}
    </main>
  );
}
