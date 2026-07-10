import Link from "next/link";
import { AppBackground, Footer, GlassNav, StatCard, icons } from "./common";

const features = [
  ["Telegram-backed storage", "Files are posted to your private Telegram channel while DropLink keeps searchable metadata and policy controls.", icons.Bot],
  ["Expiring share links", "Each link can require a password, cap downloads, show remaining access, and expire automatically.", icons.TimerReset],
  ["Audit-first delivery", "Every access attempt is logged with status, IP, user agent, and owner notifications.", icons.Fingerprint],
  ["Operator control", "Dashboards and admin views surface failed uploads, suspicious activity, and Telegram health.", icons.Gauge],
] as const;

const steps = [
  ["Upload", "Drag in one or many files and choose expiry, recipient, password, and limits."],
  ["Store", "The backend sends each file to Telegram and saves file IDs, message IDs, and rules."],
  ["Share", "Recipients open a temporary public link that enforces every policy before download."],
] as const;

export default function Landing() {
  return (
    <AppBackground>
      <GlassNav />
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow"><icons.Shield className="size-4" /> Premium temporary file transfer</span>
          <h1>DropLink</h1>
          <p>
            A modern temporary file-sharing system with Telegram Bot API storage, expiring public links, password gates,
            download limits, in-app notifications, and admin-grade audit trails.
          </p>
          <div className="hero-actions">
            <Link className="glow-button large" href="/upload">
              <icons.CloudUpload className="size-5" />
              Upload Files
            </Link>
            <Link className="ghost-button large" href="/dashboard">
              <icons.LayoutDashboard className="size-5" />
              View Dashboard
            </Link>
          </div>
        </div>
        <div className="hero-console glass-card hover-lift" aria-label="DropLink live share preview">
          <div className="console-head">
            <span />
            <span />
            <span />
            <b>secure share pipeline</b>
          </div>
          <div className="upload-visual">
            <div className="upload-orbit">
              <icons.CloudUpload className="size-10" />
            </div>
            <div>
              <strong>Board-package.zip</strong>
              <p>Telegram message saved, token generated, policy active.</p>
            </div>
          </div>
          <div className="metric-strip">
            <StatCard icon={icons.Clock} label="Expiry" value="36h" detail="automatic lock" />
            <StatCard icon={icons.FileKey2} label="Password" value="On" detail="bcrypt hashed" />
            <StatCard icon={icons.Download} label="Limit" value="8" detail="3 used" />
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="section-heading">
          <span className="eyebrow"><icons.Sparkles className="size-4" /> What it includes</span>
          <h2>Temporary links with permanent accountability.</h2>
        </div>
        <div className="feature-grid">
          {features.map(([title, copy, Icon]) => (
            <article className="glass-card feature-card hover-lift" key={title}>
              <span className="icon-pill"><Icon className="size-5" /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-band split-band">
        <div className="glass-card flow-card">
          {steps.map(([title, copy], index) => (
            <div className="flow-step" key={title}>
              <span>{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="operator-panel">
          <span className="eyebrow"><icons.Database className="size-4" /> Metadata controlled by Postgres</span>
          <h2>Telegram is storage support, not the database.</h2>
          <p>
            DropLink records owner, file size, Telegram file ID, Telegram message ID, expiry, password state, download logs,
            notifications, and abuse reports in PostgreSQL through Prisma.
          </p>
          <Link className="glow-button" href="/admin">
            <icons.BarChart3 className="size-4" />
            Open Admin
          </Link>
        </div>
      </section>
      <Footer />
    </AppBackground>
  );
}
