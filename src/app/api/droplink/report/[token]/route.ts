import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const body = await request.json().catch(() => ({}));
  const upload = await prisma.upload.findUnique({ where: { shareToken: token } });
  if (!upload) return jsonError("Share link not found", 404);
  await prisma.abuseReport.create({
    data: {
      uploadId: upload.id,
      reason: String(body.reason ?? "Recipient reported this link").slice(0, 500),
      reportedBy: String(body.reportedBy ?? "").slice(0, 120) || null,
    },
  });
  return NextResponse.json({ ok: true });
}
