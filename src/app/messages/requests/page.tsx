import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMessageRequests } from "@/features/messages/actions";
import { MessagesInbox } from "@/features/messages/components/MessagesInbox";
import { MessagesShell } from "@/features/messages/components/MessagesShell";
import { MessagesEmptyPane } from "@/features/messages/components/MessageThread";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const dynamic = "force-dynamic";

export default async function MessageRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/messages/requests");

  const { items, error } = await loadMessageRequests();

  return (
    <>
      <SiteHeader />
      {error ? (
        <div className="mx-auto max-w-lg px-5 pt-28 text-sm text-accent">
          {error}
        </div>
      ) : (
        <MessagesShell
          userId={user.id}
          sidebar={
            <MessagesInbox
              initialItems={items}
              mode="requests"
              userId={user.id}
            />
          }
        >
          <MessagesEmptyPane />
        </MessagesShell>
      )}
    </>
  );
}
