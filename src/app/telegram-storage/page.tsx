import { PolicyPage } from "@/components/PolicyPage";

export default function TelegramStoragePage() {
  return (
    <PolicyPage title="Telegram Storage Explanation">
      <p>DropLink uses private Telegram channels or groups as the remote content backend. The local PostgreSQL database stores searchable metadata, share-link policy, Telegram message references, and access logs.</p>
      <p>Downloads are streamed through the backend using protected application routes. Telegram bot tokens and raw Telegram file URLs are never exposed to the browser.</p>
      <p>For deployments using the cloud Bot API, configure and respect Telegram upload and download limits. Self-hosted Local Bot API deployments can set `TELEGRAM_API_BASE_URL`.</p>
    </PolicyPage>
  );
}
