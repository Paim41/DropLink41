-- DropLink temporary share-link metadata.
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT;

CREATE TYPE "LinkStatus" AS ENUM ('active', 'disabled', 'expired', 'limit_reached', 'archived');
CREATE TYPE "DownloadStatus" AS ENUM ('allowed', 'password_required', 'password_failed', 'expired', 'limit_reached', 'disabled', 'not_found');
CREATE TYPE "NotificationType" AS ENUM ('upload_success', 'download_event', 'link_expired', 'limit_reached', 'suspicious_activity');

CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "shareToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "recipientName" TEXT,
    "passwordHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxDownloads" INTEGER,
    "currentDownloads" INTEGER NOT NULL DEFAULT 0,
    "status" "LinkStatus" NOT NULL DEFAULT 'active',
    "totalSize" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UploadFile" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "telegramFileId" TEXT,
    "telegramMessageId" INTEGER,
    "telegramChatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DownloadLog" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DownloadStatus" NOT NULL,
    "metadata" JSONB,
    CONSTRAINT "DownloadLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbuseReport" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reportedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AbuseReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Upload_shareToken_key" ON "Upload"("shareToken");
CREATE INDEX "Upload_userId_createdAt_idx" ON "Upload"("userId", "createdAt");
CREATE INDEX "Upload_status_expiresAt_idx" ON "Upload"("status", "expiresAt");
CREATE INDEX "UploadFile_uploadId_idx" ON "UploadFile"("uploadId");
CREATE INDEX "DownloadLog_uploadId_downloadedAt_idx" ON "DownloadLog"("uploadId", "downloadedAt");
CREATE INDEX "DownloadLog_status_downloadedAt_idx" ON "DownloadLog"("status", "downloadedAt");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "AbuseReport_uploadId_createdAt_idx" ON "AbuseReport"("uploadId", "createdAt");

ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UploadFile" ADD CONSTRAINT "UploadFile_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DownloadLog" ADD CONSTRAINT "DownloadLog_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbuseReport" ADD CONSTRAINT "AbuseReport_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
