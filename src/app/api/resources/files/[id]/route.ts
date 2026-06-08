import { isUuid } from "@/lib/api";
import { readAttachment } from "@/server/uploads/core";
import { incrementResourceDownload } from "@/server/services/resource";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not Found", { status: 404 });
  const file = await readAttachment(id);
  if (!file) return new Response("Not Found", { status: 404 });

  // 다운로드 수 증가 (자료 단위)
  await incrementResourceDownload(file.postId);

  const fn = encodeURIComponent(file.originalName);
  return new Response(file.blob, {
    status: 200,
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${fn}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
