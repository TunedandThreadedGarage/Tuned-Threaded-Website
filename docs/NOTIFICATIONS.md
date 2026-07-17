# Smart notification delivery

Last audited: 2026-07-17

Pipeline for activity:

```
event → notify() → preferences → in-app insert
                  → presence check
                  → online: stop
                  → away/offline: queue delayed email
                  → worker rechecks → Resend
```

Transactional mail (welcome, verify, password reset, orders/shipping, security)
always sends immediately via `sendMandatoryEmail()` and bypasses presence **and**
notification preferences.

Preferences UI: `/garage/settings/notifications`

## Presence lifecycle

Server tables:

- `public.user_presence_connections` — one row per browser tab (`connection_id`)
- `public.user_presence` — aggregated status used by the email scheduler

Client (`AuthProvider`):

| Event | Status |
|---|---|
| Login / tab visible + activity | `online` |
| Idle 10 minutes | `away` |
| Tab hidden | `away` |
| Tab close / logout / pagehide | `offline` (this connection) |
| pageshow / return to tab | `online` again |

Aggregation rules:

- Any fresh `online` connection (seen within 2 min) → user is **online**
- Else any fresh `away` connection (seen within 10 min) → **away**
- Else → **offline**

Going aggregate **online** cancels all pending queued emails (`user_returned`).

## Email delay matrix

| Category | Online | Away | Offline |
|---|---|---|---|
| Direct messages | In-app only | 5 minutes | 2 minutes |
| Follows / likes / comments / other social | In-app only | 10 minutes | 5 minutes |
| Welcome / reset / verify / orders / shipping / security | Immediate email | Immediate email | Immediate email |

## Cancellation matrix

Queued (not yet sent) emails are cancelled when:

| Trigger | Reason |
|---|---|
| User returns / becomes online | `user_returned` / `user_active` |
| User opens `/messages` | `messages_opened` |
| Message / conversation marked read | `message_read` |
| Notification opened / marked read | `notification_read` |
| Notification dismissed / deleted | `notification_dismissed` |
| Email preference disabled | `preference_disabled` |

Final recheck also runs inside `claim_due_notification_emails` and again in
the worker just before Resend.

## Queue state machine

`private.notification_email_queue`:

```
pending → sending → sent
                 → failed (retry with backoff until max_attempts)
                 → cancelled
sending (stale > 5 min) → pending (requeue) or failed
```

Fields of note: `attempts`, `max_attempts`, `provider_message_id`,
`idempotency_key`, `send_after`, `claimed_at`.

Audit trail: `private.notification_delivery_events`.

## Architecture

| Piece | Path |
|---|---|
| Central service | `src/lib/notify.ts` |
| Delivery policy | `src/lib/email/deliveryPolicy.ts` |
| Queue worker | `src/lib/email/queueProcessor.ts` |
| Cron endpoint | `POST /api/notifications/process-queue` |
| Presence heartbeat | `POST /api/presence` |
| Messages cancel | `POST /api/notifications/cancel-messages` |
| Migrations | `supabase/migrations/20260717050000_*`, `20260717060000_*` |

All social/message producers call `createNotification` / `notify`.
Do not call Resend from feature actions.

## Preference rules

Covered by `src/lib/email/channelDecision.test.ts`:

- Email off + In-app on → email skipped, in-app kept
- Email on + In-app off → email queued (instant), in-app skipped
- Frequency `daily` / `weekly` / `never` → no immediate email
- Master off → both optional channels off
- Mandatory types → force email + in-app regardless of prefs

## Ops / deployment

### Environment (Vercel)

```
RESEND_API_KEY=
EMAIL_FROM="Tuned & Threaded <hello@yourdomain.com>"
SUPABASE_SERVICE_ROLE_KEY=          # required to enqueue + process
NOTIFY_LOOKUP_SECRET=               # must match DB secret
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Database secrets (required — fail closed)

No secret or worker URL is committed. After migrations:

```sql
insert into private.app_secrets (key, value) values
  ('notify_lookup', '<same value as NOTIFY_LOOKUP_SECRET>'),
  ('notify_worker_url', 'https://www.tunedandthreaded.com/api/notifications/process-queue')
on conflict (key) do update set value = excluded.value;
```

`pg_cron` job `process-notification-emails` runs every minute and calls
`private.invoke_notification_email_worker()`, which no-ops until both secrets
exist.

### Smoke checks

```sql
-- Cron registered?
select jobname, schedule from cron.job where jobname = 'process-notification-emails';

-- Queue health
select status, count(*) from private.notification_email_queue group by status;

-- Recent delivery events
select event, presence_state, details, created_at
from private.notification_delivery_events
order by created_at desc
limit 50;
```

Manual drain:

```bash
curl -X POST "$SITE_URL/api/notifications/process-queue" \
  -H "Content-Type: application/json" \
  -H "x-notify-secret: $NOTIFY_LOOKUP_SECRET"
```

### Apply migrations

```bash
npx supabase db push
# then set private.app_secrets as above
```

## Coverage table

| Notification type | In-app | Email | Preference | Notes |
|---|---|---|---|---|
| New follower | Yes | Delayed | `followers` | Presence-aware |
| Direct message | Yes | Delayed | `messages` | 5m away / 2m offline |
| Likes / comments / replies / mentions | Yes | Delayed | per key | 10m away / 5m offline |
| Gallery / journal | Yes | Delayed | `gallery` / `journal` | |
| Order confirmation / shipping | Yes | Immediate | Always | Via `notifyOrderUpdate` |
| Password reset / welcome / verify | N/A | Immediate | Always | Via `sendMandatoryEmail` |
| Security alerts | Yes | Immediate | Always | |

## Tests

```bash
npm test
```

Includes:

- `src/lib/email/deliveryPolicy.test.ts` — presence + delay matrix
- `src/lib/email/channelDecision.test.ts` — preference matrix
- `src/lib/email/queueProcessor.test.ts` — claim/send/cancel/retry paths
