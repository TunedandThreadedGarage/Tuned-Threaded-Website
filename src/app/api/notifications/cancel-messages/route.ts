import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Cancel pending DM email notifications when the user opens /messages.
 * Invoked by MessagesShell on mount / focus while the tab is visible.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("cancel_pending_message_emails");
  if (error) {
    console.error(
      JSON.stringify({
        scope: "notify",
        event: "cancel_messages_failed",
        userId: user.id,
        error: error.message,
      }),
    );
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  console.info(
    JSON.stringify({
      scope: "notify",
      event: "email_cancelled",
      userId: user.id,
      reason: "messages_opened",
      cancelled: data ?? 0,
    }),
  );

  return NextResponse.json({ ok: true, cancelled: data ?? 0 });
}
