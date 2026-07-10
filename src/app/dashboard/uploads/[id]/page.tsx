import UploadDetailClient from "@/components/droplink/UploadDetailClient";

export default async function UploadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UploadDetailClient id={id} />;
}
