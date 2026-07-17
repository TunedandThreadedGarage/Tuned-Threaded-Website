import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadInbox, loadThread } from "@/features/messages/actions";
import { MessagesInbox } from "@/features/messages/components/MessagesInbox";
import { MessagesShell } from "@/features/messages/components/MessagesShell";
import { MessageThread } from "@/features/messages/components/MessageThread";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const dynamic = "force-dynamic";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/garage/sign-in?next=/messages/${id}`);

  const [thread, inbox] = await Promise.all([loadThread(id), loadInbox()]);
  if (thread.error || !thread.peer) {
    redirect("/messages");
  }

  return (
    <>
      <SiteHeader />
      <MessagesShell
        userId={user.id}
        sidebar={
          <MessagesInbox
            initialItems={inbox.items}
            mode="inbox"
            activeId={id}
            userId={user.id}
          />
        }
      >
        <MessageThread
          conversationId={id}
          userId={user.id}
          initialMessages={thread.messages}
          initialPeer={thread.peer}
          initialPeerLastReadAt={thread.peerLastReadAt}
          initialStatus={thread.status}
        />
      </MessagesShell>
    </>
  );
}
