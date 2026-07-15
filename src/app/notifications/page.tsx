import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadNotificationsPage } from "@/features/notifications/actions";
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/notifications");

  const { items, nextCursor, error } = await loadNotificationsPage();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          Activity
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
          Notifications
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Real-time signals from your Garage, Community, Builds, Journal, and
          future Marketplace.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <NotificationCenter
        initialItems={items}
        initialCursor={nextCursor}
        userId={user.id}
      />
    </div>
  );
}
