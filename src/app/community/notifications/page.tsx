import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCommunityNotifications } from "@/features/community/actions";
import { CommunityNotifications } from "@/features/community/components/CommunityNotifications";

export default async function CommunityNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/community/notifications");

  const { notifications, error } = await loadCommunityNotifications();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          Community
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
          Alerts
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Likes, comments, replies, mentions, and new followers from the feed.
        </p>
      </div>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <CommunityNotifications notifications={notifications} />
    </div>
  );
}
