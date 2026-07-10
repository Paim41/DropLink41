# DropLink

DropLink is a modern temporary file-sharing app built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, and Telegram Bot API storage support.

Users upload one or more files, configure expiry, password protection, recipient notes, and download limits, then receive a temporary public share link. Files are sent to a private Telegram channel or group through a bot. PostgreSQL stores metadata, policies, Telegram file references, access logs, notifications, and abuse reports.

## Features

- Premium responsive glassmorphism UI using the requested palette: `#FFFAF3`, `#FFF2DB`, `#FFE5BF`, `#F62440`
- Landing page, login, register, forgot password guidance, upload studio, share result, public download page, user dashboard, upload detail analytics, and admin routes
- Drag-and-drop multi-file uploads with progress, file previews, skeleton loading, hover transitions, focus glow, and press effects
- Temporary share links with expiry, optional password, maximum download count, recipient name, and note
- Telegram Bot API upload and protected backend download streaming
- Prisma models for users, uploads, upload files, download logs, notifications, and abuse reports
- In-app notifications and optional Telegram owner notifications
- Rate limiting, upload validation, password hashing, access logs, and protected management routes

## Routes

```text
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

## Local Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```text
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

Generate an admin password hash with:

```bash
npm run hash-password
```

## Telegram Bot Integration

1. Create a bot with BotFather and set `TELEGRAM_BOT_TOKEN`.
2. Create private Telegram channels or groups for each file category, or reuse one channel for all categories.
3. Add the bot as an administrator with permission to post messages.
4. Set the matching chat IDs in `.env`.
5. Upload a small test file from `/upload`.
6. Confirm that the private Telegram destination receives the file and that `/share/[token]` streams it through the backend.

Telegram is not the main database. It stores file bytes and supports notifications. PostgreSQL stores the durable metadata and access policy.

## Database

The Prisma schema includes:

- `User`
- `Upload`
- `UploadFile`
- `DownloadLog`
- `Notification`
- `AbuseReport`
- Existing support tables for Telegram destinations, security settings, audit logs, recovery, and file-manager compatibility

Apply migrations with:

```bash
npm run prisma:migrate
```

Production deployments should run:

```bash
npm run prisma:deploy
npm run build
npm run start
```

## Security Notes

- Link passwords are hashed with bcrypt.
- Session cookies are HTTP-only and signed with `SESSION_SECRET`.
- Download attempts are logged with status, IP address, and user agent.
- Upload and download endpoints are rate limited.
- Telegram bot tokens, raw Telegram file URLs, and chat IDs are never sent to browser code.
- Public downloads are streamed through `/api/droplink/file/[id]` after share-token policy checks.

## Deployment

Set all environment variables in your host, run Prisma deploy, then build and start the Next.js app. Use HTTPS in production and set `NEXT_PUBLIC_APP_URL` to the public origin so generated share links and QR codes point to the correct domain.
