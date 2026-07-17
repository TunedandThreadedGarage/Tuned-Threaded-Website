# Notification system coverage report

Last audited: 2026-07-17

Pipeline: activity → `createNotification` → `getChannelDecision` / `decideChannels` → optional in-app insert + `dispatchNotificationEmail` (branded templates via Resend).

Preferences UI: `/garage/settings/notifications` — Email and In-App toggles are independent per category (Push is reserved). Master off pauses optional channels; security/auth mail uses `force` and always sends.

| Notification type | In-app | Email | Preference toggle | Notes |
|---|---|---|---|---|
| New follower (`garage_follow` / `follow`) | Yes | Yes | `followers` | Instant follow; no pending request flow |
| Follow request | N/A | N/A | N/A | Not implemented — follows are immediate |
| New direct message (`message`) | Yes | Yes | `messages` | Fired from DM send when conversation is open |
| Message request (`message_request`) | Yes | Yes | `messages` | Fired when conversation status is `request` |
| Likes (`build_like` / `post_like` / `like`) | Yes | Yes | `likes` | Builds + community posts |
| Comments (`comment` / `build_comment`) | Yes | Yes | `comments` | Builds + community |
| Replies (`reply` / `build_reply`) | Yes | Yes | `replies` | Community + build comment threads |
| Mentions (`mention`) | Yes | Yes | `mentions` | Community + build body mentions |
| Build interactions (`build_follow`, `build_save`, `build_like`, timeline likes) | Yes | Yes | `build_follows` / `build_saves` / `likes` | Hub + social actions |
| Gallery interactions (`gallery_like`) | Yes | Yes | `gallery` | Photo like on public gallery; comments typed for future |
| Journal interactions (`journal_like` / `journal_comment`) | Yes | Yes | `journal` | Hub journal + vehicle timeline likes/comments |
| Order confirmation (`order_confirmation`) | Yes | Yes | `orders` | Via `notifyOrderUpdate` / `sendOrderEmail` |
| Shipping updates (`order_shipped` / `order_delivered` / `shipping_update`) | Yes | Yes | `orders` | Same path; honors email + in-app independently |
| Password reset | N/A (auth) | Yes | Always (forced) | `/garage/forgot-password` → branded Resend template |
| Welcome email | N/A | Yes | Always (forced) | Sent on signup |
| Account verification | N/A (auth) | Yes | Always (forced) | Branded verify when confirmation required |

## Preference rules (automated)

Covered by `src/lib/email/channelDecision.test.ts`:

- Email off + In-app on → email skipped, in-app kept
- Email on + In-app off → email sent (instant), in-app skipped
- Frequency `daily` / `weekly` / `never` → no immediate email
- Master off → both optional channels off
- `force: true` → security/auth mail bypasses prefs

Run: `npm test`

## Email branding

Dark layout in `src/lib/email/brand.ts`: TT mark, Georgia/Helvetica stack, accent CTA, footer links to notification + communication settings.

## Ops notes

- Activity emails need a recipient lookup: set `SUPABASE_SERVICE_ROLE_KEY` **or** `NOTIFY_LOOKUP_SECRET` (matches `private.app_secrets.notify_lookup`).
- Welcome/verify/reset emails pass the address directly and do not need lookup.
- Followers + messages both flow through `createNotification` / `notify()` in `src/lib/notify.ts` — never call Resend from feature actions.
- Structured logs: `[notify:event_received]`, `[notify:preference_checked]`, `[notify:in_app_created]`, `[notify:email_queued]`, `[notify:resend_calling]`, `[notify:resend_success]`.
- Apply migration `supabase/migrations/20260717_notification_email_pipeline.sql` for private email sync + follower email defaults.
- Wire Shopify/Printify webhooks to `notifyOrderUpdate` when fulfillment events go live.
