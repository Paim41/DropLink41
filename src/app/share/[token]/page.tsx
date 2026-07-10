import PublicDownload from "@/components/droplink/PublicDownload";
import { prisma } from "@/lib/db";
import { effectiveStatus } from "@/lib/droplink";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const upload = await prisma.upload.findUnique({
    where: { shareToken: token },
    include: { files: true },
  }).catch(() => null);

  if (!upload) return <PublicDownload upload={null} />;

  return (
    <PublicDownload
      upload={{
        token: upload.shareToken,
        title: upload.title,
        note: upload.note,
        recipientName: upload.recipientName,
        expiresAt: upload.expiresAt.toISOString(),
        maxDownloads: upload.maxDownloads,
        currentDownloads: upload.currentDownloads,
        status: effectiveStatus(upload),
        totalSize: upload.totalSize.toString(),
        passwordEnabled: Boolean(upload.passwordHash),
        files: upload.files.map((file) => ({
          id: file.id,
          name: file.originalName,
          mimeType: file.mimeType,
          size: file.sizeBytes.toString(),
        })),
      }}
    />
  );
}
