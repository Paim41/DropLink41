import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { downloadStatusFor } from "@/lib/droplink";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/responses";
import { sendTelegramNotification } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`droplink-download:${token}:${ip}`, 20, 60_000);
  if (!limited.allowed) return jsonError("Too many attempts for this link", 429);

  const body = await request.json().catch(() => ({}));
  const upload = await prisma.upload.findUnique({
    where: { shareToken: token },
    include: { files: true, user: true },
  });

  if (!upload) return jsonError("Share link not found", 404);

  const status = downloadStatusFor(upload);
  if (status !== "allowed") {
    await prisma.downloadLog.create({
      data: {
        uploadId: upload.id,
        status,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
      },
    });
    if (status !== upload.status && (status === "expired" || status === "limit_reached")) {
      await prisma.upload.update({ where: { id: upload.id }, data: { status } }).catch(() => undefined);
    }
    return jsonError(`Share link is ${status.replace("_", " ")}`, status === "expired" ? 410 : 403);
  }

  if (upload.passwordHash) {
    const password = typeof body.password === "string" ? body.password : "";
    if (!password) {
      await prisma.downloadLog.create({ data: { uploadId: upload.id, status: "password_required", ipAddress: ip, userAgent: request.headers.get("user-agent") } });
      return jsonError("Password required", 401);
    }
    const ok = await bcrypt.compare(password, upload.passwordHash);
    if (!ok) {
      await prisma.downloadLog.create({ data: { uploadId: upload.id, status: "password_failed", ipAddress: ip, userAgent: request.headers.get("user-agent") } });
      return jsonError("Incorrect password", 401);
    }
  }

  const updated = await prisma.upload.update({
    where: { id: upload.id },
    data: { currentDownloads: { increment: 1 } },
    include: { files: true },
  });
  await prisma.downloadLog.create({
    data: {
      uploadId: upload.id,
      status: "allowed",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent"),
    },
  });

  if (upload.userId) {
    await prisma.notification.create({
      data: {
        userId: upload.userId,
        type: "download_event",
        title: "Share link downloaded",
        message: `${upload.title} was accessed from ${ip}.`,
      },
    });
  }
  if (upload.user?.telegramChatId) {
    await sendTelegramNotification({
      chatId: upload.user.telegramChatId,
      text: `DropLink download event\n${upload.title}\nAccessed from ${ip}`,
    }).catch(() => undefined);
  }

  if (updated.maxDownloads && updated.currentDownloads >= updated.maxDownloads) {
    await prisma.upload.update({ where: { id: upload.id }, data: { status: "limit_reached" } }).catch(() => undefined);
  }

  return NextResponse.json({
    files: updated.files.map((file) => ({
      id: file.id,
      name: file.originalName,
      mimeType: file.mimeType,
      size: file.sizeBytes.toString(),
      downloadUrl: `/api/droplink/file/${file.id}?token=${encodeURIComponent(token)}`,
    })),
  });
}
