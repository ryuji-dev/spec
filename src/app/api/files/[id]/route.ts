import { isUuid } from "@/lib/api";
import { readAttachment } from "@/server/uploads/core";

export const runtime = "nodejs";

// 섹션 무관 첨부 스트리밍 — 메인 사진타일 등 여러 섹션의 이미지를 첨부 id만으로 제공.
// readAttachment가 미게시(is_published=false) 글의 첨부는 null을 반환하므로 비공개 노출 없음.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not Found", { status: 404 });
  const file = await readAttachment(id);
  if (!file) return new Response("Not Found", { status: 404 });

  const fn = encodeURIComponent(file.originalName);
  // 이미지는 inline(미리보기), 그 외는 attachment 다운로드.
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
