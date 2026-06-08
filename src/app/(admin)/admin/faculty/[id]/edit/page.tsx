import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-user";
import { getFacultyMemberForEdit } from "@/server/services/faculty";
import { updateFaculty, deleteFaculty } from "@/server/actions/faculty";
import EditorForm from "../../EditorForm";

export default async function EditFacultyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const row = await getFacultyMemberForEdit(id);
  if (!row) notFound();

  const update = updateFaculty.bind(null, id);
  const remove = deleteFaculty.bind(null, id);

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/faculty" style={{ fontSize: 13, color: "#666" }}>← 교수 목록</Link>
      <h1 style={{ fontSize: 22 }}>교수 수정</h1>
      <EditorForm
        action={update}
        initial={{
          name: row.name,
          title: row.title,
          en: row.en,
          degree: row.degree,
          dept: row.dept,
          tone: row.tone,
          field: row.field,
          teaches: row.teaches.join("\n"),
          quote: row.quote,
          years: row.years,
          papers: row.papers,
          office: row.office,
          hours: row.hours,
          isCover: row.isCover,
          sortOrder: row.sortOrder,
          about: row.about ?? "",
        }}
        submitLabel="수정 저장"
      />
      <form action={remove} style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, color: "#c00" }}>
          교수 삭제
        </button>
      </form>
    </main>
  );
}
