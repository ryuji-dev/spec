import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { isUuid } from "@/lib/api";
import { getDb } from "@/server/db";
import { attachments } from "@/server/db/schema";
import { uploadPath } from "@/server/uploads/training";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not Found", { status: 404 });
  const [row] = await getDb()
    .select({
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
    data = await readFile(uploadPath(row.storedName));
  } catch {
    return new Response("Not Found", { status: 404 });
  }
  const fn = encodeURIComponent(row.originalName);
  // 이미지는 썸네일·미리보기용 inline, 그 외(pdf·office·hwp)는 다운로드 attachment
  const disposition = row.mime.startsWith("image/") ? "inline" : "attachment";
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${fn}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
