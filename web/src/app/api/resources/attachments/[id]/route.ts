import { getCurrentUser } from "@/server/auth/current-user";
import { deleteResourceAttachment } from "@/server/uploads/resource";
import { isUuid } from "@/lib/api";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } }, { status: 403 });
  const { id } = await params;
  if (!isUuid(id))
    return Response.json({ ok: false, error: { code: "INVALID_ID", message: "잘못된 ID입니다." } }, { status: 400 });
  await deleteResourceAttachment(id);
  return Response.json({ ok: true, data: { id } });
}
