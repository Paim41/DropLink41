"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppBackground, FileRows, GlassNav, SkeletonGrid, icons } from "./common";
import { formatBytes, shareUrl } from "@/lib/droplink";

type Detail = {
  id: string;
  shareToken: string;
  title: string;
  note: string | null;
  expiresAt: string;
  maxDownloads: number | null;
  currentDownloads: number;
  status: string;
  totalSize: string;
  files: { id: string; originalName: string; mimeType: string; sizeBytes: string; telegramFileId: string | null; telegramMessageId: number | null; telegramChatId: string | null }[];
  downloadLogs: { id: string; status: string; downloadedAt: string; ipAddress: string | null; userAgent: string | null }[];
  abuseReports: { id: string; reason: string; reportedBy: string | null; createdAt: string }[];
};

export default function UploadDetailClient({ id }: { id: string }) {
  const [upload, setUpload] = useState<Detail | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/droplink/uploads/${id}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load upload detail.");
        const data = await response.json();
        setUpload(data.upload);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load upload detail."));
  }, [id]);

  async function update(action: "disable" | "extend") {
    const response = await fetch(`/api/droplink/uploads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(action === "disable" ? { status: "disabled" } : { status: "active", extendHours: 72 }),
    });
    setMessage(response.ok ? "Settings updated." : "Unable to update settings.");
  }

  return (
    <AppBackground>
      <GlassNav />
      <section className="detail-shell">
        {!upload ? (
          <>
            {message && <p className="form-message">{message}</p>}
            <SkeletonGrid />
          </>
        ) : (
          <>
            <div className="dashboard-heading">
              <div>
                <span className="eyebrow"><icons.BarChart3 className="size-4" /> Link analytics</span>
                <h1>{upload.title}</h1>
                <p>{shareUrl(upload.shareToken)}</p>
              </div>
              <div className="hero-actions">
                <Link className="ghost-button" href={`/share/${upload.shareToken}`}>Preview</Link>
                <button className="ghost-button" onClick={() => update("extend")}>Extend 72h</button>
                <button className="glow-button" onClick={() => update("disable")}><icons.LockKeyhole className="size-4" /> Disable</button>
              </div>
            </div>
            {message && <p className="form-message dashboard-message">{message}</p>}
            <div className="stat-grid">
              <article className="glass-card stat-card"><span className="icon-pill"><icons.Download className="size-5" /></span><p>Downloads</p><strong>{upload.currentDownloads}{upload.maxDownloads ? `/${upload.maxDownloads}` : ""}</strong><small>{upload.status}</small></article>
              <article className="glass-card stat-card"><span className="icon-pill"><icons.Clock className="size-5" /></span><p>Expires</p><strong>{new Date(upload.expiresAt).toLocaleDateString()}</strong><small>{new Date(upload.expiresAt).toLocaleTimeString()}</small></article>
              <article className="glass-card stat-card"><span className="icon-pill"><icons.Database className="size-5" /></span><p>Total size</p><strong>{formatBytes(upload.totalSize)}</strong><small>{upload.files.length} files</small></article>
              <article className="glass-card stat-card"><span className="icon-pill"><icons.AlertTriangle className="size-5" /></span><p>Reports</p><strong>{upload.abuseReports.length}</strong><small>moderation queue</small></article>
            </div>
            <section className="dashboard-columns">
              <div className="glass-card">
                <div className="panel-title"><h2>Files and Telegram references</h2></div>
                <FileRows files={upload.files} />
                <pre className="reference-box">{JSON.stringify(upload.files.map((file) => ({
                  name: file.originalName,
                  telegram_file_id: file.telegramFileId ? "stored" : "missing",
                  telegram_message_id: file.telegramMessageId,
                  telegram_chat_id: file.telegramChatId ? "configured" : "missing",
                })), null, 2)}</pre>
              </div>
              <div className="glass-card">
                <div className="panel-title"><h2>Access timeline</h2></div>
                <div className="activity-list">
                  {upload.downloadLogs.map((log) => (
                    <div className="activity-item" key={log.id}>
                      <icons.Activity className="size-4" />
                      <span>
                        <strong>{log.status.replace("_", " ")}</strong>
                        <small>{new Date(log.downloadedAt).toLocaleString()} / {log.ipAddress ?? "unknown IP"}</small>
                      </span>
                    </div>
                  ))}
                  {!upload.downloadLogs.length && <div className="empty-state">No access events yet.</div>}
                </div>
              </div>
            </section>
          </>
        )}
      </section>
    </AppBackground>
  );
}
