<div align="center">

<img width="90" height="90" alt="droplink-logo" src="https://github.com/user-attachments/assets/91329fb5-732c-4195-a508-eec51831d5c2" />

# DropLink
**A temporary, Telegram-backed file sharing app — expiry, passwords, and download limits built in.**

Upload once, share a link, and let it disappear on your terms. Files route into a private Telegram channel or group through a bot; PostgreSQL keeps every policy, log, and reference.

[![Temporary Links](https://img.shields.io/badge/Expiring-Share%20Links-F62440?style=for-the-badge)](https://github.com/Paim41/DropLink41)
[![Telegram Storage](https://img.shields.io/badge/Telegram-Bot%20API%20Storage-FFE5BF?style=for-the-badge&logo=telegram&logoColor=F62440)](https://github.com/Paim41/DropLink41)
[![Password Protected](https://img.shields.io/badge/Password-Protected%20Links-FFF2DB?style=for-the-badge)](https://github.com/Paim41/DropLink41)
[![Type](https://img.shields.io/badge/Type-File%20Sharing-FFFAF3?style=for-the-badge)](https://github.com/Paim41/DropLink41)

</div>

---

## About

DropLink is a **modern, temporary file-sharing app** built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, and Telegram Bot API storage.

Users upload one or more files, configure expiry, an optional password, a recipient note, and a download limit, then get back a temporary public share link. The files themselves are sent to a private Telegram channel or group through a bot; PostgreSQL stores the metadata, access policy, Telegram file references, access logs, notifications, and abuse reports.

> *"Share it. Limit it. Let it expire."*

---

## Share Flow

```
Drag & Drop / Select Files
    ↓
Upload Studio        →  Set expiry, optional password, download limit, recipient note
    ↓
Telegram Delivery     →  File sent to private Telegram channel/group via bot
    ↓
Metadata Saved        →  PostgreSQL stores policy, file refs, and access rules
    ↓
Share Link Issued      →  Temporary public /share/[token] link generated
    ↓
Protected Download     →  Streamed through backend after policy checks
```

---

## Features

- **Premium Glassmorphism UI** — responsive design in a warm palette (`#FFFAF3`, `#FFF2DB`, `#FFE5BF`, `#F62440`) with skeleton loading, hover transitions, focus glow, and press effects
- **Full Page Set** — landing page, login, register, forgot-password guidance, upload studio, share result, public download page, user dashboard, upload detail analytics, and admin routes
- **Flexible Uploads** — drag-and-drop, multi-file uploads with real progress and previews
- **Configurable Share Links** — expiry, optional password, maximum download count, recipient name, and note per link
- **Telegram-Backed Storage** — upload via Telegram Bot API, with protected backend streaming for downloads (no raw Telegram URLs ever reach the browser)
- **Data Model** — Prisma models for users, uploads, upload files, download logs, notifications, and abuse reports
- **Notifications** — in-app notifications plus optional Telegram owner notifications
- **Hardened Access** — rate limiting, upload validation, bcrypt password hashing, access logging, and protected management routes

---

## Built For

```
Purpose  → Temporary, policy-controlled file sharing via public links
Backend  → Telegram private channel/group (content) + PostgreSQL (metadata & policy)
Theme    → Warm glassmorphism (FFFAF3 / FFF2DB / FFE5BF / F62440)
Not For  → Permanent storage or public CDN-style hosting
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL, Prisma |
| Storage Backend | Telegram Bot API |
| Security | bcrypt, signed session cookies, rate limiting |
| Deployment | Docker, Vercel |

---

## Routes

```
/
/login
/register
/forgot-password
/upload
/dashboard
/dashboard/uploads
/dashboard/uploads/[id]
/share/[token]
/admin
/admin/uploads
/admin/users
/admin/reports
```

---

## Project Structure

```
DropLink41/
├── deploy/
├── prisma/
├── public/
├── scripts/
├── src/
├── Dockerfile
├── docker-compose.yml
└── vercel.json
```

---

## Setup Guide

1. Create a Telegram bot via BotFather and copy the token into `TELEGRAM_BOT_TOKEN`
2. Create a private Telegram channel or group per file category, or reuse one channel for all categories
3. Add the bot as an administrator with permission to post messages
4. Copy `.env.example` to `.env` and set the matching chat IDs plus every other required variable
5. Create the PostgreSQL database and set `DATABASE_URL`
6. Run `npm run prisma:generate` and `npm run prisma:migrate`
7. Generate the admin password hash with `npm run hash-password` and set `ADMIN_PASSWORD_HASH`
8. Start the dev server with `npm run dev`
9. Upload a small test file from `/upload`
10. Confirm the private Telegram destination receives the file
11. Confirm `/share/[token]` streams the download through the backend
12. Set `NEXT_PUBLIC_APP_URL` to your public origin before generating real links or QR codes

---

## Environment Variables

```
DATABASE_URL=
SESSION_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
NEXT_PUBLIC_APP_URL=http://localhost:3000

TELEGRAM_BOT_TOKEN=
TELEGRAM_API_BASE_URL=https://api.telegram.org

TELEGRAM_PHOTO_CHAT_ID=
TELEGRAM_VIDEO_CHAT_ID=
TELEGRAM_AUDIO_CHAT_ID=
TELEGRAM_DOCUMENT_CHAT_ID=
TELEGRAM_ARCHIVE_CHAT_ID=
TELEGRAM_OTHER_CHAT_ID=

MAX_UPLOAD_SIZE_MB=50
UPLOAD_RATE_LIMIT=30
LOGIN_RATE_LIMIT=5
```

---

## Development

```
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Runs at `http://localhost:3000`.

## Production

```
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
npm run start
```

Use HTTPS in production, set a strong `SESSION_SECRET`, and point `NEXT_PUBLIC_APP_URL` at your public domain.

## Docker

```
docker compose up --build
docker compose run --rm app npm run prisma:deploy
```

---

## Database

The Prisma schema includes:

- `User`
- `Upload`
- `UploadFile`
- `DownloadLog`
- `Notification`
- `AbuseReport`
- Supporting tables for Telegram destinations, security settings, audit logs, and recovery

---

## Security Notes

- Link passwords are hashed with bcrypt
- Session cookies are HTTP-only and signed with `SESSION_SECRET`
- Download attempts are logged with status, IP address, and user agent
- Upload and download endpoints are rate limited
- Telegram bot tokens, raw Telegram file URLs, and chat IDs never reach browser code
- Public downloads stream through `/api/droplink/file/[id]` only after share-token policy checks pass

---

## Roadmap / Ideas

- [ ] Bulk link management from the dashboard
- [ ] Custom expiry presets and reminders before a link expires
- [ ] Shareable QR codes on the share result page
- [ ] Multi-admin roles and permissions
- [ ] Storage usage dashboard per Telegram destination

---

<div align="center">

*DropLink — share it, limit it, let it expire.*

[github.com/Paim41/DropLink41](https://github.com/Paim41/DropLink41)


