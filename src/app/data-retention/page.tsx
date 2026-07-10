import { PolicyPage } from "@/components/PolicyPage";

export default function DataRetentionPage() {
  return (
    <PolicyPage title="Data Retention Policy">
      <p>Expired links become inaccessible after their configured expiry time or after their maximum download count is reached.</p>
      <p>Metadata deletion removes the share link and related file records, while retaining only operational logs required for accountability where configured.</p>
      <p>Files may become unavailable if the Telegram account, bot, group, channel, or message is deleted outside DropLink.</p>
    </PolicyPage>
  );
}
