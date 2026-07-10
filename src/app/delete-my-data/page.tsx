import { PolicyPage } from "@/components/PolicyPage";

export default function DeleteMyDataPage() {
  return (
    <PolicyPage title="Delete My Data">
      <p>Users can delete their share links from the dashboard. Administrators can review uploads, abuse reports, access logs, and failed delivery attempts.</p>
      <p>Deletion removes DropLink metadata. Telegram message cleanup can be performed by administrators when the bot has the required channel permissions.</p>
    </PolicyPage>
  );
}
