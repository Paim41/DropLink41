"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AppBackground, FileRows, GlassNav, SkeletonGrid, icons } from "./common";
import { formatBytes } from "@/lib/droplink";

type Result = {
  id: string;
  token: string;
  url: string;
  fileCount: number;
  totalSize: string;
  expiresAt: string;
  maxDownloads: number | null;
  passwordEnabled: boolean;
};

export default function UploadStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [settings, setSettings] = useState({
    title: "",
    expiryHours: "24",
    password: "",
    maxDownloads: "10",
    recipientName: "",
    note: "",
  });

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const previewFiles = files.map((file) => ({ name: file.name, mimeType: file.type || "application/octet-stream", size: String(file.size) }));

  function addFiles(incoming: FileList | File[]) {
    const next = Array.from(incoming);
    setFiles((current) => [...current, ...next].slice(0, 20));
    setResult(null);
  }

  function submit() {
    if (!files.length) {
      setToast("Choose at least one file before creating a share link.");
      return;
    }
    setBusy(true);
    setToast("");
    setProgress(8);
    const form = new FormData();
    for (const file of files) form.append("files", file);
    Object.entries(settings).forEach(([key, value]) => form.append(key, value));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/droplink/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.max(8, Math.round((event.loaded / event.total) * 82)));
    };
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setResult(data.upload);
        setToast("Share link created and metadata saved.");
      } else {
        setToast(data.error ?? "Upload failed. Check Telegram configuration and try again.");
      }
      setBusy(false);
    };
    xhr.onerror = () => {
      setToast("Network interrupted while uploading.");
      setBusy(false);
    };
    xhr.send(form);
  }

  async function copyLink() {
    if (!result) return;
    const absolute = result.url.startsWith("http") ? result.url : `${window.location.origin}${result.url}`;
    await navigator.clipboard.writeText(absolute);
    setToast("Share link copied.");
  }

  return (
    <AppBackground>
      <GlassNav />
      <section className="studio-layout">
        <div className="studio-main">
          <div
            className={clsx("upload-zone glass-card hover-lift", dragging && "is-dragging")}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" multiple hidden onChange={(event) => event.target.files && addFiles(event.target.files)} />
            <span className="upload-icon"><icons.CloudUpload className="size-10" /></span>
            <h1>Upload files to DropLink</h1>
            <p>Drag files here or choose from your device. DropLink will send them to Telegram, save metadata, and create a temporary share link.</p>
            <button className="glow-button" type="button">
              <icons.FileCheck2 className="size-4" />
              Choose Files
            </button>
          </div>

          <section className="glass-card selected-files">
            <div className="panel-title">
              <div>
                <span className="eyebrow"><icons.FileArchive className="size-4" /> Selected files</span>
                <h2>{files.length ? `${files.length} file${files.length > 1 ? "s" : ""}` : "No files selected"}</h2>
              </div>
              <strong>{formatBytes(totalSize)}</strong>
            </div>
            {busy && progress < 95 ? <SkeletonGrid /> : files.length ? <FileRows files={previewFiles} /> : <div className="empty-state">Your upload queue will appear here.</div>}
            {busy && (
              <div className="progress-wrap" aria-label="Upload progress">
                <span style={{ width: `${progress}%` }} />
              </div>
            )}
          </section>
        </div>

        <aside className="glass-card settings-panel">
          <span className="eyebrow"><icons.FileKey2 className="size-4" /> Link settings</span>
          <label>Title<input value={settings.title} onChange={(event) => setSettings({ ...settings, title: event.target.value })} placeholder="Client delivery package" /></label>
          <label>Expiry<input type="number" min="1" max="720" value={settings.expiryHours} onChange={(event) => setSettings({ ...settings, expiryHours: event.target.value })} /></label>
          <label>Password<input type="password" value={settings.password} onChange={(event) => setSettings({ ...settings, password: event.target.value })} placeholder="Optional" /></label>
          <label>Max downloads<input type="number" min="1" value={settings.maxDownloads} onChange={(event) => setSettings({ ...settings, maxDownloads: event.target.value })} /></label>
          <label>Recipient<input value={settings.recipientName} onChange={(event) => setSettings({ ...settings, recipientName: event.target.value })} placeholder="Optional recipient name" /></label>
          <label>Message<textarea value={settings.note} onChange={(event) => setSettings({ ...settings, note: event.target.value })} placeholder="Optional note shown to the recipient" /></label>
          <button className="glow-button full" disabled={busy} onClick={submit}>
            <icons.Link2 className="size-4" />
            {busy ? "Creating Link" : "Generate Share Link"}
          </button>
          {toast && <p className="form-message">{toast}</p>}
        </aside>
      </section>

      {result && (
        <section className="result-section glass-card">
          <div>
            <span className="success-mark"><icons.Check className="size-6" /></span>
            <h2>Share link ready</h2>
            <p>{result.fileCount} files, {formatBytes(result.totalSize)}, expires {new Date(result.expiresAt).toLocaleString()}.</p>
            <div className="copy-row">
              <input readOnly value={result.url.startsWith("http") ? result.url : `${typeof window !== "undefined" ? window.location.origin : ""}${result.url}`} />
              <button className="glow-button" onClick={copyLink}><icons.Link2 className="size-4" /> Copy</button>
            </div>
            <div className="result-actions">
              <Link className="ghost-button" href={`/share/${result.token}`}>Preview Link</Link>
              <button className="ghost-button" onClick={() => { setFiles([]); setResult(null); setProgress(0); }}>Create Another Upload</button>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR is a generated external SVG, not a layout-critical bitmap. */}
          <img
            className="qr-image"
            alt="QR code for generated share link"
            src={`https://quickchart.io/qr?format=svg&size=220&text=${encodeURIComponent(result.url)}`}
          />
        </section>
      )}
    </AppBackground>
  );
}
