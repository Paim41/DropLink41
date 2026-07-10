import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Clock,
  CloudUpload,
  Database,
  Download,
  FileArchive,
  FileCheck2,
  FileKey2,
  FileText,
  Fingerprint,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Mail,
  QrCode,
  Search,
  Shield,
  Sparkles,
  TimerReset,
  Users,
} from "lucide-react";
import { formatBytes } from "@/lib/droplink";
import ActiveGlassNav from "./ActiveGlassNav";

export const icons = {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Clock,
  CloudUpload,
  Database,
  Download,
  FileArchive,
  FileCheck2,
  FileKey2,
  FileText,
  Fingerprint,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Mail,
  QrCode,
  Search,
  Shield,
  Sparkles,
  TimerReset,
  Users,
};

export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden>
      <Image src="/brand/droplink-logo.png" alt="" width={48} height={48} priority />
    </span>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-lockup" aria-label="DropLink home">
      <LogoMark />
      {!compact && (
        <span>
          <span className="brand-name">DropLink</span>
          <span className="brand-kicker">Temporary Telegram vault</span>
        </span>
      )}
    </Link>
  );
}

export function GlassNav() {
  return <ActiveGlassNav brand={<Brand />} />;
}

export function Footer() {
  return (
    <footer className="site-footer">
      <Brand compact />
      <p>Telegram stores the bytes. DropLink controls identity, expiry, access, and audit trails.</p>
      <div>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/telegram-storage">Telegram guide</Link>
      </div>
    </footer>
  );
}

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <main className="droplink-shell">
      <div className="ambient-shape shape-one" />
      <div className="ambient-shape shape-two" />
      <div className="ambient-shape shape-three" />
      {children}
    </main>
  );
}

export function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) {
  return (
    <article className="glass-card stat-card hover-lift">
      <span className="icon-pill">
        <Icon className="size-5" />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function SkeletonGrid() {
  return (
    <div className="skeleton-grid" aria-label="Loading">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <span />
          <strong />
          <p />
        </div>
      ))}
    </div>
  );
}

export function FileRows({ files }: { files: { id?: string; originalName?: string; name?: string; mimeType: string; sizeBytes?: bigint | string; size?: string }[] }) {
  return (
    <div className="file-list">
      {files.map((file, index) => (
        <div className="file-row hover-row" key={file.id ?? `${file.name}-${index}`}>
          <span className="file-icon">
            <FileText className="size-5" />
          </span>
          <span>
            <strong>{file.originalName ?? file.name}</strong>
            <small>{file.mimeType}</small>
          </span>
          <b>{formatBytes(file.sizeBytes ?? file.size ?? 0)}</b>
        </div>
      ))}
    </div>
  );
}
