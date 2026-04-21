# Boilerplate — Claude Context

## What This Is

A reusable **Next.js 15** boilerplate with authentication, database, file storage, push notifications, geocoding, and a full shadcn/ui component library. Extracted from a production app — all domain-specific code has been removed.

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Tailwind CSS** with custom HSL design tokens, dark mode
- **Shadcn/ui** (Radix UI primitives) — `components/ui/`
- **Framer Motion** for animations
- **Neon** (serverless Postgres) — database
- **Drizzle ORM** — schema in `lib/db/schema.ts`
- **Auth.js v5 (NextAuth)** — GitHub + Google OAuth, JWT sessions
- **OneSignal** — push notifications
- **Cloudflare R2** — file storage (via AWS S3 SDK)
- **Deployed on Vercel**

## What's Included

| Feature | Files |
|---------|-------|
| Auth (GitHub + Google OAuth) | `auth.ts`, `auth.config.ts`, `middleware.ts`, `app/login/page.tsx` |
| DB (Neon + Drizzle) | `lib/db/index.ts`, `lib/db/schema.ts`, `drizzle.config.ts` |
| File storage (R2 presigned uploads) | `lib/storage.ts`, `lib/convertHeic.ts`, `components/AttachmentsSheet.tsx`, `components/AttachmentViewer.tsx` |
| Push notifications (OneSignal) | `lib/onesignal.ts`, `components/OneSignalInit.tsx`, `components/NotificationPrompt.tsx`, `components/NotificationPreferences.tsx` |
| Location input (geocoding) | `components/LocationInput.tsx` |
| Settings sheet (theme + notifications + sign out) | `components/SettingsSheet.tsx`, `components/SettingsButton.tsx` |
| Pull-to-refresh | `components/PullToRefreshWrapper.tsx`, `hooks/usePullToRefresh.ts` |
| Splash screen | `components/SplashScreen.tsx` |
| 40+ shadcn/ui components | `components/ui/*` |
| Cron job stub | `app/api/cron/reminders/route.ts`, `vercel.json` |
| Server actions | `app/actions.ts` — attachment CRUD + notification preferences |

## Database Schema

| Table | Purpose |
|-------|---------|
| `user` | Auth.js adapter — user accounts |
| `account` | OAuth provider tokens |
| `session` | Session tokens |
| `verificationToken` | Email verification |
| `attachment` | File uploads (any entity) |
| `notification_preference` | Per-user notification toggles |

## Development

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Runs drizzle-kit migrate && next build
npm run db:generate  # Generate migration after editing lib/db/schema.ts
npm run db:migrate   # Apply pending migrations
npm run db:push      # LOCAL DEV ONLY — sync schema without migration files
npm run db:studio    # Drizzle Studio — browse DB in browser
```

## Schema Change Workflow

```
1. Edit lib/db/schema.ts
2. npm run db:generate
3. npm run db:migrate
4. git add drizzle/ lib/db/schema.ts && git commit
```

## Env Vars

See `.env.local.example` for all required environment variables.

## Deployment (Vercel)

1. Connect repo to Vercel
2. Add Neon via Vercel Marketplace
3. Set all env vars from `.env.local.example`
4. Set OAuth callback URLs to `https://your-app.vercel.app/api/auth/callback/github`
5. `git push` — Vercel auto-deploys
