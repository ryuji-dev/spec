"use client";
import styles from "./ui.module.css";

// 바인딩된 서버 삭제 액션을 confirm 후 호출하는 공용 버튼. admin 목록들이 공유.
export default function DeletePostButton({
  action,
  confirmText = "삭제하시겠습니까? 되돌릴 수 없습니다.",
}: {
  action: () => Promise<void>;
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <button type="submit" className={styles.rowDanger}>
        삭제
      </button>
    </form>
  );
}
