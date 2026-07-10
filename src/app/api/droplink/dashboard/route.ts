import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { effectiveStatus } from "@/lib/droplink";

export const runtime = "nodejs";

type UploadSummaryRecord = {
  id: string;
  title: string;
  shareToken: string;
  note: string | null;
  recipientName: string | null;
  expiresAt: Date;
  maxDownloads: number | null;
  currentDownloads: number;
  status: "active" | "disabled" | "expired" | "limit_reached" | "archived";
  totalSize: bigint;
  createdAt: Date;
  files?: { id: string; originalName: string; mimeType: string; sizeBytes: bigint }[];
  downloadLogs?: { id: string; status: string; downloadedAt: Date; ipAddress: string | null }[];
};

function serializeUpload(upload: UploadSummaryRecord) {
  const status = effectiveStatus(upload);
  return {
    id: upload.id,
    title: upload.title,
    token: upload.shareToken,
    note: upload.note,
    recipientName: upload.recipientName,
    expiresAt: upload.expiresAt.toISOString(),
    maxDownloads: upload.maxDownloads,
    currentDownloads: upload.currentDownloads,
    status,
    totalSize: upload.totalSize.toString(),
    createdAt: upload.createdAt.toISOString(),
    fileCount: upload.files?.length ?? 0,
    files: upload.files?.map((file) => ({
      id: file.id,
      name: file.originalName,
      mimeType: file.mimeType,
      size: file.sizeBytes.toString(),
    })) ?? [],
    logs: upload.downloadLogs?.map((log) => ({
      id: log.id,
      status: log.status,
      downloadedAt: log.downloadedAt.toISOString(),
      ipAddress: log.ipAddress,
    })) ?? [],
  };
}

export async function GET() {
  try {
    const session = await requireAdmin();
    const where = { userId: session.userId };
    const [uploads, totalUploads, totalDownloads, notifications] = await Promise.all([
      prisma.upload.findMany({
        where,
        include: {
          files: true,
          downloadLogs: { orderBy: { downloadedAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.upload.count({ where }),
      prisma.downloadLog.count({ where: { upload: where, status: "allowed" } }),
      prisma.notification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 12 }),
    ]);

    const activeLinks = uploads.filter((upload) => effectiveStatus(upload) === "active").length;
    const expiredLinks = uploads.filter((upload) => effectiveStatus(upload) === "expired").length;
    const storageBytes = uploads.reduce((sum, upload) => sum + upload.totalSize, BigInt(0));

    return NextResponse.json({
      stats: {
        totalUploads,
        activeLinks,
        expiredLinks,
        totalDownloads,
        storageBytes: storageBytes.toString(),
      },
      uploads: uploads.map(serializeUpload),
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ error: "Please log in to view the dashboard." }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Dashboard unavailable";
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "ECONNREFUSED" || message.includes("Can't reach database") || message.includes("ECONNREFUSED") || message.includes("Schema engine")) {
      return NextResponse.json({ error: "Database is not ready. Start PostgreSQL and run the Prisma migration before opening admin." }, { status: 503 });
    }
    if (message.includes("does not exist") || message.includes("column") || message.includes("relation")) {
      return NextResponse.json({ error: "Database migration is not applied. Run npm run prisma:migrate before opening admin." }, { status: 503 });
    }
    return NextResponse.json({ error: "Dashboard unavailable. Please try again." }, { status: 500 });
  }
}
