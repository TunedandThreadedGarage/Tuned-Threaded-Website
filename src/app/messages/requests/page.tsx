import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMessageRequests } from "@/features/messages/actions";
import { MessagesInbox } from "@/features/messages/components/MessagesInbox";
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
      <div className="mx-auto w-full max-w-[800px] px-5 pb-20 pt-24 md:px-8">
        {error ? (
          <p className="text-sm text-accent">{error}</p>
        ) : (
          <MessagesInbox initialItems={items} mode="requests" />
        )}
      </div>
    </>
  );
}
