import { isUuid } from "@/lib/api";
import { readAttachment } from "@/server/uploads/core";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not Found", { status: 404 });
  const file = await readAttachment(id);
  if (!file) return new Response("Not Found", { status: 404 });

  const fn = encodeURIComponent(file.originalName);
  // 이미지는 썸네일·미리보기용 inline, 그 외(pdf·office·hwp)는 다운로드 attachment
  const disposition = file.mime.startsWith("image/") ? "inline" : "attachment";
  return new Response(file.blob, {
    status: 200,
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${fn}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
