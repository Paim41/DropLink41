"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppBackground, FileRows, GlassNav, SkeletonGrid, StatCard, icons } from "./common";
import { formatBytes, shareUrl } from "@/lib/droplink";

type Upload = {
  id: string;
  title: string;
  token: string;
  note: string | null;
  recipientName: string | null;
  expiresAt: string;
  maxDownloads: number | null;
  currentDownloads: number;
  status: string;
  totalSize: string;
  createdAt: string;
  fileCount: number;
  files: { id: string; name: string; mimeType: string; size: string }[];
  logs: { id: string; status: string; downloadedAt: string; ipAddress: string | null }[];
};

type DashboardData = {
  stats: {
    totalUploads: number;
    activeLinks: number;
    expiredLinks: number;
    totalDownloads: number;
    storageBytes: string;
  };
  uploads: Upload[];
  notifications: { id: string; title: string; message: string; createdAt: string }[];
};

export default function DashboardClient({ admin = false }: { admin?: boolean }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/droplink/dashboard", { cache: "no-store" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      setMessage(error.error ?? "Login is required to view live dashboard data.");
      setData(null);
      setLoading(false);
      return;
    }
    setData(await response.json());
    setMessage("");
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    fetch("/api/droplink/dashboard", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error ?? "Login is required to view live dashboard data.");
        }
        return response.json() as Promise<DashboardData>;
      })
      .then((nextData) => {
        if (!ignore) {
          setData(nextData);
          setMessage("");
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : "Login is required to view live dashboard data.");
          setData(null);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const uploads = useMemo(() => {
    const list = [...(data?.uploads ?? [])].filter((upload) => {
      const haystack = `${upload.title} ${upload.recipientName ?? ""} ${upload.token}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
    if (sort === "expiring") list.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    if (sort === "downloads") list.sort((a, b) => b.currentDownloads - a.currentDownloads);
    if (sort === "newest") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [data, query, sort]);

  async function mutate(upload: Upload, action: "disable" | "extend" | "delete") {
    const init: RequestInit = action === "delete"
      ? { method: "DELETE" }
      : {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(action === "disable" ? { status: "disabled" } : { extendHours: 72, status: "active" }),
        };
    const response = await fetch(`/api/droplink/uploads/${upload.id}`, init);
    setMessage(response.ok ? "Link updated." : "Unable to update this link.");
    await load();
  }

  async function copy(token: string) {
    await navigator.clipboard.writeText(shareUrl(token).replace("http://localhost:3000", window.location.origin));
    setMessage("Share link copied.");
  }

  return (
    <AppBackground>
      <GlassNav />
      <section className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow"><icons.LayoutDashboard className="size-4" /> {admin ? "Admin control center" : "User dashboard"}</span>
            <h1>{admin ? "Monitor every link and signal" : "Manage your DropLink shares"}</h1>
          </div>
          <Link className="glow-button" href="/upload"><icons.CloudUpload className="size-4" /> New Upload</Link>
        </div>

        {message && <p className="form-message dashboard-message">{message}</p>}

        {loading ? (
          <SkeletonGrid />
        ) : !data ? (
          <section className="glass-card management-panel">
            <span className="eyebrow"><icons.LockKeyhole className="size-4" /> Dashboard unavailable</span>
            <h2 className="setup-heading">Admin needs one setup step</h2>
            <p className="setup-copy">{message || "Login is required to view live dashboard data."}</p>
            <div className="hero-actions">
              <Link className="glow-button" href="/login">Log In</Link>
              <Link className="ghost-button" href="/register">Create Account</Link>
            </div>
          </section>
        ) : (
          <>
            <div className="stat-grid">
              <StatCard icon={icons.FileCheck2} label="Total uploads" value={String(data.stats.totalUploads)} detail="all share links" />
              <StatCard icon={icons.Link2} label="Active links" value={String(data.stats.activeLinks)} detail="currently accessible" />
              <StatCard icon={icons.TimerReset} label="Expired links" value={String(data.stats.expiredLinks)} detail="locked by policy" />
              <StatCard icon={icons.Download} label="Downloads" value={String(data.stats.totalDownloads)} detail={`${formatBytes(data.stats.storageBytes)} stored`} />
            </div>

            <section className="glass-card management-panel">
              <div className="toolbar">
                <label className="search-box"><icons.Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search filename, recipient, or token" /></label>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="expiring">Expiring soon</option>
                  <option value="downloads">Most downloaded</option>
                </select>
              </div>
              <div className="link-table">
                {uploads.map((upload) => (
                  <article className="link-row hover-row" key={upload.id}>
                    <div className="link-main">
                      <span className={clsx("status-dot", upload.status)} />
                      <div>
                        <h3>{upload.title}</h3>
                        <p>{upload.fileCount} files / {formatBytes(upload.totalSize)} / expires {new Date(upload.expiresAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="link-meta">
                      <strong>{upload.currentDownloads}{upload.maxDownloads ? `/${upload.maxDownloads}` : ""}</strong>
                      <small>{upload.status.replace("_", " ")}</small>
                    </div>
                    <div className="row-actions">
                      <button className="icon-button" title="Copy link" onClick={() => copy(upload.token)}><icons.Link2 className="size-4" /></button>
                      <Link className="icon-button" title="Analytics" href={`/dashboard/uploads/${upload.id}`}><icons.BarChart3 className="size-4" /></Link>
                      <button className="icon-button" title="Extend expiration" onClick={() => mutate(upload, "extend")}><icons.Clock className="size-4" /></button>
                      <button className="icon-button danger" title="Disable link" onClick={() => mutate(upload, "disable")}><icons.LockKeyhole className="size-4" /></button>
                      <button className="icon-button danger" title="Delete link" onClick={() => mutate(upload, "delete")}><icons.AlertTriangle className="size-4" /></button>
                    </div>
                  </article>
                ))}
                {!uploads.length && <div className="empty-state">No links match this view.</div>}
              </div>
            </section>

            <section className="dashboard-columns">
              <div className="glass-card">
                <div className="panel-title"><h2>Recent upload files</h2></div>
                <FileRows files={uploads.flatMap((upload) => upload.files).slice(0, 6)} />
              </div>
              <div className="glass-card">
                <div className="panel-title"><h2>{admin ? "Suspicious activity" : "Notifications"}</h2></div>
                <div className="activity-list">
                  {data.notifications.map((notification) => (
                    <div className="activity-item" key={notification.id}>
                      <icons.Activity className="size-4" />
                      <span>
                        <strong>{notification.title}</strong>
                        <small>{notification.message}</small>
                      </span>
                    </div>
                  ))}
                  {!data.notifications.length && <div className="empty-state">No notifications yet.</div>}
                </div>
              </div>
            </section>
          </>
        )}
      </section>
    </AppBackground>
  );
}
