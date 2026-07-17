import { NextResponse } from "next/server";
import { processNotificationEmailQueue } from "@/lib/email/queueProcessor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Drains due queued notification emails. Invoked every minute by pg_cron
 * (pg_net http_post) and opportunistically by the presence heartbeat.
 * Guarded by NOTIFY_LOOKUP_SECRET. POST only.
 */
export async function POST(request: Request) {
  const secret = process.env.NOTIFY_LOOKUP_SECRET;
  const provided = request.headers.get("x-notify-secret");

  if (!secret || provided !== secret) {
    console.warn(
      JSON.stringify({
        scope: "notify.queue",
        event: "forbidden",
      }),
    );
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await processNotificationEmailQueue(25);
    console.info(
      JSON.stringify({
        scope: "notify.queue",
        event: "processed",
        ...result,
      }),
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown";
    console.error(
      JSON.stringify({
        scope: "notify.queue",
        event: "error",
        error,
      }),
    );
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
