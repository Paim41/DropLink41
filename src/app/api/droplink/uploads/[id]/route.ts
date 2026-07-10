import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/responses";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await context.params;
  const upload = await prisma.upload.findFirst({
    where: { id, userId: session.userId },
    include: {
      files: true,
      downloadLogs: { orderBy: { downloadedAt: "desc" }, take: 100 },
      abuseReports: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!upload) return jsonError("Upload not found", 404);
  return NextResponse.json({
    upload: {
      ...upload,
      totalSize: upload.totalSize.toString(),
      files: upload.files.map((file) => ({ ...file, sizeBytes: file.sizeBytes.toString() })),
    },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const data: {
    status?: "active" | "disabled" | "archived";
    expiresAt?: Date;
    maxDownloads?: number | null;
    note?: string | null;
  } = {};

  if (["active", "disabled", "archived"].includes(body.status)) data.status = body.status;
  if (typeof body.extendHours === "number") data.expiresAt = new Date(Date.now() + Math.min(Math.max(body.extendHours, 1), 24 * 60) * 60 * 60 * 1000);
  if (typeof body.maxDownloads === "number") data.maxDownloads = Math.max(Math.floor(body.maxDownloads), 1);
  if (typeof body.note === "string") data.note = body.note.slice(0, 600) || null;

  const upload = await prisma.upload.updateMany({ where: { id, userId: session.userId }, data });
  if (!upload.count) return jsonError("Upload not found", 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await context.params;
  const deleted = await prisma.upload.deleteMany({ where: { id, userId: session.userId } });
  if (!deleted.count) return jsonError("Upload not found", 404);
  return NextResponse.json({ ok: true });
}
