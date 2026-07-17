import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadInbox } from "@/features/messages/actions";
import { MessagesInbox } from "@/features/messages/components/MessagesInbox";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/messages");

  const { items, error } = await loadInbox();

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-[800px] px-5 pb-20 pt-24 md:px-8">
        {error ? (
          <p className="text-sm text-accent">{error}</p>
        ) : (
          <MessagesInbox initialItems={items} mode="inbox" />
        )}
      </div>
    </>
  );
}
