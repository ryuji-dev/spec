import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { attachments } from "@/server/db/schema";
import { uploadPath } from "@/server/uploads/committee";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${fn}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
