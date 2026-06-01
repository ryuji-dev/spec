import { getCurrentUser } from "@/server/auth/current-user";
import { deleteAttachment } from "@/server/uploads/committee";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return Response.json(
      { ok: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } },
      { status: 403 },
    );
  const { id } = await params;
  await deleteAttachment(id);
  return Response.json({ ok: true, data: { id } });
}
