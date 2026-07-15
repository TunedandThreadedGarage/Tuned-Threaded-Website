# Tuned & Threaded

Official website for **Tuned & Threaded** — premium garage lifestyle brand with a **Garage Profile** member system.

## Stack

- Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion
- Supabase Auth · Postgres · Storage · RLS

## Getting started

```bash
npm install
cp .env.example .env.local
# Paste your Supabase Project URL and anon key into .env.local
npm run dev
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon / publishable** key into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In the SQL Editor, run migrations **in order**:
   - [`supabase/migrations/20260714_garage_profile_foundation.sql`](supabase/migrations/20260714_garage_profile_foundation.sql)
   - [`supabase/migrations/20260715_storage_buckets.sql`](supabase/migrations/20260715_storage_buckets.sql) (if buckets missing)
   - [`supabase/migrations/20260715_garage_profile_centerpiece.sql`](supabase/migrations/20260715_garage_profile_centerpiece.sql) **required for vehicles pages, badges, timeline, gallery**
4. Follow **[docs/AUTH_SETUP.md](docs/AUTH_SETUP.md)** — especially:
   - Site URL + redirect `http://localhost:3000/auth/callback`
   - Disable **Confirm email** while developing (avoids email rate limits)
   - Enable Google / Apple / Discord later when ready
5. Confirm Storage buckets `avatars`, `banners`, `builds`, and `garage` exist.

## Garage Profile routes

| Path | Description |
|------|-------------|
| `/garage/sign-up` · `/garage/sign-in` | Auth |
| `/garage/onboarding` | Username + display name |
| `/garage` | Your Garage Profile (hero, stats, vehicles, builds, gallery) |
| `/garage/discover` | Community builds + members |
| `/garage/[username]` | Public profile |
| `/garage/[username]/vehicles/[id]` | Dedicated vehicle page |
| `/garage/[username]/gallery` | Public gallery |
| `/garage/[username]/followers` · `.../following` | Social lists |
| `/garage/gallery` | Manage albums & photos |
| `/garage/settings` | Profile customization, vehicles, parts |
| `/garage/builds` · `/garage/builds/new` · `/garage/builds/[id]` | Builds (progress, save, share) |
| `/garage/journal` | Private journal |
| `/garage/wishlist` · `/garage/cart` · `/garage/orders` | Commerce scaffolds |
| `/garage/notifications` | Alerts |
| `/auth/callback` | OAuth PKCE callback |

Auth providers are registered in [`src/features/auth/providers.ts`](src/features/auth/providers.ts) — modular for future providers.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Brand

Read [`BRAND.md`](BRAND.md) before UI work.

## Repository

https://github.com/TunedandThreadedGarage/Tuned-Threaded-Website
