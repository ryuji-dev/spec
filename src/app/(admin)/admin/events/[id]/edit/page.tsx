import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getEventForEdit } from "@/server/services/training";
import { updateEvent, deleteEvent } from "@/server/actions/events";
import EditorForm from "../../EditorForm";
import styles from "../../../_components/ui.module.css";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEventForEdit(id);
  if (!event) notFound();

  const update = updateEvent.bind(null, id);
  const remove = deleteEvent.bind(null, id);

  return (
    <div className={styles.page}>
      <Link href="/admin/events" className={styles.backLink}>← 목록</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>이벤트 수정</h1>
      </div>
      <EditorForm
        action={update}
        initial={{
          title: event.title,
          subtitle: event.subtitle,
          theme: event.theme,
          category: event.category,
          badge: event.badge,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          place: event.place,
          note: event.note,
          cover: event.cover,
          capacity: event.capacity,
          registered: event.registered,
          participants: event.participants,
          fee: event.fee,
          deadline: event.deadline,
          isPublished: event.isPublished,
          speakers: event.speakers,
          schedule: event.schedule,
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" className={styles.btnDanger}>이벤트 삭제</button>
      </form>
    </div>
  );
}
