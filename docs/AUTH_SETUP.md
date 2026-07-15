# Supabase Auth setup (Tuned & Threaded)

## Current local auth status

Confirm email is **off** (`mailer_autoconfirm: true`), which is correct for local Garage Profile testing. Sign-up creates a session immediately and redirects to `/garage/onboarding`.

## URL configuration

**Authentication → URL configuration**

| Setting | Value |
|---------|--------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

Add your production domain later the same way.

## Storage buckets (required for images)

Avatar, banner, and build photo uploads need Storage buckets. If uploads say **Bucket not found**, run this SQL in the Supabase SQL Editor:

[`supabase/migrations/20260715_storage_buckets.sql`](../supabase/migrations/20260715_storage_buckets.sql)

Confirm buckets exist under **Storage**: `avatars`, `banners`, `builds`, `garage`.

## Garage Profile centerpiece (required)

After the foundation migration, run:

[`supabase/migrations/20260715_garage_profile_centerpiece.sql`](../supabase/migrations/20260715_garage_profile_centerpiece.sql)

This adds vehicle pages, badges, timeline, gallery albums, saved builds, dyno/ET logs, and profile customization fields.

## OAuth (optional, after email works)

Enable in **Authentication → Providers**, then configure each provider’s client ID/secret:

- Google
- Apple
- Discord

Redirect URL for all: `http://localhost:3000/auth/callback`

App registry: `src/features/auth/providers.ts`

## Verify the loop

1. `npm run dev`
2. Open `/garage/sign-up`
3. Create account → onboarding (username + display name) → `/garage`
4. Optional: open `/garage/discover` for community builds and members
