import type { DownloadStatus, LinkStatus } from "@prisma/client";

export function formatBytes(value: number | bigint | string) {
  const size = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function shareUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${base}/share/${token}`;
}

export function isExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

export function remainingDownloads(current: number, max: number | null) {
  if (!max) return null;
  return Math.max(max - current, 0);
}

export function effectiveStatus(input: {
  status: LinkStatus;
  expiresAt: Date;
  maxDownloads: number | null;
  currentDownloads: number;
}) {
  if (input.status === "disabled" || input.status === "archived") return input.status;
  if (isExpired(input.expiresAt)) return "expired";
  if (input.maxDownloads && input.currentDownloads >= input.maxDownloads) return "limit_reached";
  return input.status;
}

export function downloadStatusFor(input: {
  status: LinkStatus;
  expiresAt: Date;
  maxDownloads: number | null;
  currentDownloads: number;
}): DownloadStatus | "allowed" {
  const status = effectiveStatus(input);
  if (status === "expired") return "expired";
  if (status === "limit_reached") return "limit_reached";
  if (status === "disabled" || status === "archived") return "disabled";
  return "allowed";
}

export const demoUploads = [
  {
    id: "demo-aurora",
    shareToken: "demo-aurora",
    title: "Investor preview package",
    note: "Board materials with recipient-only access.",
    recipientName: "Maya Chen",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 36),
    maxDownloads: 8,
    currentDownloads: 3,
    status: "active" as const,
    totalSize: BigInt(73400320),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    files: [
      { id: "file-1", originalName: "DropLink-deck.pdf", mimeType: "application/pdf", sizeBytes: BigInt(31457280) },
      { id: "file-2", originalName: "brand-assets.zip", mimeType: "application/zip", sizeBytes: BigInt(41943040) },
    ],
    downloadLogs: [
      { id: "log-1", downloadedAt: new Date(Date.now() - 1000 * 60 * 28), status: "allowed" as const, ipAddress: "198.51.100.24" },
    ],
  },
  {
    id: "demo-lumen",
    shareToken: "demo-lumen",
    title: "Design handoff",
    note: "Protected package for the product team.",
    recipientName: "Product team",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8),
    maxDownloads: 3,
    currentDownloads: 1,
    status: "active" as const,
    totalSize: BigInt(18874368),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
    files: [
      { id: "file-3", originalName: "handoff-notes.txt", mimeType: "text/plain", sizeBytes: BigInt(24576) },
      { id: "file-4", originalName: "screens.zip", mimeType: "application/zip", sizeBytes: BigInt(18849792) },
    ],
    downloadLogs: [],
  },
];

export function emptyStats() {
  return {
    totalUploads: 0,
    activeLinks: 0,
    expiredLinks: 0,
    totalDownloads: 0,
    storageBytes: BigInt(0),
  };
}
