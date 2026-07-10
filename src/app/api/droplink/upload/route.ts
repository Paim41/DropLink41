import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { destinationFor } from "@/lib/destination";
import { prisma } from "@/lib/db";
import { shareUrl } from "@/lib/droplink";
import { env } from "@/lib/env";
import { inspectUpload } from "@/lib/file-policy";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/responses";
import { sendTelegramNotification, uploadTelegramDocument } from "@/lib/telegram";
import { randomToken } from "@/lib/crypto";

export const runtime = "nodejs";

function dateFromHours(value: FormDataEntryValue | null) {
  const hours = Math.min(Math.max(Number(value ?? 24), 1), 24 * 30);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function numberOrNull(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(Math.floor(parsed), 10000);
}

export async function POST(request: Request) {
  try {
    const session = await getSession().catch(() => null);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limited = rateLimit(`droplink-upload:${session?.userId ?? ip}`, env.UPLOAD_RATE_LIMIT, 60_000);
    if (!limited.allowed) return jsonError("Upload rate limit exceeded", 429);

    const form = await request.formData();
    const files = form.getAll("files").filter((value): value is File => value instanceof File);
    if (!files.length) return jsonError("No files supplied", 400);

    const title = String(form.get("title") ?? files[0].name ?? "Shared files").trim().slice(0, 120) || "Shared files";
    const note = String(form.get("note") ?? "").trim().slice(0, 600) || null;
    const recipientName = String(form.get("recipientName") ?? "").trim().slice(0, 120) || null;
    const password = String(form.get("password") ?? "");
    const expiresAt = dateFromHours(form.get("expiryHours"));
    const maxDownloads = numberOrNull(form.get("maxDownloads"));

    const uploadFiles = [];
    let totalSize = BigInt(0);

    for (const file of files) {
      if (file.size > env.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        return jsonError(`${file.name} exceeds the configured upload size`, 400);
      }

      const raw = Buffer.from(await file.arrayBuffer());
      const inspected = await inspectUpload(raw, file.name, file.type);
      const destination = await destinationFor(inspected.category);
      if (!destination.chatId) {
        return jsonError(`Telegram destination for ${destination.label} is not configured`, 503);
      }

      const telegram = await uploadTelegramDocument({
        chatId: destination.chatId,
        buffer: raw,
        filename: inspected.originalName,
        mimeType: inspected.mimeType,
        caption: `DropLink storage object: ${inspected.originalName}`,
      });

      uploadFiles.push({
        originalName: inspected.originalName,
        mimeType: inspected.mimeType,
        sizeBytes: BigInt(file.size),
        telegramFileId: telegram.fileId,
        telegramMessageId: telegram.messageId,
        telegramChatId: destination.chatId,
      });
      totalSize += BigInt(file.size);
    }

    const upload = await prisma.upload.create({
      data: {
        userId: session?.userId,
        shareToken: randomToken(18),
        title,
        note,
        recipientName,
        passwordHash: password ? await bcrypt.hash(password, 12) : null,
        expiresAt,
        maxDownloads,
        totalSize,
        files: {
          create: uploadFiles,
        },
      },
      include: { files: true, user: true },
    });

    if (upload.userId) {
      await prisma.notification.create({
        data: {
          userId: upload.userId,
          type: "upload_success",
          title: "Share link created",
          message: `${upload.title} is available until ${upload.expiresAt.toLocaleString()}.`,
        },
      });
    }
    if (upload.user?.telegramChatId) {
      await sendTelegramNotification({
        chatId: upload.user.telegramChatId,
        text: `DropLink upload ready\n${upload.title}\n${shareUrl(upload.shareToken)}`,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      upload: {
        id: upload.id,
        token: upload.shareToken,
        url: shareUrl(upload.shareToken),
        fileCount: upload.files.length,
        totalSize: upload.totalSize.toString(),
        expiresAt: upload.expiresAt.toISOString(),
        maxDownloads: upload.maxDownloads,
        passwordEnabled: Boolean(upload.passwordHash),
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : "Upload failed", 500);
  }
}
