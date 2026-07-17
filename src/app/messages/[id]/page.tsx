import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadThread } from "@/features/messages/actions";
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

  const thread = await loadThread(id);
  if (thread.error || !thread.peer) {
    redirect("/messages");
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-[800px] px-5 pb-20 pt-24 md:px-8">
        <MessageThread
          conversationId={id}
          userId={user.id}
          initialMessages={thread.messages}
          initialPeer={thread.peer}
          initialPeerLastReadAt={thread.peerLastReadAt}
          initialStatus={thread.status}
        />
      </div>
    </>
  );
}
