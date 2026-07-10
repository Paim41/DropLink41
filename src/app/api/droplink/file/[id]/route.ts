import { prisma } from "@/lib/db";
import { downloadStatusFor } from "@/lib/droplink";
import { jsonError } from "@/lib/responses";
import { downloadTelegramFile } from "@/lib/telegram";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) return jsonError("Missing share token", 400);

  const file = await prisma.uploadFile.findUnique({
    where: { id },
    include: { upload: true },
  });
  if (!file || file.upload.shareToken !== token) return jsonError("File not found", 404);

  const status = downloadStatusFor(file.upload);
  if (status !== "allowed") return jsonError(`Share link is ${status.replace("_", " ")}`, 403);
  if (!file.telegramFileId) return jsonError("Telegram file reference is missing", 503);

  const buffer = await downloadTelegramFile(file.telegramFileId);
  const encoded = encodeURIComponent(file.originalName).replace(/['()]/g, escape);
  return new Response(buffer, {
    headers: {
      "content-type": file.mimeType || "application/octet-stream",
      "content-length": String(buffer.length),
      "content-disposition": `attachment; filename*=UTF-8''${encoded}`,
      "cache-control": "private, no-store",
    },
  });
}
