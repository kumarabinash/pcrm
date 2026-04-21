# Boilerplate

A batteries-included **Next.js 15** boilerplate with:

- **Authentication** — Auth.js v5 with GitHub + Google OAuth
- **Database** — Neon (serverless Postgres) + Drizzle ORM
- **File Storage** — Cloudflare R2 with presigned uploads, HEIC conversion
- **Push Notifications** — OneSignal with per-user preferences
- **Location Input** — Geocoding autocomplete with lat/lng
- **UI Components** — 40+ shadcn/ui components, dark mode, mobile-first
- **Pull-to-refresh** — Native-feeling mobile interaction
- **Splash Screen** — Configurable app splash on load

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd boilerplate
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in your credentials (see file for instructions)

# 3. Run database migrations
npm run db:migrate

# 4. Start dev server
npm run dev
```

## See Also

- `CLAUDE.md` — Full technical context for AI assistants
- `.env.local.example` — All required environment variables
