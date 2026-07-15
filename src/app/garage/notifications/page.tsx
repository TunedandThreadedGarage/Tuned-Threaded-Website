import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { markNotificationRead } from "@/features/social/actions";
import { DeleteButton } from "@/components/ui/DeleteButton";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const { data: notes } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Follows, likes, and comments — clean and quiet.
        </p>
      </div>

      {notes && notes.length > 0 ? (
        <ul className="divide-y divide-border border border-border">
          {notes.map((note) => (
            <li
              key={note.id}
              className={`flex items-start justify-between gap-4 px-4 py-4 ${
                note.read_at ? "opacity-60" : ""
              }`}
            >
              <div>
                <p className="text-sm text-text">{note.message}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                  {note.type} · {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
              {!note.read_at ? (
                <DeleteButton
                  label="Mark read"
                  onDelete={markNotificationRead.bind(null, note.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="You're all caught up" description="No notifications yet." />
      )}
    </div>
  );
}
