"use client";

import { useState } from "react";
import { AppBackground, FileRows, GlassNav, icons } from "./common";
import { formatBytes } from "@/lib/droplink";

type PublicUpload = {
  token: string;
  title: string;
  note: string | null;
  recipientName: string | null;
  expiresAt: string;
  maxDownloads: number | null;
  currentDownloads: number;
  status: string;
  totalSize: string;
  passwordEnabled: boolean;
  files: { id: string; name: string; mimeType: string; size: string }[];
};

export default function PublicDownload({ upload }: { upload: PublicUpload | null }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!upload) {
    return (
      <AppBackground>
        <GlassNav />
        <StateCard title="Link not found" body="This DropLink share does not exist or was removed." icon="notFound" />
      </AppBackground>
    );
  }

  const currentUpload = upload;
  const blocked = upload.status !== "active";
  const remaining = upload.maxDownloads ? Math.max(upload.maxDownloads - upload.currentDownloads, 0) : null;

  async function download() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/droplink/download/${currentUpload.token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? "Unable to unlock this share.");
      setBusy(false);
      return;
    }
    for (const file of data.files as { downloadUrl: string }[]) {
      window.open(file.downloadUrl, "_blank", "noopener,noreferrer");
    }
    setMessage("Download started.");
    setBusy(false);
  }

  return (
    <AppBackground>
      <GlassNav />
      <section className="public-share">
        {blocked ? (
          <StateCard title={upload.status === "expired" ? "This link has expired" : upload.status === "limit_reached" ? "Download limit reached" : "This link is disabled"} body="The owner needs to extend or reactivate this share before files can be downloaded." icon="blocked" />
        ) : (
          <article className="glass-card public-card">
            <span className="eyebrow"><icons.FileKey2 className="size-4" /> Secure DropLink transfer</span>
            <h1>{upload.title}</h1>
            {upload.recipientName && <p className="recipient-line">Prepared for {upload.recipientName}</p>}
            {upload.note && <p>{upload.note}</p>}
            <div className="public-meta">
              <span><icons.Clock className="size-4" /> Expires {new Date(upload.expiresAt).toLocaleString()}</span>
              <span><icons.Download className="size-4" /> {remaining === null ? "Unlimited downloads" : `${remaining} downloads remaining`}</span>
              <span><icons.Database className="size-4" /> {formatBytes(upload.totalSize)}</span>
            </div>
            <FileRows files={upload.files} />
            {upload.passwordEnabled && (
              <label className="password-gate">
                Password
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Enter link password" />
              </label>
            )}
            <button className="glow-button full" onClick={download} disabled={busy}>
              <icons.Download className="size-4" />
              {busy ? "Preparing" : "Download Files"}
            </button>
            {message && <p className="form-message">{message}</p>}
          </article>
        )}
      </section>
    </AppBackground>
  );
}

function StateCard({ title, body, icon }: { title: string; body: string; icon: "blocked" | "notFound" }) {
  const Icon = icon === "blocked" ? icons.LockKeyhole : icons.AlertTriangle;
  return (
    <section className="public-share">
      <article className="glass-card public-card state-card">
        <span className="icon-pill"><Icon className="size-6" /></span>
        <h1>{title}</h1>
        <p>{body}</p>
      </article>
    </section>
  );
}
