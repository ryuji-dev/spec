import { getCurrentUser } from "@/server/auth/current-user";
import {
  storeAttachment,
  UploadError,
  type StoredAttachment,
} from "@/server/uploads/committee";

export const runtime = "nodejs";

function err(code: string, message: string, status: number) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return err("FORBIDDEN", "권한이 없습니다.", 403);

  const { postId } = await params;
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return err("NO_FILE", "파일이 없습니다.", 400);

  const stored: StoredAttachment[] = [];
  for (const file of files) {
    try {
      stored.push(await storeAttachment(postId, file));
    } catch (e) {
      if (e instanceof UploadError) return err(e.code, e.message, 400);
      throw e;
    }
  }
  return Response.json({ ok: true, data: stored });
}
