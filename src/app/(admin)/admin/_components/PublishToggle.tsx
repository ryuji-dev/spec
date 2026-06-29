"use client";
import styles from "./ui.module.css";

// 바인딩된 서버 토글 액션을 호출해 공개/비공개를 즉시 전환. admin 목록이 공유.
export default function PublishToggle({
  action,
  isPublished,
}: {
  action: () => Promise<void>;
  isPublished: boolean;
}) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <button
        type="submit"
        className={`${styles.toggleBtn} ${isPublished ? styles.toggleOn : styles.toggleOff}`}
        title={isPublished ? "클릭하면 비공개로 전환" : "클릭하면 공개로 전환"}
      >
        {isPublished ? "공개 ✓" : "비공개"}
      </button>
    </form>
  );
}
