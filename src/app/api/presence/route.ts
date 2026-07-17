import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processNotificationEmailQueue } from "@/lib/email/queueProcessor";

export const dynamic = "force-dynamic";

/**
 * Presence heartbeat. Called by AuthProvider on login, activity changes,
 * visibility changes, and on a keep-alive interval.
 *
 * Body: { status: "online"|"away"|"offline", connectionId?: string }
 *
 * Server aggregates all tab connections for the user. Going aggregate
 * "online" cancels queued emails (inside update_user_presence).
 *
 * Also opportunistically drains a small batch of due queued emails.
 */
export async function POST(request: Request) {
  let status = "online";
  let connectionId = "default";

  try {
    const body = await request.json();
    if (
      body &&
      typeof body.status === "string" &&
      ["online", "away", "offline"].includes(body.status)
    ) {
      status = body.status;
    }
    if (body && typeof body.connectionId === "string" && body.connectionId.trim()) {
      connectionId = body.connectionId.trim().slice(0, 64);
    }
  } catch {
    // sendBeacon may deliver an opaque body; default to online.
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const { data: aggregate, error } = await supabase.rpc("update_user_presence", {
    p_status: status,
    p_connection_id: connectionId,
  });
  if (error) {
    // Fallback for DBs that only have the single-arg overload.
    const fallback = await supabase.rpc("update_user_presence", {
      p_status: status,
    });
    if (fallback.error) {
      console.error(
        JSON.stringify({
          scope: "presence",
          event: "error",
          userId: user.id,
          status,
          connectionId,
          error: fallback.error.message,
        }),
      );
      return NextResponse.json(
        { ok: false, error: fallback.error.message },
        { status: 500 },
      );
    }
  }

  console.info(
    JSON.stringify({
      scope: "presence",
      event: "updated",
      userId: user.id,
      status,
      connectionId,
      aggregate: aggregate ?? status,
    }),
  );

  // Fire-and-forget queue drain (bounded; safe to run concurrently).
  void processNotificationEmailQueue(5).catch(() => {});

  return NextResponse.json({
    ok: true,
    status,
    aggregate: aggregate ?? status,
  });
}
