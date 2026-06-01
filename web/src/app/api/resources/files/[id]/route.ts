import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { attachments } from "@/server/db/schema";
import { resourceUploadPath } from "@/server/uploads/resource";
import { incrementResourceDownload } from "@/server/services/resource";
import { isUuid } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not Found", { status: 404 });

  const [row] = await getDb()
    .select({
      postId: attachments.postId,
      storedName: attachments.storedName,
      originalName: attachments.originalName,
      mime: attachments.mime,
    })
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  if (!row) return new Response("Not Found", { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(resourceUploadPath(row.storedName));
  } catch {
    return new Response("Not Found", { status: 404 });
  }
  // 다운로드 수 증가 (자료 단위)
  await incrementResourceDownload(row.postId);

  const fn = encodeURIComponent(row.originalName);
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${fn}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
